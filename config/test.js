const path = require('path');

module.exports = {
  logger: { transport: null },
  archiver: {
    sourceDir: path.join(__dirname, '../test/fixtures/echoes/'),
  },
};
