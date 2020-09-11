const system = require('../../../system');

describe('Store component tests', () => {
  const sys = system();
  let store;

  beforeAll(async () => {
    ({ store } = await sys.start());
  });

  afterEach(async () => {
    await store.daily.deleteAllSuccess();
    await store.daily.deleteAllFail();
  });

  afterAll(() => sys.stop());

  describe('insertOne tests', () => {
    test('should insert one document in success collection', async () => {
      const filename = '2020-08-25';
      const statistics = {
        gnuplot: '128',
        screenshots: '100',
        stats: '80',
      };
      const expectedResult = {
        filename,
        statistics,
        date_sent: expect.any(Date),
        retries: 0,
      };

      const result = await store.daily.insertOneSuccess({
        filename,
        statistics,
      });
      expect(result._id).toBeDefined();
      expect(result).toMatchObject(expectedResult);
    });

    test('should insert one document in fail collection', async () => {
      const filename = '2020-08-25';
      const statistics = {
        gnuplot: '128',
        screenshots: '100',
        stats: '80',
      };
      const expectedResult = {
        filename,
        statistics,
        date_sent: expect.any(Date),
        retries: 0,
      };

      const result = await store.daily.insertOneFail({
        filename,
        statistics,
      });
      expect(result._id).toBeDefined();
      expect(result).toMatchObject(expectedResult);
    });
  });

  describe('updateOne tests', () => {
    test('should not update a document in success collection', async () => {
      const filename = '2020-08-25';
      const statistics = {
        gnuplot: '128',
        screenshots: '100',
        stats: '80',
      };
      const result = await store.daily.updateOneSuccess({ filename, statistics, retries: 1 });
      expect(result).toBeNull();
    });

    test('should not update a document in fail collection', async () => {
      const filename = '2020-08-25';
      const statistics = {
        gnuplot: '128',
        screenshots: '100',
        stats: '80',
      };
      const result = await store.daily.updateOneFail({ filename, statistics, retries: 1 });
      expect(result).toBeNull();
    });

    test('should update one document in success collection', async () => {
      const filename = '2020-08-25';
      const statistics = {
        gnuplot: '128',
        screenshots: '100',
        stats: '80',
      };
      const expectedResult = {
        filename,
        statistics,
        date_sent: expect.any(Date),
        retries: 1,
      };

      const savedResult = await store.daily.insertOneSuccess({
        filename,
        statistics,
      });

      const result = await store.daily.updateOneSuccess({ ...savedResult, retries: 1 });
      expect(result._id).toBeDefined();
      expect(result).toMatchObject(expectedResult);
    });
  });

  describe('getOneByFilename tests', () => {
    test('should not get an unexisting document by filename in success collection', async () => {
      const filename = '2020-08-25';
      const result = await store.daily.getSuccessByFilename(filename);
      expect(result).toBeNull();
    });

    test('should not get an unexisting document by filename in fail collection', async () => {
      const filename = '2020-08-25';
      const result = await store.daily.getFailByFilename(filename);
      expect(result).toBeNull();
    });

    test('should get a document by filename in success collection', async () => {
      const filename = '2020-08-25';
      const statistics = {
        gnuplot: '128',
        screenshots: '100',
        stats: '80',
      };
      const expectedResult = {
        filename,
        statistics,
        date_sent: expect.any(Date),
      };

      const { _id: savedId } = await store.daily.insertOneSuccess({ filename, statistics });

      const result = await store.daily.getSuccessByFilename(filename);
      expect(result._id).toEqual(savedId);
      expect(result).toMatchObject(expectedResult);
    });

    test('should get a document by filename in fail collection', async () => {
      const filename = '2020-08-25';
      const statistics = {
        gnuplot: '128',
        screenshots: '100',
        stats: '80',
      };
      const expectedResult = {
        filename,
        statistics,
        date_sent: expect.any(Date),
      };

      const { _id: savedId } = await store.daily.insertOneFail({ filename, statistics });

      const result = await store.daily.getFailByFilename(filename);
      expect(result._id).toEqual(savedId);
      expect(result).toMatchObject(expectedResult);
    });
  });

  describe('getAll tests', () => {
    test('should get all documents in success collection', async () => {
      const filename1 = '2020-08-25';
      const filename2 = '2020-08-26';
      const statistics = {
        gnuplot: '128',
        screenshots: '100',
        stats: '80',
      };
      const expectedResult = [
        {
          filename: filename1,
          statistics,
          date_sent: expect.any(Date),
        }, {
          filename: filename2,
          statistics,
          date_sent: expect.any(Date),
        }];

      await store.daily.insertOneSuccess({ filename: filename1, statistics });
      await store.daily.insertOneSuccess({ filename: filename2, statistics });

      const result = await store.daily.getAllSuccess();
      expect(result).toMatchObject(expectedResult);
    });

    test('should get all documents in fail collection', async () => {
      const filename1 = '2020-08-25';
      const filename2 = '2020-08-26';
      const statistics = {
        gnuplot: '128',
        screenshots: '100',
        stats: '80',
      };
      const expectedResult = [
        {
          filename: filename1,
          statistics,
          date_sent: expect.any(Date),
        }, {
          filename: filename2,
          statistics,
          date_sent: expect.any(Date),
        }];

      await store.daily.insertOneFail({ filename: filename1, statistics });
      await store.daily.insertOneFail({ filename: filename2, statistics });

      const result = await store.daily.getAllFail();
      expect(result).toMatchObject(expectedResult);
    });
  });

  describe('deleteOneByFilename tests', () => {
    test('should delete one document in success collection', async () => {
      const filename1 = '2020-08-25';
      const filename2 = '2020-08-26';
      const statistics = {
        gnuplot: '128',
        screenshots: '100',
        stats: '80',
      };

      await store.daily.insertOneSuccess({ filename: filename1, statistics });
      await store.daily.insertOneSuccess({ filename: filename2, statistics });

      const result = await store.daily.deleteOneSuccessByFilename(filename1);
      expect(result).toBe(1);

      const remainingDocuments = await store.daily.getAllSuccess();
      expect(remainingDocuments).toHaveLength(1);
    });

    test('should delete one document in fail collection', async () => {
      const filename1 = '2020-08-25';
      const filename2 = '2020-08-26';
      const statistics = {
        gnuplot: '128',
        screenshots: '100',
        stats: '80',
      };

      await store.daily.insertOneFail({ filename: filename1, statistics });
      await store.daily.insertOneFail({ filename: filename2, statistics });

      const result = await store.daily.deleteOneFailByFilename(filename1);
      expect(result).toBe(1);

      const remainingDocuments = await store.daily.getAllFail();
      expect(remainingDocuments).toHaveLength(1);
    });
  });

  describe('deleteAll tests', () => {
    test('should delete all documents in success collection', async () => {
      const filename1 = '2020-08-25';
      const filename2 = '2020-08-26';
      const statistics = {
        gnuplot: '128',
        screenshots: '100',
        stats: '80',
      };

      await store.daily.insertOneSuccess({ filename: filename1, statistics });
      await store.daily.insertOneSuccess({ filename: filename2, statistics });

      await store.daily.deleteAllSuccess();

      const remainingDocuments = await store.daily.getAllSuccess();
      expect(remainingDocuments).toHaveLength(0);
    });

    test('should delete all documents in fail collection', async () => {
      const filename1 = '2020-08-25';
      const filename2 = '2020-08-26';
      const statistics = {
        gnuplot: '128',
        screenshots: '100',
        stats: '80',
      };

      await store.daily.insertOneFail({ filename: filename1, statistics });
      await store.daily.insertOneFail({ filename: filename2, statistics });

      await store.daily.deleteAllFail();

      const remainingDocuments = await store.daily.getAllFail();
      expect(remainingDocuments).toHaveLength(0);
    });
  });
});
