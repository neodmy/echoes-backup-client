const debug = require('debug')('service:upload-controller');
const path = require('path');

module.exports = () => {
  const start = async ({
    config, logger, archiver, store, slackBot, sftp,
  }) => {
    debug('Initializing controller');
    const {
      localPath, remotePath, clientId, removalOffset,
    } = config;

    const getcurrentRetries = async ({ filename, status }) => {
      const currentFail = await store.getAllFail({ filename, status });
      if (!currentFail) return 0;
      return currentFail.retries;
    };

    const shouldRemove = filename => {
      if (!removalOffset) return false;

      const removalDate = new Date();
      removalDate.setDate(removalDate.getDate() - removalOffset);
      const fileDate = new Date(filename);

      return removalDate > fileDate;
    };

    const handleUpload = async filename => {
      const failStatus = 'failed_to_send';
      const successStatus = 'sent';

      let currentRetries;
      try {
        currentRetries = await getcurrentRetries({ filename, status: failStatus });

        await sftp.uploadFile({ filename: `${filename}.zip`, localPath, remotePath: path.join(remotePath, clientId) });
        await store.insertOneSuccess({ filename, status: successStatus, retries: currentRetries });

        if (shouldRemove(filename)) await archiver.deleteFile(path.join(localPath, `${filename}.zip`));
        if (currentRetries) await store.deleteOneFail({ filename, status: failStatus });
      } catch (error) {
        const errorMessage = `Error uploading file. File will be saved for future resending | File ${filename}`;
        logger.error(errorMessage);
        await slackBot.postMessage(errorMessage);

        await store.upsertOneFail({
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
