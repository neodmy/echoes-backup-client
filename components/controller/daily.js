const debug = require('debug')('service:daily-controller');

module.exports = () => {
  const start = async ({
    logger, archiver, store, slackBot,
  }) => {
    debug('Initializing controller');

    const compressAndSaveFile = async filename => {
      try {
        const statistics = await archiver.compressFile(filename);
        const savedFile = await store.daily.insertOneSuccess({ filename, statistics, status: 'compressed' });
        archiver.deleteFile(filename);
        return savedFile;
      } catch (error) {
        const errorMessage = `Error compressing file \`${filename}\`. File will be saved for future reprocessing`;
        logger.error(errorMessage);
        await slackBot.postMessage(errorMessage);
        await store.daily.insertOneFail({ filename, status: 'missing' });
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
