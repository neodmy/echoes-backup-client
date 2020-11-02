const debug = require('debug')('service:compression-controller');
const path = require('path');

module.exports = () => {
  const start = async ({
    config, logger, archiver, store, slack,
  }) => {
    debug('Initializing controller');
    const { localPath } = config;

    const getcurrentRetries = async ({ filename, status }) => {
      const currentFail = await store.getOne({ filename, status });
      if (!currentFail) return 0;
      return currentFail.retries;
    };

    const handleCompression = async filename => {
      const failStatus = 'failed_to_compress';

      let currentRetries;
      try {
        currentRetries = await getcurrentRetries({ filename, status: failStatus });

        const localFilePath = path.join(localPath, filename);
        await archiver.compressFile(localFilePath);
        await archiver.deleteFile(localFilePath);

        if (currentRetries) await store.deleteOne({ filename, status: failStatus });
      } catch (error) {
        const errorMessage = `Error compressing file. File will be saved for future reprocessing | File ${filename}`;
        logger.error(errorMessage);
        await slack.postMessage(errorMessage);

        await store.upsertOne({
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
