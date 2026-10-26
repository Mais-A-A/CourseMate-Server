import app from './app.js'
import swaggerUi from 'swagger-ui-express'
import { swaggerSpec } from './swagger.js'

import 'dotenv/config'
import { startFollowUpReminders } from './src/features/supervisor/reminders.service.js'
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
process.on('unhandledRejection', (reason) => {
  console.error('[Process] unhandled rejection:', reason)
})
process.on('uncaughtException', (err) => {
  console.error('[Process] uncaught exception:', err)
  process.exit(1)
})
const PORT = process.env.SERVER_PORT || 3001
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
  startFollowUpReminders()
})
