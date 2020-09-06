const System = require('systemic');
const initArchiver = require('./initArchiver');

module.exports = new System({ name: 'archiver' })
  .add('archiver', initArchiver())
  .dependsOn('config', 'logger');
