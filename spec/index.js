const ejs = require('ejs');
const path = require('path');
const fs = require('fs');

const pkg = require('../package.json');

const templateFile = path.join(__dirname, './README.ejs');
const destinationFile = path.join(__dirname, '../README.md');

const data = {
  app: {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    scripts: pkg.scripts,
    dependencies: pkg.dependencies,
    devDependencies: pkg.devDependencies,
  },
};

ejs.renderFile(templateFile, data, (err, str) => {
  if (err) throw err;
  fs.writeFileSync(destinationFile, str);
});
