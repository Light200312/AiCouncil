
import { Router } from 'express'

const router = Router()

const presets = [
  { _id: 'ai-legal-personhood', title: 'Should AI be granted legal personhood?' },
  { _id: 'universal-basic-income', title: 'Is universal basic income inevitable?' },
  { _id: 'absolute-power', title: 'Does absolute power always corrupt?' },
  { _id: 'privacy', title: 'Is privacy a relic of the past?' },
  { _id: 'mars-colonization', title: 'Should humanity colonize Mars?' },
]

router.get('/presets', (req, res) => {
  res.json({
    success: true,
    data: { presets },
  })
})

export default router
