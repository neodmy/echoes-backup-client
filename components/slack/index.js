const System = require('systemic');
const initSlack = require('./slack');

module.exports = new System({ name: 'slack' })
  .add('slack', initSlack())
  .dependsOn('config', 'logger');
