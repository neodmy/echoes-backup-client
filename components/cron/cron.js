const { CronJob } = require('cron');

module.exports = () => {
  let initDailyJob;
  const start = async ({ config, controller }) => {
    const { schedule } = config;
    initDailyJob = new CronJob(schedule, async () => {
      const dateToProcess = new Date().toISOString();
      dateToProcess.setDate(dateToProcess.getDate() - 1);
      const filename = dateToProcess.split('T')[0];
      await controller.processFileToExtractCsvData(filename);
      await controller.processRetries();
      await controller.deleteOldFiles();
    });

    return initDailyJob;
  };

  const stop = async () => {
    initDailyJob.stop();
  };

  return { start, stop };
};
