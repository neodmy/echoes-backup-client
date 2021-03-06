const System = require('systemic');
const initMongo = require('systemic-mongodb');
const initStore = require('./initStore');

module.exports = new System({ name: 'store' })
  .add('mongo', initMongo())
  .dependsOn('config', 'logger')
  .add('store', initStore())
  .dependsOn('config', 'logger', 'mongo');
