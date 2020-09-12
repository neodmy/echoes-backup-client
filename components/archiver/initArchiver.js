const debug = require('debug')('service:archiver');
const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');

module.exports = () => {
  const start = async ({ config, logger }) => {
    const { sourceDir } = config;
    const initializingMessage = `Initializing archiver component with source directory ${sourceDir}`;
    logger.info(`${initializingMessage}`);
    debug(`${initializingMessage}`);

    const getStatistics = filePath => {
      const statisticsMap = new Map();

      const countFilesInDirectory = directoryPath => {
        const files = fs.readdirSync(directoryPath);
        files.forEach(file => {
          const absolutePath = path.join(directoryPath, file);
          if (fs.lstatSync(absolutePath).isDirectory()) {
            countFilesInDirectory(absolutePath);
          } else {
            const count = statisticsMap.get(directoryPath);
            statisticsMap.set(directoryPath, count ? count + 1 : 1);
          }
        });
      };
      countFilesInDirectory(filePath);

      return Array.from(statisticsMap, ([absolutePath, value]) => ({ [absolutePath.replace(filePath, '')]: value }));
    };

    // eslint-disable-next-line consistent-return
    const compressFile = filename => new Promise((resolve, reject) => {
      try {
        const sourceFilePath = path.join(sourceDir, filename);
        if (!fs.existsSync(sourceFilePath)) return reject(new Error(`File ${sourceFilePath} does not exist`));

        const statistics = getStatistics(sourceFilePath);
        const output = fs.createWriteStream(`${sourceFilePath}.zip`);
        const archive = archiver('zip');

        output.on('close', () => {
          const sizeInMB = Math.round(((archive.pointer() / 100000) + Number.EPSILON) * 100) / 100;
          logger.info(`File ${filename} compressed. Total MB ${sizeInMB}`);
        });
        archive.on('error', err => {
          reject(err);
        });

        archive.pipe(output);
        archive.directory(sourceFilePath, false);
        archive.finalize()
          .then(() => resolve(statistics))
          .catch(err => reject(err));
      } catch (error) {
        reject(error);
      }
    });

    const deleteFile = filename => {
      const sourceFilePath = path.join(sourceDir, filename);
      fs.removeSync(sourceFilePath);
    };

    return {
      compressFile,
      deleteFile,
    };
  };

  return { start };
};
