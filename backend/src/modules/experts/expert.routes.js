
import { Router } from 'express'
import { getExperts, createExpert } from './expert.controller.js'
import { validate } from '../../middleware/validate.middleware.js'
import {
  getExpertsSchema,
  createExpertSchema,
} from './expert.schema.js'

const router = Router()

router.get('/', validate(getExpertsSchema), getExperts)
router.post('/', validate(createExpertSchema), createExpert)

export default router
