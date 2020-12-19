const { CronJob } = require('cron');

module.exports = () => {
  let initDailyJob;
  const start = async ({ config, controller }) => {
    const { schedule } = config;
    initDailyJob = new CronJob(schedule, async () => {
      const today = new Date().toISOString().split('T')[0];
      await controller.processFileToExtractCsvData(today);
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
