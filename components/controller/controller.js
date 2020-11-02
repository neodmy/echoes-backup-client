const debug = require('debug')('service:task-controller');

module.exports = () => {
  const start = async ({
    config, logger, archiver, compressor, uploader, store,
  }) => {
    debug('Initializing controller');
    const { localPath } = config;

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

    return {
      init,
      processFileToCompress,
      processRetries,
    };
  };

  return { start };
};
