const debug = require('debug')('service:upload-controller');
const path = require('path');

module.exports = () => {
  const start = async ({
    config, logger, store, slack, sftp, mailer,
  }) => {
    debug('Initializing uploader controller');
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
      const successStatus = 'sent';

      let currentRetries;
      try {
        const processedFile = await store.getOne({ filename, status: successStatus });
        if (processedFile) {
          logger.info(`Skipping file ${filename} | The file has already been sent`);
          return;
        }

        logger.info(`File upload has started | Filename ${filename}`);
        currentRetries = await getcurrentRetries({ filename, status: failStatus });

        await sftp.uploadDir({ dirName: filename, localPath, remotePath: path.join(remotePath, clientId, 'echoes_backup') });

        if (currentRetries) await store.deleteOne({ filename, status: failStatus });
        await store.upsertOne({ filename, status: successStatus });

        logger.info(`File upload has been completed successfully | Filename ${filename}`);
      } catch (error) {
        const errorMessage = `Error uploading file. File will be saved for future resending | File ${filename}`;
        logger.error(`${errorMessage} | Error ${error}`);

        try {
          await slack.postMessage(`${errorMessage}`);
          await mailer.sendMail(`${errorMessage}`);
        } catch (err) {
          logger.error(`Error reporting failure | Error ${err}`);
        }

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
