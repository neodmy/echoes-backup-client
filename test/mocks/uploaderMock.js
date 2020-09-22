module.exports = () => {
  const start = async () => ({
    handleUpload: jest.fn(),
  });

  return { start };
};
