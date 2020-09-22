const debug = require('debug')('service:task-controller');

module.exports = () => {
  const start = async ({
    config, logger, archiver, compressor, uploader,
  }) => {
    debug('Initializing controller');
    const { localPath } = config;

    const handleTask = async () => {
      const filenames = await archiver.getDirectoryContent(localPath);

      const processFilePromises = filenames.map(async filename => {
        try {
          const filenameWithoutExtension = filename.replace('.zip', '');
          if (!filename.includes('zip')) await compressor.handleCompression(filenameWithoutExtension);
          await uploader.handleUpload(filenameWithoutExtension);
        } catch (error) {
          logger.error(error.message);
        }
      });

      await Promise.allSettled(processFilePromises);
    };

    return {
      handleTask,
    };
  };

  return { start };
};
