const path = require('path');

module.exports = {
  logger: { transport: null },
  mongo: {
    url: 'mongodb://localhost:27018',
    options: { useUnifiedTopology: true },
  },
  store: {
    collection: 'fail',
    database: 'echoes-backup',
  },
  slack: {
    status: 'active',
    token: 'token',
    channel: 'channel',
  },
  sftp: {
    hostname: 'localhost',
    port: 2222,
    username: 'username',
    password: 'password',
  },
  controller: {
    clientId: 'Fuenlabrada',
    remotePath: 'echoes/temp',
    localPath: path.join(__dirname, '..', 'test', 'fixtures', 'temp', 'echoes'),
    removalOffset: 21,
    initCsv: process.env.INITIAL_CSV || 'active',
    initUpload: process.env.INITIAL_UPLOAD || 'active',
  },
};
