
import mongoose from 'mongoose'
import Session from './session.model.js'
import Expert from '../experts/expert.model.js'
import Domain from '../domains/domain.model.js'
import Message from './message.model.js'
import { generateResponse } from '../../services/llm.service.js'




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
    })

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Debate session not found.',
      })
    }

    if (session.status === 'completed' || session.status === 'abandoned') {
      return res.status(400).json({
        success: false,
        message: 'This debate is no longer active.',
      })
    }

    const messages = await Message.find({ sessionId })
      .sort({ sequence: 1 })
      .lean()

    const expertTurns = messages.filter(
      message => message.speakerType === 'expert'
    ).length

    if (
      session.argumentLimit &&
      expertTurns >= session.argumentLimit
    ) {
      session.status = 'completed'
      await session.save()

      return res.json({
        success: true,
        message: 'Argument limit reached.',
        data: { completed: true },
      })
    }

    // Select experts in council order.
    const expert = session.council[
      expertTurns % session.council.length
    ]

    const conversation = messages.map(message =>
      `${message.speakerName}: ${message.content}`
    ).join('\n\n')

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

    const message = await Message.create({
      sessionId,
      sequence: messages.length + 1,
      speakerType: 'expert',
      speakerRef: expert.ref,
      speakerName: expert.name,
      content,
    })

    session.status = 'active'

    if (
      session.argumentLimit &&
      expertTurns + 1 >= session.argumentLimit
    ) {
      session.status = 'completed'
    }

    await session.save()

    res.json({
      success: true,
      data: {
        message,
        completed: session.status === 'completed',
      },
    })
  } catch (error) {
    next(error)
  }
}