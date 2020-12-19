const nodemailer = require('nodemailer');

module.exports = () => {
  const start = async ({ config, logger }) => {
    const { senderInfo, reportEmails } = config;
    const { service, auth } = senderInfo;
    const { user, pass } = auth;

    const sendMail = async message => {
      if (!service || !user || !pass || !reportEmails) return;

      const transporter = nodemailer.createTransport({
        service,
        auth,
      });

      const mailOptions = {
        from: user,
        subject: 'Echoes-backup client report',
        text: message,
      };

      const emails = reportEmails.split(',');

      const sendEmails = emails.map(async emailAddress => {
        try {
          await transporter.sendMail({ ...mailOptions, to: emailAddress });
          logger.info(`Report email sent to: ${emailAddress}`);
        } catch (error) {
          logger.error(`Error sending report email | Error ${error}`);
        }
      });

      await Promise.all(sendEmails);
    };

    return { sendMail };
  };

  return { start };
};
