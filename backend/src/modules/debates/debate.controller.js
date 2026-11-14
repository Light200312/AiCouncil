import mongoose from 'mongoose'
import Session from './session.model.js'
import Expert from '../experts/expert.model.js'
import Domain from '../domains/domain.model.js'
import Message from './message.model.js'
import { randomUUID } from 'node:crypto'
import { generateResponse } from '../../services/llm.service.js'
const allocateMessageSequence = async (sessionId, ownerId) => {
  const latestMessage = await Message.findOne({ sessionId })
    .sort({ sequence: -1 })
    .select('sequence')
    .lean()

  await Session.updateOne(
    { _id: sessionId, ownerId },
    { $max: { messageSequence: latestMessage?.sequence ?? 0 } }
  )

  const updatedSession = await Session.findOneAndUpdate(
    {
      _id: sessionId,
      ownerId,
      status: { $nin: ['completed', 'abandoned'] },
    },
    { $inc: { messageSequence: 1 } },
    { new: true }
  ).select('messageSequence').lean()

  return updatedSession?.messageSequence ?? null
}
export const addUserMessage = async (req, res, next) => {
  try {
    const { sessionId } = req.validated.params
    const { content } = req.validated.body
    const ownerId = req.user.userId

    const session = await Session.findOne({
      _id: sessionId,
      ownerId,
    }).select('status').lean()

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Debate session not found.',
      })
    }

    if (session.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Start the debate before sending a message. Completed debates cannot accept messages.',
      })
    }

    const sequence = await allocateMessageSequence(sessionId, ownerId)

    if (!sequence) {
      return res.status(409).json({
        success: false,
        message: 'This debate is no longer active.',
      })
    }

    const message = await Message.create({
      sessionId,
      sequence,
      speakerType: 'user',
      speakerName: 'You',
      content,
    })

    return res.status(201).json({
      success: true,
      data: { message },
    })
  } catch (error) {
    return next(error)
  }
}

export const createSession = async (req, res, next) => {
  try {
    const { topic, domains, experts, mode, argumentLimit } = req.validated.body
    const userId = req.user.userId

    // Validate selected domains.
    const domainDocs = await Domain.find({
      _id: { $in: domains },
    }).select('name').lean()

    if (domainDocs.length !== domains.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more selected domains are invalid.',
      })
    }

    // Validate IDs of saved experts.
    const savedIds = experts
      .filter(expert => !expert.isTemporary)
      .map(expert => expert._id)

    if (
      savedIds.some(id => !mongoose.isValidObjectId(id)) ||
      new Set(savedIds).size !== savedIds.length
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or duplicate expert selection.',
      })
    }

    // Only allow built-in experts and this user's custom experts.
    const savedExperts = await Expert.find({
      _id: { $in: savedIds },
      isActive: true,
      $or: [{ createdBy: null }, { createdBy: userId }],
    }).populate('expertise', 'name').lean()

    if (savedExperts.length !== savedIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more selected experts are unavailable.',
      })
    }

    const savedById = new Map(
      savedExperts.map(expert => [expert._id.toString(), expert])
    )

    // Snapshot all selected experts into the session.
    const council = experts.map((selected, index) => {
      const expert = selected.isTemporary
        ? selected
        : savedById.get(selected._id)

      const expertise = (expert.expertise || []).map(item =>
        typeof item === 'string' ? item : item.name || item._id?.toString()
      )

      return {
        ref: `e${index + 1}`,
        expertId: selected.isTemporary ? null : expert._id,
        name: expert.name,
        role: expert.role,
        description: expert.description || '',
        expertise,
        isHumanLike: Boolean(expert.isHumanLike),
        persona: {
          backstory: expert.backstory || '',
          speechPattern: expert.speechPattern || '',
          characterTraits: expert.characterTraits || [],
          inspiredBy: expert.inspiredBy || '',
          systemPrompt: expert.systemPrompt || '',
        },
      }
    })

    const session = await Session.create({
      ownerId: userId,
      title: topic.slice(0, 120),
      topic,
      domains: domainDocs.map(domain => domain.name),
      council,
      mode,
     argumentLimit: mode === 'manual' ? null : (argumentLimit ?? 10),
autoTurnsRemaining: mode === 'auto' ? (argumentLimit ?? 10) : null,
    })

    res.status(201).json({
      success: true,
      message: 'Debate session created.',
      data: { session },
    })
  } catch (error) {
    next(error)
  }
}
export const updateSessionMode = async (req, res, next) => {
  try {
    const { sessionId } = req.validated.params
    const { mode, argumentLimit } = req.validated.body
    const ownerId = req.user.userId

    const currentSession = await Session.findOne({ _id: sessionId, ownerId })
      .select('status turnLockAt messageSequence')
      .lean()

    if (!currentSession) {
      return res.status(404).json({
        success: false,
        message: 'Debate session not found.',
      })
    }

    if (currentSession.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Only active debates can change modes.',
      })
    }
// //fetch total expert turns already happened
//     const expertTurns = await Message.countDocuments({
//       sessionId,
//       speakerType: 'expert',
//     })
// //check if arg limit provided is already  reached
//     if (mode === 'auto' && argumentLimit <= expertTurns) {
//       return res.status(400).json({
//         success: false,
//         message: `The response limit must be greater than the ${expertTurns} expert responses already generated.`,
//       })
//     }

    const staleLockTime = new Date(Date.now() - 3 * 60 * 1000)

    const session = await Session.findOneAndUpdate(
      {
        _id: sessionId,
        ownerId,
        status: 'active',
        $and: [
          {
            $or: [
              { turnLockAt: null },
              { turnLockAt: { $lt: staleLockTime } },
            ],
          },
          {
            $or: [
              { messageSequence: currentSession.messageSequence ?? 0 },
              { messageSequence: { $exists: false } },
            ],
          },
        ],
      },
      {
       $set: {
  mode,
  argumentLimit: mode === 'auto' ? argumentLimit : null,
  autoTurnsRemaining: mode === 'auto' ? argumentLimit : null,
},
        $unset: {
          turnLockToken: 1,
          turnLockAt: 1,
        },
      },
      { new: true, runValidators: true },
    )
      .select('-ownerId -turnLockToken -turnLockAt')
      .lean()

    if (!session) {
      return res.status(409).json({
        success: false,
        message: 'A turn is generating or the debate changed. Wait for it to finish, then try again.',
      })
    }

    return res.json({
      success: true,
      data: { session },
    })
  } catch (error) {
    return next(error)
  }
}
export const getSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params

    if (!mongoose.isValidObjectId(sessionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID.',
      })
    }

    const session = await Session.findOne({
      _id: sessionId,
      ownerId: req.user.userId,
    }).lean()

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Debate session not found.',
      })
    }

    const messages = await Message.find({ sessionId })
      .sort({ sequence: 1 })
      .lean()

    res.json({
      success: true,
      data: { session, messages },
    })
  } catch (error) {
    next(error)
  }
}

export const generateNextTurn = async (req, res, next) => {
  const { sessionId } = req.params
  const ownerId = req.user.userId
  let lockToken

  try {
    if (!mongoose.isValidObjectId(sessionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID.',
      })
    }

    lockToken = randomUUID()
    const now = new Date()
    const staleLockTime = new Date(now.getTime() - 3 * 60 * 1000)

    const session = await Session.findOneAndUpdate(
      {
        _id: sessionId,
        ownerId,
        status: { $nin: ['completed', 'abandoned'] },
        $or: [
          { turnLockAt: null },
          { turnLockAt: { $lt: staleLockTime } },
        ],
      },
      {
        $set: {
          turnLockToken: lockToken,
          turnLockAt: now,
        },
      },
      { new: true },
    )

    if (!session) {
      const existingSession = await Session.findOne({ _id: sessionId, ownerId })
        .select('status')
        .lean()

      if (!existingSession) {
        return res.status(404).json({
          success: false,
          message: 'Debate session not found.',
        })
      }

      if (['completed', 'abandoned'].includes(existingSession.status)) {
        return res.status(400).json({
          success: false,
          message: 'This debate is no longer active.',
        })
      }

      return res.status(409).json({
        success: false,
        message: 'A debate turn is already being generated.',
      })
    }
    if (session.mode === 'auto' && session.autoTurnsRemaining == null) {
  session.autoTurnsRemaining = session.argumentLimit ?? 10
}

if (session.mode === 'auto' && session.autoTurnsRemaining <= 0) {
  session.mode = 'manual'
  session.argumentLimit = null
  session.autoTurnsRemaining = null
  session.status = 'active'
  await session.save()

  return res.json({
    success: true,
    message: 'Auto run finished. Debate switched to manual mode.',
    data: {
      completed: false,
      mode: 'manual',
      autoStopped: true,
    },
  })
}
    const messages = await Message.find({ sessionId })
      .sort({ sequence: 1 })
      .lean()

    const expertTurns = messages.filter(
      message => message.speakerType === 'expert',
    ).length

    // if (session.argumentLimit && expertTurns >= session.argumentLimit) {
    //   session.status = 'active';
    //    session.argumentLimit = null
    //   await session.save()

    //   return res.json({
    //      success: true,
    // message: 'Auto limit reached. Debate switched to manual mode.',
    // data: {
    //   completed: false,
    //   mode: 'manual',
    //   autoStopped: true,
    // },
    //   })
    // }

    const expert = session.council[expertTurns % session.council.length]
    const conversation = messages
      .map(message => `${message.speakerName}: ${message.content}`)
      .join('\n\n')

    const prompt = `
Debate topic: ${session.topic}
Relevant domains: ${session.domains.join(', ')}

Council members:
${session.council.map(member => `${member.name} (${member.role})`).join('\n')}

Conversation so far:
${conversation || 'The debate has not started yet.'}

It is now ${expert.name}'s turn.

Respond as this expert. Address the topic directly, consider previous arguments, and contribute a meaningful argument. Do not speak for other experts. Keep the response focused and conversational.
`

    const persona = expert.persona || {}
    const systemPrompt = [
      `You are ${expert.name}, ${expert.role}.`,
      expert.description,
      persona.backstory,
      persona.speechPattern
        ? `Speaking style: ${persona.speechPattern}`
        : '',
      persona.characterTraits?.length
        ? `Character traits: ${persona.characterTraits.join(', ')}`
        : '',
      persona.systemPrompt,
    ].filter(Boolean).join('\n')

    const content = await generateResponse(prompt, systemPrompt)
    const sequence = await allocateMessageSequence(sessionId, ownerId)

    if (!sequence) {
      return res.status(409).json({
        success: false,
        message: 'This debate is no longer active.',
      })
    }

    const message = await Message.create({
      sessionId,
      sequence,
      speakerType: 'expert',
      speakerRef: expert.ref,
      speakerName: expert.name,
      content,
    })

session.status = 'active'

let autoStopped = false

if (session.mode === 'auto') {
  session.autoTurnsRemaining = Math.max(
    0,
    session.autoTurnsRemaining - 1,
  )

  if (session.autoTurnsRemaining === 0) {
    session.mode = 'manual'
    session.argumentLimit = null
    session.autoTurnsRemaining = null
    autoStopped = true
  }
}

await session.save()

return res.json({
  success: true,
  data: {
    message,
    completed: false,
    mode: session.mode,
    autoStopped,
  },
})
  } catch (error) {
    return next(error)
  } finally {
    if (lockToken) {
      try {
        await Session.updateOne(
          { _id: sessionId, ownerId, turnLockToken: lockToken },
          { $unset: { turnLockToken: 1, turnLockAt: 1 } },
        )
      } catch (error) {
        console.error('Failed to release debate turn lock:', error)
      }
    }
  }
}