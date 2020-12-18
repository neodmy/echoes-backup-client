const debug = require('debug')('service:sftp');
const path = require('path');
const Client = require('ssh2-sftp-client');

module.exports = () => {
  const start = async ({ config, logger }) => {
    debug('Initializing sftp component');

    const client = new Client();

    const connect = async () => {
      try {
        await client.connect(config);
      } catch (error) {
        logger.error(`Error connecting SFTP server | Error ${error.stack}`);
        throw error;
      }
    };

    const end = async () => {
      try {
        await client.end();
      } catch (error) {
        logger.error(`Error ending SFTP server connection | Error ${error.stack}`);
        throw error;
      }
    };

    const uploadFile = async ({ filename, localPath, remotePath }) => {
      await connect();

      try {
        let result = await client.mkdir(remotePath, true);
        logger.info(`Trying to create remote directory in server | Result ${result}`);

        result = await client.fastPut(path.join(localPath, filename), path.join(remotePath, filename));
        logger.info(`Uploading file ${filename} to server | Result ${result}`);
        return result;
      } catch (error) {
        logger.error(`Error uploading file to SFTP server | Error ${error.stack}`);
        throw error;
      } finally {
        await end();
      }
    };

    const uploadDir = async ({ dirName, localPath, remotePath }) => {
      await connect();

      try {
        const result = await client.uploadDir(path.join(localPath, dirName), path.join(remotePath, dirName));
        logger.info(`Uploading directory ${dirName} to server | Result ${result}`);
        return result;
      } catch (error) {
        logger.error(`Error uploading directory to SFTP server | Error ${error.stack}`);
        throw error;
      } finally {
        await end();
      }
    };

    const removeDir = async ({ remotePath }) => {
      await connect();

      try {
        const result = await client.rmdir(remotePath, true);
        logger.info(`Deleting directory ${remotePath} in server | Result ${result}`);
        return result;
      } catch (error) {
        logger.error(`Error deleting directory in SFTP server | Error ${error.stack}`);
        throw error;
      } finally {
        await end();
      }
    };

    const removeFile = async ({ filename, remotePath }) => {
      await connect();

      try {
        const result = await client.delete(path.join(remotePath, filename));
        logger.info(`Deleting file ${remotePath} in server | Result ${result}`);
        return result;
      } catch (error) {
        logger.error(`Error deleting file in SFTP server | Error ${error.stack}`);
        throw error;
      } finally {
        await end();
      }
    };

    const createFile = async ({ filename, remotePath, content = '' }) => {
      await connect();

      try {
        const remoteFilePath = path.join(remotePath, filename);
        await client.mkdir(remotePath, true);
        const result = await client.put(Buffer.from(content), remoteFilePath);
        return result;
      } catch (error) {
        logger.error(`Error creating file | Filename ${filename} | Error ${error.stack}`);
        throw error;
      } finally {
        await end();
      }
    };

    const appendToFile = async ({ filename, remotePath, content }) => {
      await connect();

      try {
        const remoteFilePath = path.join(remotePath, filename);
        const result = await client.append(Buffer.from(content), remoteFilePath);
        return result;
      } catch (error) {
        logger.error(`Error appending content to file in SFTP server | Error ${error.stack}`);
        throw error;
      } finally {
        await end();
      }
    };

    const checkFileExists = async ({ filename, remotePath }) => {
      await connect();

      try {
        const remoteFilePath = path.join(remotePath, filename);
        const fileExists = await client.exists(remoteFilePath);
        return !!fileExists;
      } catch (error) {
        logger.error(`Error checking if file exists | Filename ${filename} | Error ${error.stack}`);
        throw error;
      } finally {
        await end();
      }
    };

    return {
      uploadFile, uploadDir, removeDir, removeFile, createFile, appendToFile, checkFileExists,
    };
  };

  return { start };
};
