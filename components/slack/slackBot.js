module.exports = () => {
  const start = async ({ config, logger, slack }) => {
    const { channel } = config;

    const postMessage = async text => {
      let result;
      try {
        result = await slack.chat.postMessage({
          channel,
          text,
        });
      } catch (error) {
        logger.error(`Message to Slack could not be sent. Error: ${error}`);
      }
      return result;
    };

    return { postMessage };
  };

  return { start };
};
