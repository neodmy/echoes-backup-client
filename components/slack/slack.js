const { WebClient } = require('@slack/web-api');

module.exports = () => {
  const start = async ({ config, logger }) => {
    const { channel, token, status } = config;

    let postMessage = async () => {};

    if (status === 'active') {
      const slackClient = new WebClient(token);

      postMessage = async text => {
        let result;
        try {
          result = await slackClient.chat.postMessage({
            channel,
            text,
          });
        } catch (error) {
          logger.error(`Message to Slack could not be sent. Error: ${error}`);
        }
        return result;
      };
    }

    return { postMessage };
  };

  return { start };
};
