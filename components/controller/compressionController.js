const debug = require('debug')('service:compression-controller');
const path = require('path');

module.exports = () => {
  const start = async ({
    config, logger, archiver, store, slackBot,
  }) => {
    debug('Initializing controller');
    const { localPath } = config;

    const getcurrentRetries = async ({ filename, status }) => {
      const currentFail = await store.getAllFail({ filename, status });
      if (!currentFail) return 0;
      return currentFail.retries;
    };

    const handleCompression = async filename => {
      const failStatus = 'failed_to_compress';
      const successStatus = 'compressed';

      let currentRetries;
      try {
        currentRetries = await getcurrentRetries({ filename, status: failStatus });

        const localFilePath = path.join(localPath, filename);
        const statistics = await archiver.compressFile(localFilePath);

        await store.insertOneSuccess({
          filename, statistics, status: successStatus, retries: currentRetries,
        });

        await archiver.deleteFile(localFilePath);
        if (currentRetries) await store.deleteOneFail({ filename, status: failStatus });
      } catch (error) {
        const errorMessage = `Error compressing file. File will be saved for future reprocessing | File ${filename}`;
        logger.error(errorMessage);
        await slackBot.postMessage(errorMessage);

        await store.upsertOneFail({
          filename, status: failStatus, retries: currentRetries + 1,
        });

        throw error;
      }
    };

    return {
      handleCompression,
    };
  };

  return { start };
};
