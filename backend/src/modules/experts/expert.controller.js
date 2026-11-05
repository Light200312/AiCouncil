
import Expert from './expert.model.js'
import Domain from '../domains/domain.model.js'

export const getExperts = async (req, res, next) => {
  try {
    const { domain, domains, type, search } = req.validated.query
    const userId = req.user.userId

    const filter = {
      isActive: true,
      $or: [
        { createdBy: null },
        { createdBy: userId },
      ],
    }

     const domainIds = domains.length ? domains : domain ? [domain] : []

    if (domainIds.length) {
      filter.expertise = { $in: domainIds }
    }


    if (type === 'ai') filter.isHumanLike = false
    if (type === 'human') filter.isHumanLike = true

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      filter.$and = [{
        $or: [
          { name: { $regex: escaped, $options: 'i' } },
          { role: { $regex: escaped, $options: 'i' } },
        ],
      }]
    }

    const experts = await Expert.find(filter)
      .populate('expertise', 'name slug')
      .sort({ name: 1 })
      .lean()

    res.json({
      success: true,
      data: { experts },
    })
  } catch (error) {
    next(error)
  }
}

export const createExpert = async (req, res, next) => {
  try {
    const data = req.validated.body

    const domainCount = await Domain.countDocuments({
      _id: { $in: data.expertise },
    })

    if (domainCount !== data.expertise.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more expertise domains are invalid',
      })
    }

    const expert = await Expert.create({
      ...data,
      createdBy: req.user.userId,
    })

    await expert.populate('expertise', 'name slug')

    res.status(201).json({
      success: true,
      message: 'Expert created successfully',
      data: { expert },
    })
  } catch (error) {
    next(error)
  }
}
