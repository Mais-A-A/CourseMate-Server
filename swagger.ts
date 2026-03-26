import swaggerJsdoc from 'swagger-jsdoc'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Documentation',
      version: '1.0.0',
    },
    tags: [
      { name: 'Users', description: 'User management' },
      { name: 'Notifications', description: 'Notification management' },
      { name: 'Academic Warnings', description: 'Academic warning management' },
      { name: 'Academic Rules', description: 'Academic rule management' },
    ],
  },
  apis: ['./dist/src/routers/*.js'],
}

export const swaggerSpec = swaggerJsdoc(options)
