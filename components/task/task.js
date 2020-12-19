module.exports = () => {
  const start = async ({ controller, cron }) => {
    await controller.init();
    cron.start();
  };

  return { start };
};
