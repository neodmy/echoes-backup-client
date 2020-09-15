const debug = require('debug')('service:daily-controller');
const path = require('path');

module.exports = () => {
  const start = async ({
    config, logger, archiver, store, slackBot,
  }) => {
    debug('Initializing controller');
    const { localDir } = config;

    const compressAndSaveFile = async filename => {
      try {
        const localFilePath = path.join(localDir, filename);
        const statistics = await archiver.compressFile(localFilePath);
        const savedFile = await store.insertOneSuccess({ filename, statistics, status: 'compressed' });
        archiver.deleteFile(localFilePath);
        return savedFile;
      } catch (error) {
        const errorMessage = `Error compressing file. File will be saved for future reprocessing | File ${filename}`;
        logger.error(errorMessage);
        await slackBot.postMessage(errorMessage);
        await store.insertOneFail({ filename, status: 'missing' });
        throw error;
      }
    };

    const handleTask = async filename => {
      await compressAndSaveFile(filename);
    };

    return { handleTask };
  };

  return { start };
};
