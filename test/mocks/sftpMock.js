module.exports = () => {
  const start = async () => ({
    uploadFile: jest.fn(),
    removeDir: jest.fn(),
    removeFile: jest.fn(),
  });

  return { start };
};
