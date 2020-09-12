const System = require('systemic');
const slack = require('systemic-slack');
const initSlackBot = require('./slackBot');

module.exports = new System({ name: 'slack' })
  .add('slack', slack())
  .dependsOn('config')
  .add('slackBot', initSlackBot())
  .dependsOn({ component: 'config', source: 'slack' }, 'logger', 'slack');
