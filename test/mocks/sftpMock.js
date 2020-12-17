module.exports = () => {
  const start = async () => ({
    uploadFile: jest.fn(),
    removeDir: jest.fn(),
    removeFile: jest.fn(),
    createFile: jest.fn(),
    appendToFile: jest.fn(),
    checkFileExists: jest.fn(),
    uploadDir: jest.fn(),
  });

  return { start };
};
