
import { Router } from 'express'
import { validate } from '../../middleware/validate.middleware.js'

import { createSessionSchema } from './debate.schema.js'
import {
  createSession,
  getSession,
  generateNextTurn,
} from './debate.controller.js'

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
router.get('/:sessionId', getSession)
router.post('/:sessionId/next', generateNextTurn)
export default router
