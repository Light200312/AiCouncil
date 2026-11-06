
import mongoose from 'mongoose'
import Session from './session.model.js'
import Expert from '../experts/expert.model.js'
import Domain from '../domains/domain.model.js'

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
