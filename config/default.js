module.exports = {
  server: {
    host: '0.0.0.0',
    port: 4000,
  },
  mongo: {
    url: process.env.MONGO_CONNECTION_STRING || 'mongodb://localhost:27018',
    options: { useUnifiedTopology: true },
  },
  store: {
    collection: process.env.FAIL_COLLECTION_NAME || 'fail',
    database: process.env.DAILY_DATABASE_NAME || 'echoes-backup',
  },
  slack: {
    status: process.env.SLACK_STATUS || 'active',
    token: process.env.SLACK_TOKEN,
    channel: process.env.SLACK_CHANNEL,
  },
  sftp: {
    hostname: process.env.SFTP_HOSTNAME || 'localhost',
    port: process.env.SFTP_PORT || 2222,
    username: process.env.SFTP_USERNAME || 'username',
    password: process.env.SFTP_PASSWORD || 'password',
  },
  controller: {
    clientId: process.env.CLIENT_ID,
    remotePath: process.env.REMOTE_DIRECTORY || 'echoes/temp',
    localPath: process.env.ECHOES_SOURCE_DIRECTORY,
    removalOffset: process.env.REMOVAL_OFFSET || 21,
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
