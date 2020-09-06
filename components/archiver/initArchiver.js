const debug = require('debug')('service:archiver');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

module.exports = () => {
  const start = async ({ config, logger }) => {
    const { sourceDir } = config;
    const initializingMessage = `Initializing archiver component with source directory ${sourceDir}`;
    logger.info(`${initializingMessage}`);
    debug(`${initializingMessage}`);

    // eslint-disable-next-line consistent-return
    const compressFile = filename => new Promise((resolve, reject) => {
      try {
        const sourceFilePath = path.join(sourceDir, filename);
        if (!fs.existsSync(sourceFilePath)) return reject(new Error(`File ${sourceFilePath} does not exists`));

        const output = fs.createWriteStream(`${sourceFilePath}.zip`);
        const archive = archiver('zip');

        output.on('close', () => {
          logger.info(`File ${filename} compressed. Total MB ${archive.pointer() / 100000}`);
        });
        archive.on('error', err => {
          reject(err);
        });

        archive.pipe(output);
        archive.directory(sourceFilePath, false);
        archive.finalize()
          .then(() => resolve(true))
          .catch(err => reject(err));
      } catch (error) {
        reject(error);
      }
    });

    return {
      compressFile,
    };
  };

  return { start };
};
