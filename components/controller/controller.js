const debug = require('debug')('service:task-controller');
const path = require('path');

const { shouldRemove, asyncForEach } = require('../../util');

module.exports = () => {
  const start = async ({
    config, logger, archiver, uploader, csv, store,
  }) => {
    debug('Initializing controller');
    const { localPath, removalOffset } = config;

    const init = async () => {
      try {
        logger.info('Initial synchronization of all files');
        const filenames = await archiver.getDirectoryContent(localPath);

        const processFile = async filename => {
          try {
            const isFileToProcess = /^(19|20)\d\d([- /.])(0[1-9]|1[012])\2(0[1-9]|[12][0-9]|3[01])$/.test(filename);
            if (isFileToProcess) {
              logger.info(`Synchronizing file | Filename ${filename}`);
              await csv.handleCsvData(filename);
              await uploader.handleUpload(filename);
              logger.info(`File synchornization has been completed | Filename ${filename}`);
            }
          } catch (error) {
            logger.error(`Error synchronizing file | Filename ${filename} | Error ${error}`);
          }
        };

        await asyncForEach(filenames, processFile);
        logger.info('Initial synchronization has finished successfully');
      } catch (error) {
        logger.error(`Initial synchronization could not be done | Error ${error}`);
      }
    };

    const processFileToExtractCsvData = async filename => {
      try {
        logger.info(`Processing file to extract CSV data and upload | File ${filename}`);
        await csv.handleCsvData(filename);
        await uploader.handleUpload(filename);
        logger.info(`File to extract CSV data and upload completed successfully | File ${filename}`);
      } catch (error) {
        logger.error(`Error extracting CSV data and uploading file | File ${filename} | Error ${error}`);
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
        const fileToExtracCsvData = await store.getAll({ status: 'failed_to_extract_csv' });
        const filesToSend = await store.getAll({ status: 'failed_to_send' });

        const processCsvData = ({ filename }) => processFileToExtractCsvData(filename);

        const processUploadData = ({ filename }) => processFileToSend(filename);

        logger.info('Processing retries to extract CSV data, compress and upload');
        await asyncForEach(fileToExtracCsvData, processCsvData);
        logger.info('Retries to extract CSV data, compress and upload have finished successfully');

        logger.info('Processing retries to upload');
        await asyncForEach(filesToSend, processUploadData);
        logger.info('Retries to upload have finished successfully');
      } catch (error) {
        logger.error(`Error processing retries | Error ${error}`);
      }
    };

    const deleteOldFiles = async () => {
      try {
        logger.info('Deleting old files');
        const sentFiles = await store.getAll({ status: 'sent' });

        const deleteFile = async ({ filename, status }) => {
          try {
            if (shouldRemove(filename, removalOffset)) {
              logger.info(`Deleting old file | Filename ${filename}`);
              await archiver.deleteFile(path.join(localPath, filename));
              await store.deleteOne({ filename, status });
              logger.info(`Old file has been deleted successfully | Filename ${filename}`);
            }
            logger.info(`File is not older than offset. File will not be deleted | Filename ${filename}`);
          } catch (error) {
            logger.error(`Error deleting file | File deletion will be retried in the next execution | Filename ${filename} | Error ${error}`);
          }
        };

        await asyncForEach(sentFiles, deleteFile);

        logger.info('Old files to delete have finished successfully');
      } catch (error) {
        logger.error(`Error deleting old files | Error ${error}`);
      }
    };

    return {
      init,
      processFileToExtractCsvData,
      processRetries,
      deleteOldFiles,
    };
  };

  return { start };
};
