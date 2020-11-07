const debug = require('debug')('service:upload-controller');
const path = require('path');

module.exports = () => {
  const start = async ({
    config, logger, store, slack, sftp,
  }) => {
    debug('Initializing controller');
    const {
      localPath, remotePath, clientId,
    } = config;

    const getcurrentRetries = async ({ filename, status }) => {
      const currentFail = await store.getOne({ filename, status });
      if (!currentFail) return 0;
      return currentFail.retries;
    };

    const handleUpload = async filename => {
      const failStatus = 'failed_to_send';

      let currentRetries;
      try {
        currentRetries = await getcurrentRetries({ filename, status: failStatus });

        await sftp.uploadFile({ filename: `${filename}.zip`, localPath, remotePath: path.join(remotePath, clientId) });

        if (currentRetries) await store.deleteOne({ filename, status: failStatus });
        await store.upsertOne({ filename, status: 'sent' });
      } catch (error) {
        const errorMessage = `Error uploading file. File will be saved for future resending | File ${filename}`;
        logger.error(errorMessage);
        await slack.postMessage(errorMessage);

        await store.upsertOne({
          filename, status: 'failed_to_send', retries: currentRetries + 1,
        });

        throw error;
      }
    };

    return {
      handleUpload,
    };
  };

  return { start };
};
