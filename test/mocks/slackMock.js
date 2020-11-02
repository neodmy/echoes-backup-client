module.exports = () => {
  const start = async () => ({
    postMessage: jest.fn(),
  });

  return { start };
};
