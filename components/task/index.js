const System = require('systemic');
const initTask = require('./task');

module.exports = new System({ name: 'task' })
  .add('task', initTask())
  .dependsOn('controller', 'cron');
