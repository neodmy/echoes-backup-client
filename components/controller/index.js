const System = require('systemic');
const initDailyController = require('./daily');

module.exports = new System({ name: 'controller' })
  .add('controller.daily', initDailyController())
  .dependsOn('logger', 'archiver', 'store')
  .add('controller')
  .dependsOn({ component: 'controller.daily', destination: 'daily' });
