
import { Router } from 'express'
import { validate } from '../../middleware/validate.middleware.js'
import { createSession } from './debate.controller.js'
import { createSessionSchema } from './debate.schema.js'

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

router.post('/', validate(createSessionSchema), createSession)

export default router
