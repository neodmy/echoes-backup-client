module.exports = {
  server: {
    host: '0.0.0.0',
    port: 4000,
  },
  mongodb: {
    url: process.env.MONGO_CONNECTION_STRING || 'mongodb://localhost:27017',
    options: { useUnifiedTopology: true },
  },
  store: {
    daily: {
      collections: {
        success: process.env.SUCCESS_COLLECTION_NAME || 'success',
        fail: process.env.FAIL_COLLECTION_NAME || 'fail',
      },
      databaseName: process.env.DAILY_DATABASE_NAME || 'echoes-backup',
    },
  },
  routes: {
    admin: {
      swaggerOptions: {
        swaggerDefinition: {
          info: {
            description: 'Documentation for echoes-backup-client',
            title: 'echoes-backup-client',
            version: '1.0.0',
          },
          host: process.env.SERVICE_ENV || 'localhost:4000',
          basePath: '/v1',
          produces: ['application/json'],
          schemes: ['http'],
          securityDefinitions: {
            JWT: {
              type: 'apiKey',
              in: 'header',
              name: 'Authorization',
              description: '',
            },
          },
        },
      },
    },
  },
  logger: {
    transport: 'console',
    include: [
      'tracer',
      'timestamp',
      'level',
      'message',
      'error.message',
      'error.code',
      'error.stack',
      'request.url',
      'request.headers',
      'request.params',
      'request.method',
      'response.statusCode',
      'response.headers',
      'response.time',
      'process',
      'system',
      'package.name',
      'service',
    ],
    exclude: ['password', 'secret', 'token', 'request.headers.cookie', 'dependencies', 'devDependencies'],
  },
};
