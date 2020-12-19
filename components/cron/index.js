const System = require('systemic');
const initCron = require('./cron');

module.exports = new System({ name: 'cron' })
  .add('cron', initCron())
  .dependsOn('config', 'logger', 'controller');
