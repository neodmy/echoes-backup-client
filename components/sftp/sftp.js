const debug = require('debug')('service:sftp');
const path = require('path');
const Client = require('ssh2-sftp-client');

module.exports = () => {
  const start = async ({ config, logger }) => {
    debug('Initializing sftp component');

    const client = new Client();

    const uploadFile = async ({ filename, localPath, remotePath }) => {
      try {
        await client.connect(config);
      } catch (error) {
        logger.error(`Error connecting SFTP server | Error ${error.stack}`);
        throw error;
      }

      try {
        let result = await client.mkdir(remotePath, true);
        logger.info(`Trying to create remote directory in server | Result ${result}`);

        result = await client.fastPut(path.join(__dirname, localPath, filename), path.join(remotePath, filename));
        logger.info(`Uploading file ${filename} to server | Result ${result}`);

        return result;
      } catch (error) {
        logger.error(`Error uploading file to SFTP server | Error ${error.stack}`);
        throw error;
      } finally {
        await client.end();
      }
    };

    return { uploadFile };
  };

  return { start };
};
