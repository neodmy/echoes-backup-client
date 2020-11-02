const path = require('path');
const system = require('../../../system');

const slackMock = require('../../mocks/slackMock');
const sftpMock = require('../../mocks/sftpMock');
const archiverMock = require('../../mocks/archiverMock');
const storeMock = require('../../mocks/storeMock');

const {
  controller: { localPath },
} = require('../../../config/default');

describe('Compressor component tests', () => {
  const sys = system();
  let compressor;
  let store;
  let archiver;
  let slack;
  let postMessageSpy;

  beforeAll(async () => {
    sys.set('slack', slackMock());
    sys.set('sftp', sftpMock());
    sys.set('archiver', archiverMock());
    sys.set('store', storeMock());
    ({
      compressor, store, archiver, slack,
    } = await sys.start());

    postMessageSpy = jest.spyOn(slack, 'postMessage');
  });

  afterEach(() => jest.clearAllMocks());

  afterAll(() => sys.stop());

  describe('handleCompression', () => {
    test('should fail when the file to compress does not exist on the first try', async () => {
      const filename = 'not_a_file';
      const failStatus = 'failed_to_compress';

      store.getOne.mockResolvedValueOnce(null);
      archiver.compressFile.mockRejectedValueOnce(new Error('not_a_file does not exist'));

      let err;
      try {
        await compressor.handleCompression(filename);
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeDefined();
        expect(err.message).toEqual(expect.stringContaining('not_a_file does not exist'));

        expect(store.getOne).toHaveBeenCalledWith({ filename, status: failStatus });
        expect(archiver.compressFile).toHaveBeenCalledWith(path.join(localPath, filename));

        expect(archiver.deleteFile).not.toHaveBeenCalled();
        expect(store.deleteOne).not.toHaveBeenCalled();

        expect(postMessageSpy).toHaveBeenCalled();
        expect(store.upsertOne).toHaveBeenCalledWith({ filename, status: failStatus, retries: 1 });
      }
    });

    test('should success when the file to compress exists on the first try', async () => {
      const filename = '2020-09-01';
      const statistics = [
        { '/gnuplot/specs/fakes': 1 },
        { '/gnuplot/specs/overdense': 1 },
        { '/gnuplot/specs': 1 },
        { '/gnuplot/specs/underdense': 1 },
        { '/screenshots/fakes': 1 },
        { '/screenshots/overdense': 1 },
        { '/screenshots/underdense': 1 },
        { '/stats': 1 },
      ];

      store.getOne.mockResolvedValueOnce(null);
      archiver.compressFile.mockResolvedValueOnce(statistics);
      archiver.deleteFile.mockReturnValueOnce();

      let err;
      try {
        await compressor.handleCompression(filename);
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(store.getOne).toHaveBeenCalled();
        expect(archiver.compressFile).toHaveBeenCalledWith(path.join(localPath, filename));

        expect(archiver.deleteFile).toHaveBeenCalledWith(path.join(localPath, filename));
        expect(store.deleteOne).not.toHaveBeenCalled();

        expect(postMessageSpy).not.toHaveBeenCalled();
        expect(store.upsertOne).not.toHaveBeenCalled();
      }
    });

    test('should fail when the file to compress does not exits on the second try', async () => {
      const filename = 'not_a_file';
      const failStatus = 'failed_to_compress';

      store.getOne.mockResolvedValueOnce({
        _id: expect.any(String),
        filename,
        status: failStatus,
        retries: 1,
        date: expect.any(Date),
      });
      archiver.compressFile.mockRejectedValueOnce(new Error('not_a_file does not exist'));

      let err;
      try {
        await compressor.handleCompression(filename);
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeDefined();
        expect(err.message).toEqual(expect.stringContaining('not_a_file does not exist'));

        expect(store.getOne).toHaveBeenCalledWith({ filename, status: failStatus });
        expect(archiver.compressFile).toHaveBeenCalledWith(path.join(localPath, filename));

        expect(archiver.deleteFile).not.toHaveBeenCalled();
        expect(store.deleteOne).not.toHaveBeenCalled();

        expect(postMessageSpy).toHaveBeenCalled();
        expect(store.upsertOne).toHaveBeenCalledWith({ filename, status: failStatus, retries: 2 });
      }
    });

    test('should compress the file at the second try when it failed previously', async () => {
      const filename = '2020-09-01';
      const statistics = [
        { '/gnuplot/specs/fakes': 1 },
        { '/gnuplot/specs/overdense': 1 },
        { '/gnuplot/specs': 1 },
        { '/gnuplot/specs/underdense': 1 },
        { '/screenshots/fakes': 1 },
        { '/screenshots/overdense': 1 },
        { '/screenshots/underdense': 1 },
        { '/stats': 1 },
      ];
      const failStatus = 'failed_to_compress';

      store.getOne.mockResolvedValueOnce({
        _id: expect.any(String),
        filename,
        status: failStatus,
        retries: 1,
        date: expect.any(Date),
      });
      archiver.compressFile.mockResolvedValueOnce(statistics);
      archiver.deleteFile.mockReturnValueOnce();

      let err;
      try {
        await compressor.handleCompression(filename);
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(store.getOne).toHaveBeenCalledWith({ filename, status: failStatus });
        expect(archiver.compressFile).toHaveBeenCalledWith(path.join(localPath, filename));

        expect(archiver.deleteFile).toHaveBeenCalledWith(path.join(localPath, filename));
        expect(store.deleteOne).toHaveBeenCalledWith({ filename, status: failStatus });

        expect(postMessageSpy).not.toHaveBeenCalled();
        expect(store.upsertOne).not.toHaveBeenCalled();
      }
    });
  });
});
