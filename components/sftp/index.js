const System = require('systemic');
const initSftp = require('./sftp');

module.exports = new System({ name: 'sftp' })
  .add('sftp', initSftp())
  .dependsOn('config', 'logger');
