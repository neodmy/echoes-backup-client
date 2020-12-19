module.exports = () => {
  const start = async () => ({
    sendMail: jest.fn(),
  });

  return { start };
};
