module.exports = {
  server: {
    host: '0.0.0.0',
    port: 4000,
  },
  mongo: {
    url: process.env.MONGO_CONNECTION_STRING,
    options: { useUnifiedTopology: true },
  },
  store: {
    collection: 'results',
    database: 'echoes-backup',
  },
  slack: {
    token: process.env.SLACK_TOKEN,
    channel: process.env.SLACK_CHANNEL,
  },
  sftp: {
    hostname: process.env.SFTP_HOSTNAME,
    port: process.env.SFTP_PORT,
    username: process.env.SFTP_USERNAME,
    password: process.env.SFTP_PASSWORD,
  },
  controller: {
    clientId: process.env.CLIENT_ID,
    remotePath: process.env.REMOTE_DIRECTORY,
    localPath: '/echoes',
    removalOffset: process.env.REMOVAL_OFFSET,
    initCsv: process.env.INITIAL_CSV || 'inactive',
    initUpload: process.env.INITIAL_UPLOAD || 'inactive',
  },
  mailer: {
    senderInfo: {
      service: process.env.SENDER_SERVICE,
      auth: {
        user: process.env.SENDER_USER,
        pass: process.env.SENDER_PASSWORD,
      },
    },
    reportEmails: process.env.REPORT_EMAILS,
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
