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
    test('should fail when the upload to SFTP server fails for the first time', async () => {
      const filename = '2020-09-01';
      const failStatus = 'failed_to_send';

      store.getAllFail.mockResolvedValueOnce(null);
      sftp.uploadFile.mockRejectedValueOnce(new Error('Error uploading file to SFTP'));

      let err;
      try {
        await uploader.handleUpload(filename);
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeDefined();

        expect(store.getAllFail).toHaveBeenCalledWith({ filename, status: failStatus });
        expect(sftp.uploadFile).toHaveBeenCalledWith({ filename: `${filename}.zip`, localPath, remotePath: path.join(remotePath, clientId) });
        expect(store.insertOneSuccess).not.toHaveBeenCalled();

        expect(archiver.deleteFile).not.toHaveBeenCalled();
        expect(store.deleteOneFail).not.toHaveBeenCalled();

        expect(postMessageSpy).toHaveBeenCalled();
        expect(store.upsertOneFail).toHaveBeenCalledWith({ filename, status: failStatus, retries: 1 });
      }
    });

    test('should success when the upload to SFTP server success and not to remove the file', async () => {
      const filename = getFilename(false);
      const failStatus = 'failed_to_send';
      const successStatus = 'sent';

      store.getAllFail.mockResolvedValueOnce(null);
      sftp.uploadFile.mockResolvedValueOnce();

      let err;
      try {
        await uploader.handleUpload(filename);
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(store.getAllFail).toHaveBeenCalledWith({ filename, status: failStatus });
        expect(sftp.uploadFile).toHaveBeenCalledWith({ filename: `${filename}.zip`, localPath, remotePath: path.join(remotePath, clientId) });
        expect(store.insertOneSuccess).toHaveBeenCalledWith({ filename, status: successStatus, retries: 0 });

        expect(archiver.deleteFile).not.toHaveBeenCalled();
        expect(store.deleteOneFail).not.toHaveBeenCalled();

        expect(postMessageSpy).not.toHaveBeenCalled();
        expect(store.upsertOneFail).not.toHaveBeenCalled();
      }
    });

    test('should success when the upload to SFTP server success and remove the file', async () => {
      const filename = getFilename(true);
      const failStatus = 'failed_to_send';
      const successStatus = 'sent';

      store.getAllFail.mockResolvedValueOnce(null);
      sftp.uploadFile.mockResolvedValueOnce();

      let err;
      try {
        await uploader.handleUpload(filename);
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(store.getAllFail).toHaveBeenCalledWith({ filename, status: failStatus });
        expect(sftp.uploadFile).toHaveBeenCalledWith({ filename: `${filename}.zip`, localPath, remotePath: path.join(remotePath, clientId) });
        expect(store.insertOneSuccess).toHaveBeenCalledWith({ filename, status: successStatus, retries: 0 });

        expect(archiver.deleteFile).toHaveBeenCalledWith(path.join(localPath, `${filename}.zip`));
        expect(store.deleteOneFail).not.toHaveBeenCalled();

        expect(postMessageSpy).not.toHaveBeenCalled();
        expect(store.upsertOneFail).not.toHaveBeenCalled();
      }
    });

    test('should fail when the upload to SFTP server fails for the second time', async () => {
      const filename = '2020-09-01';
      const failStatus = 'failed_to_send';

      store.getAllFail.mockResolvedValueOnce({
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

        expect(store.getAllFail).toHaveBeenCalledWith({ filename, status: failStatus });
        expect(sftp.uploadFile).toHaveBeenCalledWith({ filename: `${filename}.zip`, localPath, remotePath: path.join(remotePath, clientId) });
        expect(store.insertOneSuccess).not.toHaveBeenCalled();

        expect(archiver.deleteFile).not.toHaveBeenCalled();
        expect(store.deleteOneFail).not.toHaveBeenCalled();

        expect(postMessageSpy).toHaveBeenCalled();
        expect(store.upsertOneFail).toHaveBeenCalledWith({ filename, status: failStatus, retries: 2 });
      }
    });

    test('should success when the upload to SFTP server success at the second time and not to remove the file', async () => {
      const filename = getFilename(false);
      const failStatus = 'failed_to_send';
      const successStatus = 'sent';

      store.getAllFail.mockResolvedValueOnce({
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

        expect(store.getAllFail).toHaveBeenCalledWith({ filename, status: failStatus });
        expect(sftp.uploadFile).toHaveBeenCalledWith({ filename: `${filename}.zip`, localPath, remotePath: path.join(remotePath, clientId) });
        expect(store.insertOneSuccess).toHaveBeenCalledWith({ filename, status: successStatus, retries: 1 });

        expect(archiver.deleteFile).not.toHaveBeenCalled();
        expect(store.deleteOneFail).toHaveBeenCalledWith({ filename, status: failStatus });

        expect(postMessageSpy).not.toHaveBeenCalled();
        expect(store.upsertOneFail).not.toHaveBeenCalled();
      }
    });

    test('should success when the upload to SFTP server success at the second time and remove the file', async () => {
      const filename = getFilename(true);
      const failStatus = 'failed_to_send';
      const successStatus = 'sent';

      store.getAllFail.mockResolvedValueOnce({
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

        expect(store.getAllFail).toHaveBeenCalledWith({ filename, status: failStatus });
        expect(sftp.uploadFile).toHaveBeenCalledWith({ filename: `${filename}.zip`, localPath, remotePath: path.join(remotePath, clientId) });
        expect(store.insertOneSuccess).toHaveBeenCalledWith({ filename, status: successStatus, retries: 1 });

        expect(archiver.deleteFile).toHaveBeenCalledWith(path.join(localPath, `${filename}.zip`));
        expect(store.deleteOneFail).toHaveBeenCalledWith({ filename, status: failStatus });

        expect(postMessageSpy).not.toHaveBeenCalled();
        expect(store.upsertOneFail).not.toHaveBeenCalled();
      }
    });
  });
});
