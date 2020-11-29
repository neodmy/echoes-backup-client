const System = require('systemic');
const initCompressor = require('./compressor');
const initUploader = require('./uploader');
const initCsvController = require('./csv');
const initController = require('./controller');

module.exports = new System({ name: 'controller' })
  .add('compressor', initCompressor())
  .dependsOn({ component: 'config', source: 'controller' }, 'logger', 'archiver', 'store', 'slack')
  .add('uploader', initUploader())
  .dependsOn({ component: 'config', source: 'controller' }, 'logger', 'archiver', 'store', 'slack', 'sftp')
  .add('csv', initCsvController())
  .dependsOn({ component: 'config', source: 'controller' }, 'logger', 'archiver', 'store', 'slack', 'sftp')
  .add('controller', initController())
  .dependsOn('config', 'logger', 'archiver', 'compressor', 'uploader', 'csv', 'store');
