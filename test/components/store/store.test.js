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
    await store.deleteAll();
  });

  afterAll(() => sys.stop());

  describe('upsertOne', () => {
    test('should insert a document', async () => {
      const filename = '2020-08-25';
      const status = 'missing';

      const expectedResult = {
        filename,
        status,
        date: expect.any(Date),
        retries: 1,
      };

      const storedDocument = await store.upsertOne({ filename, status, retries: 1 });
      expect(storedDocument).toMatchObject(expectedResult);
    });

    test('should update one document', async () => {
      const filename = '2020-08-25';
      const status = 'missing';

      const payload = {
        filename,
        status,
        retries: 1,
      };

      const expectedResult = {
        filename,
        status,
        date: expect.any(Date),
        retries: 2,
      };

      const storedDocument = await store.upsertOne(payload);
      await store.upsertOne({ ...storedDocument, retries: 2 });

      const storedDocuments = await store.getAll({ filename, status });
      expect(storedDocuments).toHaveLength(1);
      expect(storedDocuments[0]).toMatchObject(expectedResult);
    });
  });

  describe('getOne', () => {
    test('should get one document', async () => {
      const filename1 = '2020-08-25';
      const filename2 = '2020-08-26';
      const status1 = 'missing';
      const status2 = 'failed';
      const expectedResult = {
        filename: filename1,
        status: status1,
        date: expect.any(Date),
      };

      await store.upsertOne({ filename: filename1, status: status1 });
      await store.upsertOne({ filename: filename2, status: status2 });

      const retrievedDocument = await store.getOne({ filename: filename1, status: status1 });
      expect(retrievedDocument).toMatchObject(expectedResult);
    });

    test('should get no document', async () => {
      const filename1 = '2020-08-25';
      const filename2 = '2020-08-26';
      const status1 = 'missing';
      const status2 = 'failed';

      await store.upsertOne({ filename: filename1, status: status1 });
      await store.upsertOne({ filename: filename2, status: status2 });

      const retrievedDocument = await store.getOne({ filename: 'some_filename', status: status1 });
      expect(retrievedDocument).toBeNull();
    });
  });

  describe('getAll', () => {
    test('should get all documents in a collection', async () => {
      const filename1 = '2020-08-25';
      const filename2 = '2020-08-26';
      const status1 = 'missing';
      const status2 = 'failed';
      const expectedResult = [
        {
          filename: filename1,
          status: status1,
          date: expect.any(Date),
        }, {
          filename: filename2,
          status: status2,
          date: expect.any(Date),
        }];

      await store.upsertOne({ filename: filename1, status: status1 });
      await store.upsertOne({ filename: filename2, status: status2 });

      const result = await store.getAll();
      expect(result).toMatchObject(expectedResult);
    });

    test('should get all documents in a collection with a query', async () => {
      const filename1 = '2020-08-25';
      const filename2 = '2020-08-26';
      const status1 = 'missing';
      const status2 = 'failed';
      const expectedResult = [
        {
          filename: filename1,
          status: status1,
          date: expect.any(Date),
        }];

      await store.upsertOne({ filename: filename1, status: status1 });
      await store.upsertOne({ filename: filename2, status: status2 });

      const result = await store.getAll({ filename: filename1 });
      expect(result).toMatchObject(expectedResult);
    });
  });

  describe('deleteOne', () => {
    test('should delete one document in collection', async () => {
      const filename1 = '2020-08-25';
      const status = 'missing';

      const savedDoc = await store.upsertOne({ filename: filename1, status });
      await store.upsertOne({ filename: filename1, status: 'sent' });

      const result = await store.deleteOne(savedDoc);
      expect(result).toBe(1);

      const remainingDocuments = await store.getAll();
      expect(remainingDocuments).toHaveLength(1);
    });
  });

  describe('deleteAll', () => {
    test('should delete all documents in fail collection', async () => {
      const filename1 = '2020-08-25';
      const filename2 = '2020-08-26';
      const status1 = 'missing';
      const status2 = 'failed';

      await store.upsertOne({ filename: filename1, status: status1 });
      await store.upsertOne({ filename: filename2, status: status2 });

      await store.deleteAll();

      const remainingDocuments = await store.getAll();
      expect(remainingDocuments).toHaveLength(0);
    });
  });
});
