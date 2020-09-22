module.exports = () => {
  const start = async () => ({
    getAllSuccess: jest.fn(),
    getAllFail: jest.fn(),
    getSuccessByFilename: jest.fn(),
    getFailByFilename: jest.fn(),
    getSuccessByStatus: jest.fn(),
    getFailByStatus: jest.fn(),
    insertOneSuccess: jest.fn(),
    insertOneFail: jest.fn(),
    upsertOneSuccess: jest.fn(),
    upsertOneFail: jest.fn(),
    deleteOneSuccessByFilename: jest.fn(),
    deleteOneFailByFilename: jest.fn(),
    deleteAllSuccess: jest.fn(),
    deleteAllFail: jest.fn(),
    deleteOneSuccess: jest.fn(),
    deleteOneFail: jest.fn(),
  });

  return { start };
};
