const path = require('path');
const system = require('../../../system');

const slackBotMock = require('../../mocks/slackBotMock');
const sftpMock = require('../../mocks/sftpMock');
const archiverMock = require('../../mocks/archiverMock');
const storeMock = require('../../mocks/storeMock');

const {
  controller: {
    localPath, remotePath, clientId, removalOffset,
  },
} = require('../../../config/default');

describe('Uploader component tests', () => {
  const sys = system();
  let uploader;
  let store;
  let archiver;
  let slackBot;
  let sftp;
  let postMessageSpy;

  beforeAll(async () => {
    sys.set('slackBot', slackBotMock());
    sys.set('sftp', sftpMock());
    sys.set('archiver', archiverMock());
    sys.set('store', storeMock());
    ({
      uploader, store, archiver, slackBot, sftp,
    } = await sys.start());

    postMessageSpy = jest.spyOn(slackBot, 'postMessage');
  });

  afterEach(() => jest.clearAllMocks());

  afterAll(() => sys.stop());

  const getFilename = (shouldBeRemoved = false) => {
    const today = new Date();
    const offset = shouldBeRemoved ? removalOffset + 1 : 0;
    today.setDate(today.getDate() - offset);
    return today.toISOString().split('T')[0];
  };

  describe('handleUpload', () => {
    test('should fail when the upload to SFTP server fails on the first try', async () => {
      const filename = '2020-09-01';
      const failStatus = 'failed_to_send';

      store.getOne.mockResolvedValueOnce(null);
      sftp.uploadFile.mockRejectedValueOnce(new Error('Error uploading file to SFTP'));

      let err;
      try {
        await uploader.handleUpload(filename);
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeDefined();

        expect(store.getOne).toHaveBeenCalledWith({ filename, status: failStatus });
        expect(sftp.uploadFile).toHaveBeenCalledWith({ filename: `${filename}.zip`, localPath, remotePath: path.join(remotePath, clientId) });

        expect(archiver.deleteFile).not.toHaveBeenCalled();
        expect(store.deleteOne).not.toHaveBeenCalled();

        expect(postMessageSpy).toHaveBeenCalled();
        expect(store.upsertOne).toHaveBeenCalledWith({ filename, status: failStatus, retries: 1 });
      }
    });

    test('should success when the upload to SFTP server success and not to remove the file', async () => {
      const filename = getFilename(false);
      const failStatus = 'failed_to_send';

      store.getOne.mockResolvedValueOnce(null);
      sftp.uploadFile.mockResolvedValueOnce();

      let err;
      try {
        await uploader.handleUpload(filename);
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(store.getOne).toHaveBeenCalledWith({ filename, status: failStatus });
        expect(sftp.uploadFile).toHaveBeenCalledWith({ filename: `${filename}.zip`, localPath, remotePath: path.join(remotePath, clientId) });

        expect(archiver.deleteFile).not.toHaveBeenCalled();
        expect(store.deleteOne).not.toHaveBeenCalled();

        expect(postMessageSpy).not.toHaveBeenCalled();
        expect(store.upsertOne).not.toHaveBeenCalled();
      }
    });

    test('should success when the upload to SFTP server success and remove the file', async () => {
      const filename = getFilename(true);
      const failStatus = 'failed_to_send';

      store.getOne.mockResolvedValueOnce(null);
      sftp.uploadFile.mockResolvedValueOnce();

      let err;
      try {
        await uploader.handleUpload(filename);
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(store.getOne).toHaveBeenCalledWith({ filename, status: failStatus });
        expect(sftp.uploadFile).toHaveBeenCalledWith({ filename: `${filename}.zip`, localPath, remotePath: path.join(remotePath, clientId) });

        expect(archiver.deleteFile).toHaveBeenCalledWith(path.join(localPath, `${filename}.zip`));
        expect(store.deleteOne).not.toHaveBeenCalled();

        expect(postMessageSpy).not.toHaveBeenCalled();
        expect(store.upsertOne).not.toHaveBeenCalled();
      }
    });

    test('should fail when the upload to SFTP server fails on the second try', async () => {
      const filename = '2020-09-01';
      const failStatus = 'failed_to_send';

      store.getOne.mockResolvedValueOnce({
        filename, status: failStatus, retries: 1,
      });
      sftp.uploadFile.mockRejectedValueOnce(new Error('Error uploading file to SFTP'));

      let err;
      try {
        await uploader.handleUpload(filename);
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeDefined();

        expect(store.getOne).toHaveBeenCalledWith({ filename, status: failStatus });
        expect(sftp.uploadFile).toHaveBeenCalledWith({ filename: `${filename}.zip`, localPath, remotePath: path.join(remotePath, clientId) });

        expect(archiver.deleteFile).not.toHaveBeenCalled();
        expect(store.deleteOne).not.toHaveBeenCalled();

        expect(postMessageSpy).toHaveBeenCalled();
        expect(store.upsertOne).toHaveBeenCalledWith({ filename, status: failStatus, retries: 2 });
      }
    });

    test('should success when the upload to SFTP server success on the second try and not to remove the file', async () => {
      const filename = getFilename(false);
      const failStatus = 'failed_to_send';

      store.getOne.mockResolvedValueOnce({
        filename, status: failStatus, retries: 1,
      });
      sftp.uploadFile.mockResolvedValueOnce();

      let err;
      try {
        await uploader.handleUpload(filename);
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(store.getOne).toHaveBeenCalledWith({ filename, status: failStatus });
        expect(sftp.uploadFile).toHaveBeenCalledWith({ filename: `${filename}.zip`, localPath, remotePath: path.join(remotePath, clientId) });

        expect(archiver.deleteFile).not.toHaveBeenCalled();
        expect(store.deleteOne).toHaveBeenCalledWith({ filename, status: failStatus });

        expect(postMessageSpy).not.toHaveBeenCalled();
        expect(store.upsertOne).not.toHaveBeenCalled();
      }
    });

    test('should success when the upload to SFTP server success on the second try and remove the file', async () => {
      const filename = getFilename(true);
      const failStatus = 'failed_to_send';

      store.getOne.mockResolvedValueOnce({
        filename, status: failStatus, retries: 1,
      });
      sftp.uploadFile.mockResolvedValueOnce();

      let err;
      try {
        await uploader.handleUpload(filename);
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(store.getOne).toHaveBeenCalledWith({ filename, status: failStatus });
        expect(sftp.uploadFile).toHaveBeenCalledWith({ filename: `${filename}.zip`, localPath, remotePath: path.join(remotePath, clientId) });

        expect(archiver.deleteFile).toHaveBeenCalledWith(path.join(localPath, `${filename}.zip`));
        expect(store.deleteOne).toHaveBeenCalledWith({ filename, status: failStatus });

        expect(postMessageSpy).not.toHaveBeenCalled();
        expect(store.upsertOne).not.toHaveBeenCalled();
      }
    });
  });
});
