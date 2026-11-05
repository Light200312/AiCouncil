
import { Router } from 'express'
import { getDomains } from './domain.controller.js'

const router = Router()

router.get('/', getDomains)

export default router
