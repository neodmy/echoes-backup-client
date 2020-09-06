const System = require('systemic');
const initMongo = require('systemic-mongodb');
const initDailyStore = require('./daily');

module.exports = new System({ name: 'store' })
  .add('mongodb', initMongo())
  .dependsOn('config', 'logger')
  .add('store.daily', initDailyStore())
  .dependsOn('config', 'logger', 'mongodb')
  .add('store')
  .dependsOn({ component: 'store.daily', destination: 'daily' });
