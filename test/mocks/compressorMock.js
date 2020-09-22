module.exports = () => {
  const start = async () => ({
    handleCompression: jest.fn(),
  });

  return { start };
};
