module.exports = () => {
  const start = async () => ({
    getAll: jest.fn(),
    getOne: jest.fn(),
    upsertOne: jest.fn(),
    deleteOne: jest.fn(),
    deleteAll: jest.fn(),
  });

  return { start };
};
