const path = require('path');
const system = require('../../../system');

const slackBotMock = require('../../mocks/slackBotMock');
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
  let slackBot;
  let postMessageSpy;

  beforeAll(async () => {
    sys.set('slackBot', slackBotMock());
    sys.set('sftp', sftpMock());
    sys.set('archiver', archiverMock());
    sys.set('store', storeMock());
    ({
      compressor, store, archiver, slackBot,
    } = await sys.start());

    postMessageSpy = jest.spyOn(slackBot, 'postMessage');
  });

  afterEach(() => jest.clearAllMocks());

  afterAll(() => sys.stop());

  describe('handleCompression', () => {
    test('should fail when the file to compress does not exist for the first time', async () => {
      const filename = 'not_a_file';
      const failStatus = 'failed_to_compress';

      store.getAllFail.mockResolvedValueOnce(null);
      archiver.compressFile.mockRejectedValueOnce(new Error('not_a_file does not exist'));

      let err;
      try {
        await compressor.handleCompression(filename);
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeDefined();
        expect(err.message).toEqual(expect.stringContaining('not_a_file does not exist'));

        expect(store.getAllFail).toHaveBeenCalledWith({ filename, status: failStatus });
        expect(archiver.compressFile).toHaveBeenCalledWith(path.join(localPath, filename));
        expect(store.insertOneSuccess).not.toHaveBeenCalled();

        expect(archiver.deleteFile).not.toHaveBeenCalled();
        expect(store.deleteOneFail).not.toHaveBeenCalled();

        expect(postMessageSpy).toHaveBeenCalled();
        expect(store.upsertOneFail).toHaveBeenCalledWith({ filename, status: failStatus, retries: 1 });
      }
    });

    test('should success when the file to compress exists', async () => {
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
      const successStatus = 'compressed';

      store.getAllFail.mockResolvedValueOnce(null);
      archiver.compressFile.mockResolvedValueOnce(statistics);
      store.insertOneSuccess.mockResolvedValueOnce({
        _id: expect.any(String),
        filename,
        status: successStatus,
        retries: 0,
        date: expect.any(Date),
      });
      archiver.deleteFile.mockReturnValueOnce();

      let err;
      try {
        await compressor.handleCompression(filename);
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(store.getAllFail).toHaveBeenCalled();
        expect(archiver.compressFile).toHaveBeenCalledWith(path.join(localPath, filename));
        expect(store.insertOneSuccess).toHaveBeenCalledWith({
          filename, statistics, status: successStatus, retries: 0,
        });

        expect(archiver.deleteFile).toHaveBeenCalledWith(path.join(localPath, filename));
        expect(store.deleteOneFail).not.toHaveBeenCalled();

        expect(postMessageSpy).not.toHaveBeenCalled();
        expect(store.upsertOneFail).not.toHaveBeenCalled();
      }
    });

    test('should fail when the file to compress does not exits for the second time', async () => {
      const filename = 'not_a_file';
      const failStatus = 'failed_to_compress';

      store.getAllFail.mockResolvedValueOnce({
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

        expect(store.getAllFail).toHaveBeenCalledWith({ filename, status: failStatus });
        expect(archiver.compressFile).toHaveBeenCalledWith(path.join(localPath, filename));
        expect(store.insertOneSuccess).not.toHaveBeenCalled();

        expect(archiver.deleteFile).not.toHaveBeenCalled();
        expect(store.deleteOneFail).not.toHaveBeenCalled();

        expect(postMessageSpy).toHaveBeenCalled();
        expect(store.upsertOneFail).toHaveBeenCalledWith({ filename, status: failStatus, retries: 2 });
      }
    });

    test('should compress the file at the second time when it failed previously', async () => {
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
      const successStatus = 'compressed';

      store.getAllFail.mockResolvedValueOnce({
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

        expect(store.getAllFail).toHaveBeenCalledWith({ filename, status: failStatus });
        expect(archiver.compressFile).toHaveBeenCalledWith(path.join(localPath, filename));
        expect(store.insertOneSuccess).toHaveBeenCalledWith({
          filename, statistics, status: successStatus, retries: 1,
        });

        expect(archiver.deleteFile).toHaveBeenCalledWith(path.join(localPath, filename));
        expect(store.deleteOneFail).toHaveBeenCalledWith({ filename, status: failStatus });

        expect(postMessageSpy).not.toHaveBeenCalled();
        expect(store.upsertOneFail).not.toHaveBeenCalled();
      }
    });
  });
});
