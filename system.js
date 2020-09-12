require('dotenv').config();
const System = require('systemic');
const { join } = require('path');

module.exports = () => new System({ name: 'echoes-backup-client' })
  .bootstrap(join(__dirname, 'components'));
