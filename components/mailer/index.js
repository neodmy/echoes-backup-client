const System = require('systemic');
const initMailer = require('./mailer');

module.exports = new System({ name: 'mailer' })
  .add('mailer', initMailer())
  .dependsOn('config', 'logger');
