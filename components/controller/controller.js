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
      try {
        logger.info('Initial synchronization of all files');
        const filenames = await archiver.getDirectoryContent(localPath);

        const processFilePromises = filenames.map(async filename => {
          try {
            const filenameWithoutExtension = filename.replace('.zip', '');
            const isFileToProcess = /^(19|20)\d\d([- /.])(0[1-9]|1[012])\2(0[1-9]|[12][0-9]|3[01])$/.test(filenameWithoutExtension);
            if (isFileToProcess) {
              logger.info(`Synchronizing file | Filename ${filename}`);
              if (!filename.includes('zip')) await compressor.handleCompression(filenameWithoutExtension);
              await uploader.handleUpload(filenameWithoutExtension);
              logger.info(`File synchornization has been completed | Filename ${filename}`);
            }
          } catch (error) {
            logger.error(error.message);
          }
        });

        await Promise.all(processFilePromises);
        logger.info('Initial synchronization has finished successfully');
      } catch (error) {
        logger.error(`Initial synchronization could not be done | Error ${error}`);
      }
    };

    const processFileToCompress = async filename => {
      try {
        logger.info(`Processing file to compress and upload | File ${filename}`);
        await compressor.handleCompression(filename);
        await uploader.handleUpload(filename);
        logger.info(`File to compress and upload completed successfully | File ${filename}`);
      } catch (error) {
        logger.error(`Error compressing and uploading file | File ${filename} | Error ${error}`);
      }
    };

    const processFileToSend = async filename => {
      try {
        logger.info(`Processing file to upload | File ${filename}`);
        await uploader.handleUpload(filename);
        logger.info(`File to upload completed successfully | File ${filename}`);
      } catch (error) {
        logger.error(`Error uploading file | File ${filename} | Error ${error}`);
      }
    };

    const processRetries = async () => {
      try {
        logger.info('Processing retries');
        const filesToCompress = await store.getAll({ status: 'failed_to_compress' });
        const filesToSend = await store.getAll({ status: 'failed_to_send' });

        const processFilesToCompress = filesToCompress.map(({ filename }) => processFileToCompress(filename));

        const processFilesToSend = filesToSend.map(({ filename }) => processFileToSend(filename));

        logger.info('Processing retries to compress and upload');
        await Promise.all(processFilesToCompress);
        logger.info('Retries to compress and upload have finished successfully');
        logger.info('Processing retries to upload');
        await Promise.all(processFilesToSend);
        logger.info('Retries to upload have finished successfully');
      } catch (error) {
        logger.error(`Error processing retries | Error ${error}`);
      }
    };

    const deleteOldFiles = async () => {
      try {
        logger.info('Deleting old files');
        const sentFiles = await store.getAll({ status: 'sent' });

        const deleteFilePromises = sentFiles.map(async ({ filename, status }) => {
          try {
            if (shouldRemove(filename, removalOffset)) {
              logger.info(`Deleting old file | Filename ${filename}`);
              await archiver.deleteFile(path.join(localPath, `${filename}.zip`));
              await store.deleteOne({ filename, status });
              logger.info(`Old file has been deleted successfully | Filename ${filename}`);
            }
            logger.info(`File is not older than offset. File will not be deleted | Filename ${filename}`);
          } catch (error) {
            logger.error(`Error deleting file | File deletion will be retried in the next execution | Filename ${filename} | Error ${error}`);
          }
        });

        await Promise.all(deleteFilePromises);

        logger.info('Old files to delete have finished successfully');
      } catch (error) {
        logger.error(`Error deleting old files | Error ${error}`);
      }
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
