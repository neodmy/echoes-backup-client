module.exports = {
  logger: { transport: null },
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
};
