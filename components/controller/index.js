const System = require('systemic');
const initUploader = require('./uploader');
const initCsvController = require('./csv');
const initController = require('./controller');

module.exports = new System({ name: 'controller' })
  .add('uploader', initUploader())
  .dependsOn({ component: 'config', source: 'controller' }, 'logger', 'archiver', 'store', 'slack', 'sftp', 'mailer')
  .add('csv', initCsvController())
  .dependsOn({ component: 'config', source: 'controller' }, 'logger', 'archiver', 'store', 'slack', 'sftp', 'mailer')
  .add('controller', initController())
  .dependsOn('config', 'logger', 'archiver', 'uploader', 'csv', 'store');
