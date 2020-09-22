const System = require('systemic');
const initCompressionController = require('./compressionController');
const initUploadController = require('./uploadController');
const initTaskController = require('./taskController');

module.exports = new System({ name: 'controller' })
  .add('compressor', initCompressionController())
  .dependsOn({ component: 'config', source: 'controller' }, 'logger', 'archiver', 'store', 'slackBot')
  .add('uploader', initUploadController())
  .dependsOn({ component: 'config', source: 'controller' }, 'logger', 'archiver', 'store', 'slackBot', 'sftp')
  .add('controller', initTaskController())
  .dependsOn('config', 'logger', 'archiver', 'compressor', 'uploader');
