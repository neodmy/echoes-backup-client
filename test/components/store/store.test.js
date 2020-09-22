const system = require('../../../system');

const slackBotMock = require('../../mocks/slackBotMock');

describe('Store component tests', () => {
  const sys = system();
  let store;

  beforeAll(async () => {
    sys.set('slackBot', slackBotMock());
    ({ store } = await sys.start());
  });

  afterEach(async () => {
    await store.deleteAllSuccess();
    await store.deleteAllFail();
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
        date: expect.any(Date),
        retries: 0,
      };

      const result = await store.insertOneSuccess({
        filename,
        statistics,
        retries: 0,
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
        date: expect.any(Date),
        retries: 0,
      };

      const result = await store.insertOneFail({
        filename,
        statistics,
        retries: 0,
      });
      expect(result._id).toBeDefined();
      expect(result).toMatchObject(expectedResult);
    });
  });

  describe('upsertOne tests', () => {
    test('should upsert (insert) a document in success collection', async () => {
      const filename = '2020-08-25';
      const statistics = {
        gnuplot: '128',
        screenshots: '100',
        stats: '80',
      };

      const expectedResult = {
        filename,
        statistics,
        date: expect.any(Date),
        retries: 1,
      };

      const result = await store.upsertOneSuccess({ filename, statistics, retries: 1 });
      expect(result._id).toBeDefined();
      expect(result).toMatchObject(expectedResult);
    });

    test('should upsert (insert) a document in fail collection', async () => {
      const filename = '2020-08-25';
      const statistics = {
        gnuplot: '128',
        screenshots: '100',
        stats: '80',
      };

      const expectedResult = {
        filename,
        statistics,
        date: expect.any(Date),
        retries: 1,
      };

      const result = await store.upsertOneFail({ filename, statistics, retries: 1 });
      expect(result._id).toBeDefined();
      expect(result).toMatchObject(expectedResult);
    });

    test('should upsert (update) one document in success collection', async () => {
      const filename = '2020-08-25';
      const statistics = {
        gnuplot: '128',
        screenshots: '100',
        stats: '80',
      };
      const expectedResult = {
        filename,
        statistics,
        date: expect.any(Date),
        retries: 2,
      };

      const savedResult = await store.insertOneSuccess({
        filename,
        statistics,
        retries: 1,
      });

      const result = await store.upsertOneSuccess({ ...savedResult, retries: 2 });
      expect(result._id).toBeDefined();
      expect(result).toMatchObject(expectedResult);
    });

    test('should upsert (update) one document in fail collection', async () => {
      const filename = '2020-08-25';
      const statistics = {
        gnuplot: '128',
        screenshots: '100',
        stats: '80',
      };
      const expectedResult = {
        filename,
        statistics,
        date: expect.any(Date),
        retries: 2,
      };

      const savedResult = await store.insertOneFail({
        filename,
        statistics,
        retries: 1,
      });

      const result = await store.upsertOneFail({ ...savedResult, retries: 2 });
      expect(result._id).toBeDefined();
      expect(result).toMatchObject(expectedResult);
    });
  });

  describe('getOneByFilename tests', () => {
    test('should not get an unexisting document by filename in success collection', async () => {
      const filename = '2020-08-25';
      const result = await store.getSuccessByFilename(filename);
      expect(result).toBeNull();
    });

    test('should not get an unexisting document by filename in fail collection', async () => {
      const filename = '2020-08-25';
      const result = await store.getFailByFilename(filename);
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
        date: expect.any(Date),
      };

      const { _id: savedId } = await store.insertOneSuccess({ filename, statistics });

      const result = await store.getSuccessByFilename(filename);
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
        date: expect.any(Date),
      };

      const { _id: savedId } = await store.insertOneFail({ filename, statistics });

      const result = await store.getFailByFilename(filename);
      expect(result._id).toEqual(savedId);
      expect(result).toMatchObject(expectedResult);
    });
  });

  describe('getByStatus tests', () => {
    test('should not get no documents by status in success collection', async () => {
      const status = 'missing';
      const result = await store.getSuccessByStatus(status);
      expect(result).toEqual([]);
    });

    test('should not get no documents by status in fail collection', async () => {
      const status = 'missing';
      const result = await store.getFailByStatus(status);
      expect(result).toEqual([]);
    });

    test('should get a document by status in success collection', async () => {
      const status = 'missing';
      const statistics = {
        gnuplot: '128',
        screenshots: '100',
        stats: '80',
      };
      const expectedResult = {
        status,
        statistics,
        date: expect.any(Date),
      };

      await store.insertOneSuccess({ status, statistics });
      await store.insertOneSuccess({ status, statistics });
      await store.insertOneSuccess({ status: 'sent', statistics });

      const results = await store.getSuccessByStatus(status);
      expect(results).toHaveLength(2);
      results.forEach(result => {
        expect(result._id).toBeDefined();
        expect(result).toMatchObject(expectedResult);
      });
    });

    test('should get a document by status in fail collection', async () => {
      const status = 'missing';
      const statistics = {
        gnuplot: '128',
        screenshots: '100',
        stats: '80',
      };
      const expectedResult = {
        status,
        statistics,
        date: expect.any(Date),
      };

      await store.insertOneFail({ status, statistics });
      await store.insertOneFail({ status, statistics });
      await store.insertOneFail({ status: 'sent', statistics });

      const results = await store.getFailByStatus(status);
      expect(results).toHaveLength(2);
      results.forEach(result => {
        expect(result._id).toBeDefined();
        expect(result).toMatchObject(expectedResult);
      });
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
          date: expect.any(Date),
        }, {
          filename: filename2,
          statistics,
          date: expect.any(Date),
        }];

      await store.insertOneSuccess({ filename: filename1, statistics });
      await store.insertOneSuccess({ filename: filename2, statistics });

      const result = await store.getAllSuccess();
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
          date: expect.any(Date),
        }, {
          filename: filename2,
          statistics,
          date: expect.any(Date),
        }];

      await store.insertOneFail({ filename: filename1, statistics });
      await store.insertOneFail({ filename: filename2, statistics });

      const result = await store.getAllFail();
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

      await store.insertOneSuccess({ filename: filename1, statistics });
      await store.insertOneSuccess({ filename: filename2, statistics });

      const result = await store.deleteOneSuccessByFilename(filename1);
      expect(result).toBe(1);

      const remainingDocuments = await store.getAllSuccess();
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

      await store.insertOneFail({ filename: filename1, statistics });
      await store.insertOneFail({ filename: filename2, statistics });

      const result = await store.deleteOneFailByFilename(filename1);
      expect(result).toBe(1);

      const remainingDocuments = await store.getAllFail();
      expect(remainingDocuments).toHaveLength(1);
    });
  });

  describe('deleteOne tests', () => {
    test('should delete one document in success collection', async () => {
      const filename1 = '2020-08-25';
      const status = 'missing';
      const statistics = {
        gnuplot: '128',
        screenshots: '100',
        stats: '80',
      };

      const savedDoc = await store.insertOneSuccess({ filename: filename1, statistics, status });
      await store.insertOneSuccess({ filename: filename1, statistics, status: 'sent' });

      const result = await store.deleteOneSuccess(savedDoc);
      expect(result).toBe(1);

      const remainingDocuments = await store.getAllSuccess();
      expect(remainingDocuments).toHaveLength(1);
    });

    test('should delete one document in fail collection', async () => {
      const filename1 = '2020-08-25';
      const status = 'missing';
      const statistics = {
        gnuplot: '128',
        screenshots: '100',
        stats: '80',
      };

      const savedDoc = await store.insertOneFail({ filename: filename1, statistics, status });
      await store.insertOneFail({ filename: filename1, statistics, status: 'sent' });

      const result = await store.deleteOneFail(savedDoc);
      expect(result).toBe(1);

      const remainingDocuments = await store.getAllFail();
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

      await store.insertOneSuccess({ filename: filename1, statistics });
      await store.insertOneSuccess({ filename: filename2, statistics });

      await store.deleteAllSuccess();

      const remainingDocuments = await store.getAllSuccess();
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

      await store.insertOneFail({ filename: filename1, statistics });
      await store.insertOneFail({ filename: filename2, statistics });

      await store.deleteAllFail();

      const remainingDocuments = await store.getAllFail();
      expect(remainingDocuments).toHaveLength(0);
    });
  });
});
