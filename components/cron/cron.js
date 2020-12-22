const { CronJob } = require('cron');

const { getPreviousDay } = require('../../util');

module.exports = () => {
  let initDailyJob;
  const start = async ({ config, controller }) => {
    const { schedule } = config;
    initDailyJob = new CronJob(schedule, async () => {
      const filename = getPreviousDay();
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
