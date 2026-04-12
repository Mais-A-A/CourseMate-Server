import { Router } from 'express'
import { chat } from '../controllers/ai.controller.js'
import { requireAuth } from '../middlewares/auth.middleware.js'
import { ChatSchema } from '../schemas/ai.schema.js'
import { validateRequest } from '../middlewares/validation.js'
const router = Router()

router.post('/chat', validateRequest(ChatSchema), requireAuth(), chat)

export default router
