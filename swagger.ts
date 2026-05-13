import swaggerJsdoc from 'swagger-jsdoc'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CourseMate API Documentation',
      version: '1.0.0',
      description: 'API documentation for CourseMate server routes.',
    },
    servers: [
      {
        url: '/',
        description: 'Current server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
          description: 'JWT token stored in cookie',
        },
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Users', description: 'User management' },
      { name: 'Departments', description: 'Department management' },
      { name: 'Courses', description: 'Course management' },
      { name: 'Course Sections', description: 'Course section management' },
      { name: 'Schedules', description: 'Schedule management' },
      { name: 'Academic Plans', description: 'Academic plan management' },
      { name: 'Important Dates', description: 'Important dates management' },
      { name: 'Notifications', description: 'Notification management' },
      { name: 'Academic Warnings', description: 'Academic warning management' },
      { name: 'Academic Rules', description: 'Academic rule management' },
      { name: 'AI', description: 'AI assistant endpoints' },
      {
        name: 'AI Recommendations',
        description: 'AI recommendation management',
        withCredentials: true,
      },
    ],
  },
  apis: ['./src/routes/*.ts', './dist/src/routes/*.js'],
}

export const swaggerSpec = swaggerJsdoc(options)
