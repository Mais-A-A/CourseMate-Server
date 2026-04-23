import app from './app.js'
import swaggerUi from 'swagger-ui-express'
import { swaggerSpec } from './swagger.js'

import 'dotenv/config'
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
const PORT = process.env.SERVER_PORT || 3001
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
