const path = require('path');
const system = require('../../../system');

const slackMock = require('../../mocks/slackMock');
const sftpMock = require('../../mocks/sftpMock');
const archiverMock = require('../../mocks/archiverMock');
const storeMock = require('../../mocks/storeMock');
const mailerMock = require('../../mocks/mailerMock');

const {
  controller: {
    localPath, remotePath, clientId,
  },
} = require('../../../config/test');

describe('Uploader component tests', () => {
  const sys = system();
  let uploader;
  let store;
  let slack;
  let sftp;
  let mailer;
  let postMessageSpy;
  let mailerSpy;

  beforeAll(async () => {
    sys.remove('task');
    sys.set('slack', slackMock());
    sys.set('sftp', sftpMock());
    sys.set('archiver', archiverMock());
    sys.set('store', storeMock());
    sys.set('mailer', mailerMock());
    ({
      uploader, store, slack, sftp, mailer,
    } = await sys.start());

    postMessageSpy = jest.spyOn(slack, 'postMessage');
    mailerSpy = jest.spyOn(mailer, 'sendMail');
  });

  afterEach(() => jest.clearAllMocks());

  afterAll(() => sys.stop());

  describe('handleUpload', () => {
    test('should fail when the upload to SFTP server fails on the first try', async () => {
      const filename = '2020-09-01';
      const failStatus = 'failed_to_send';
      const sentStatus = 'sent';

      store.getOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      sftp.uploadDir.mockRejectedValueOnce(new Error('Error uploading file to SFTP'));

      let err;
      try {
        await uploader.handleUpload(filename);
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeDefined();

        expect(store.getOne).toHaveBeenCalledWith({ filename, status: failStatus });
        expect(sftp.uploadDir).toHaveBeenCalledWith({ dirName: filename, localPath, remotePath: path.join(remotePath, clientId, 'echoes_backup') });

        expect(store.deleteOne).not.toHaveBeenCalled();
        expect(store.upsertOne).not.toHaveBeenCalledWith({ filename, status: sentStatus });

        expect(postMessageSpy).toHaveBeenCalled();
        expect(mailerSpy).toHaveBeenCalled();
        expect(store.upsertOne).toHaveBeenCalledWith({ filename, status: failStatus, retries: 1 });
      }
    });

    test('should success when the upload to SFTP server success on the first try', async () => {
      const filename = '2020-09-01';
      const failStatus = 'failed_to_send';
      const sentStatus = 'sent';

      store.getOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      sftp.uploadDir.mockResolvedValueOnce();

      let err;
      try {
        await uploader.handleUpload(filename);
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(store.getOne).toHaveBeenCalledWith({ filename, status: failStatus });
        expect(sftp.uploadDir).toHaveBeenCalledWith({ dirName: filename, localPath, remotePath: path.join(remotePath, clientId, 'echoes_backup') });

        expect(store.deleteOne).not.toHaveBeenCalled();
        expect(store.upsertOne).toHaveBeenCalledWith({ filename, status: sentStatus });

        expect(postMessageSpy).not.toHaveBeenCalled();
        expect(mailerSpy).not.toHaveBeenCalled();
        expect(store.upsertOne).not.toHaveBeenCalledWith(expect.objectContaining({ filename, status: failStatus }));
      }
    });

    test('should fail when the upload to SFTP server fails on the second try', async () => {
      const filename = '2020-09-01';
      const failStatus = 'failed_to_send';
      const sentStatus = 'sent';

      store.getOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          filename, status: failStatus, retries: 1,
        });
      sftp.uploadDir.mockRejectedValueOnce(new Error('Error uploading file to SFTP'));

      let err;
      try {
        await uploader.handleUpload(filename);
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeDefined();

        expect(store.getOne).toHaveBeenCalledWith({ filename, status: failStatus });
        expect(sftp.uploadDir).toHaveBeenCalledWith({ dirName: filename, localPath, remotePath: path.join(remotePath, clientId, 'echoes_backup') });

        expect(store.deleteOne).not.toHaveBeenCalled();
        expect(store.upsertOne).not.toHaveBeenCalledWith({ filename, status: sentStatus });

        expect(postMessageSpy).toHaveBeenCalled();
        expect(mailerSpy).toHaveBeenCalled();
        expect(store.upsertOne).toHaveBeenCalledWith({ filename, status: failStatus, retries: 2 });
      }
    });

    test('should success when the upload to SFTP server success on the second try', async () => {
      const filename = '2020-09-01';
      const failStatus = 'failed_to_send';
      const sentStatus = 'sent';

      store.getOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          filename, status: failStatus, retries: 1,
        });
      sftp.uploadDir.mockResolvedValueOnce();

      let err;
      try {
        await uploader.handleUpload(filename);
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(store.getOne).toHaveBeenCalledWith({ filename, status: failStatus });
        expect(sftp.uploadDir).toHaveBeenCalledWith({ dirName: filename, localPath, remotePath: path.join(remotePath, clientId, 'echoes_backup') });

        expect(store.deleteOne).toHaveBeenCalledWith({ filename, status: failStatus });
        expect(store.upsertOne).toHaveBeenCalledWith({ filename, status: sentStatus });

        expect(postMessageSpy).not.toHaveBeenCalled();
        expect(mailerSpy).not.toHaveBeenCalled();
        expect(store.upsertOne).not.toHaveBeenCalledWith(expect.objectContaining({ filename, status: failStatus }));
      }
    });

    test('should skip the upload to SFTP server when the file has already been sent', async () => {
      const filename = '2020-09-01';
      const sentStatus = 'sent';

      store.getOne
        .mockResolvedValueOnce({
          filename, status: sentStatus,
        });

      let err;
      try {
        await uploader.handleUpload(filename);
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(sftp.uploadDir).not.toHaveBeenCalled();

        expect(store.deleteOne).not.toHaveBeenCalled();
        expect(store.upsertOne).not.toHaveBeenCalled();

        expect(postMessageSpy).not.toHaveBeenCalled();
        expect(mailerSpy).not.toHaveBeenCalled();
      }
    });
  });
});
