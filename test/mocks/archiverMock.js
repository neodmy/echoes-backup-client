module.exports = () => {
  const start = async () => ({
    compressFile: jest.fn(),
    deleteFile: jest.fn(),
    getDirectoryContent: jest.fn(),
  });

  return { start };
};
