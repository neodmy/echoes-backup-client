const System = require('systemic');
const initCompressor = require('./compressor');
const initUploader = require('./uploader');
const initController = require('./controller');

module.exports = new System({ name: 'controller' })
  .add('compressor', initCompressor())
  .dependsOn({ component: 'config', source: 'controller' }, 'logger', 'archiver', 'store', 'slackBot')
  .add('uploader', initUploader())
  .dependsOn({ component: 'config', source: 'controller' }, 'logger', 'archiver', 'store', 'slackBot', 'sftp')
  .add('controller', initController())
  .dependsOn('config', 'logger', 'archiver', 'compressor', 'uploader', 'store');
