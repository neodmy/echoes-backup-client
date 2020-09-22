const debug = require('debug')('service:archiver');
const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');

module.exports = () => {
  const start = async ({ logger }) => {
    debug('Initializing archiver component');

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

    const compressFile = filePath => new Promise((resolve, reject) => {
      try {
        if (!fs.existsSync(filePath)) return reject(new Error(`File ${filePath} does not exist`));

        const statistics = getStatistics(filePath);
        const output = fs.createWriteStream(`${filePath}.zip`);
        const archive = archiver('zip');

        output.on('close', () => {
          const sizeInMB = Math.round(((archive.pointer() / 100000) + Number.EPSILON) * 100) / 100;
          logger.info(`File ${filePath} compressed. Total MB ${sizeInMB}`);
        });
        archive.on('error', err => {
          reject(err);
        });

        archive.pipe(output);
        archive.directory(filePath, false);
        return archive.finalize()
          .then(() => resolve(statistics))
          .catch(err => reject(err));
      } catch (error) {
        reject(error);
        throw error;
      }
    });

    const deleteFile = filePath => new Promise((resolve, reject) => {
      logger.info(`Removing file: ${filePath}`);
      fs.remove(filePath, err => {
        if (err) return reject(new Error(`Error deleting file | File ${filePath} | ${err}`));
        return resolve();
      });
    });

    const getDirectoryContent = dirPath => new Promise((resolve, reject) => {
      fs.readdir(dirPath, (err, files) => {
        if (err) return reject(new Error(`Error getting content of directory | Directory ${dirPath} | ${err}`));
        return resolve(files);
      });
    });

    return {
      compressFile,
      deleteFile,
      getDirectoryContent,
    };
  };

  return { start };
};
