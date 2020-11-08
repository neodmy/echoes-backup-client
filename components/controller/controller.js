const debug = require('debug')('service:task-controller');
const path = require('path');

const { shouldRemove } = require('../../util');

module.exports = () => {
  const start = async ({
    config, logger, archiver, compressor, uploader, store,
  }) => {
    debug('Initializing controller');
    const { localPath, removalOffset } = config;

    const init = async () => {
      const filenames = await archiver.getDirectoryContent(localPath);

      const processFilePromises = filenames.map(async filename => {
        try {
          const filenameWithoutExtension = filename.replace('.zip', '');
          const isFileToProcess = /^(19|20)\d\d([- /.])(0[1-9]|1[012])\2(0[1-9]|[12][0-9]|3[01])$/.test(filenameWithoutExtension);
          if (isFileToProcess) {
            if (!filename.includes('zip')) await compressor.handleCompression(filenameWithoutExtension);
            await uploader.handleUpload(filenameWithoutExtension);
          }
        } catch (error) {
          logger.error(error.message);
        }
        Promise.resolve();
      });

      await Promise.all(processFilePromises);
    };

    const processFileToCompress = async filename => {
      try {
        await compressor.handleCompression(filename);
        await uploader.handleUpload(filename);
      } catch (error) {
        logger.error(`Error compressing and uploading file | File ${filename}`);
      }
    };

    const processFileToSend = async filename => {
      try {
        await uploader.handleUpload(filename);
      } catch (error) {
        logger.error(`Error uploading file | File ${filename}`);
      }
    };

    const processRetries = async () => {
      const filesToCompress = await store.getAll({ status: 'failed_to_compress' });
      const filesToSend = await store.getAll({ status: 'failed_to_send' });

      const processFilesToCompress = filesToCompress.map(({ filename }) => processFileToCompress(filename));

      const processFilesToSend = filesToSend.map(({ filename }) => processFileToSend(filename));

      await Promise.all(processFilesToCompress);
      await Promise.all(processFilesToSend);
    };

    const deleteOldFiles = async () => {
      const sentFiles = await store.getAll({ status: 'sent' });

      const deleteFilePromises = sentFiles.map(async ({ filename, status }) => {
        try {
          if (shouldRemove(filename, removalOffset)) {
            logger.info(`Deleting file | Filename ${filename}`);
            await archiver.deleteFile(path.join(localPath, `${filename}.zip`));
            await store.deleteOne({ filename, status });
          }
          logger.info(`File is not older than offset. File will not be deleted | Filename ${filename}`);
        } catch (error) {
          logger.error(`Error deleting file | File deletion will be retried in the next execution | Filename ${filename} | Error ${error}`);
        }
      });

      await Promise.all(deleteFilePromises);
    };

    return {
      init,
      processFileToCompress,
      processRetries,
      deleteOldFiles,
    };
  };

  return { start };
};
