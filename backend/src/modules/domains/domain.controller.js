
import Domain from './domain.model.js'

export const getDomains = async (req, res, next) => {
  try {
    const search = req.query.search?.trim()

    const filter = search
      ? { name: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }
      : {}

    const domains = await Domain.find(filter)
      .select('name slug description')
      .sort({ name: 1 })
      .limit(30)
      .lean()

    res.json({
      success: true,
      data: { domains },
    })
  } catch (error) {
    next(error)
  }
}
