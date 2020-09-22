const system = require('../../../system');

const slackBotMock = require('../../mocks/slackBotMock');
const sftpMock = require('../../mocks/sftpMock');
const archiverMock = require('../../mocks/archiverMock');
const storeMock = require('../../mocks/storeMock');
const compressorMock = require('../../mocks/compressorMock');
const uploaderMock = require('../../mocks/uploaderMock');

const {
  controller: { removalOffset },
} = require('../../../config/default');

describe('Controller component tests', () => {
  const sys = system();
  let controller;
  let uploader;
  let compressor;
  let archiver;

  beforeAll(async () => {
    sys.set('slackBot', slackBotMock());
    sys.set('sftp', sftpMock());
    sys.set('archiver', archiverMock());
    sys.set('store', storeMock());
    sys.set('compressor', compressorMock());
    sys.set('uploader', uploaderMock());
    ({
      controller, archiver, uploader, compressor,
    } = await sys.start());
  });

  afterEach(() => jest.clearAllMocks());

  afterAll(() => sys.stop());

  const getFilename = (shouldBeRemoved = false) => {
    const today = new Date();
    const offset = shouldBeRemoved ? removalOffset + 1 : 0;
    today.setDate(today.getDate() - offset);
    return today.toISOString().split('T')[0];
  };

  describe('handleTask', () => {
    test('should handle two files to compress and upload', async () => {
      const filename = getFilename();

      archiver.getDirectoryContent.mockResolvedValueOnce([filename, filename]);

      let err;
      try {
        await controller.handleTask();
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(compressor.handleCompression).toHaveBeenCalledTimes(2);
        expect(compressor.handleCompression).toHaveBeenCalledWith(filename);

        expect(uploader.handleUpload).toHaveBeenCalledTimes(2);
        expect(uploader.handleUpload).toHaveBeenCalledWith(filename);
      }
    });

    test('should handle two files to upload', async () => {
      const filename = getFilename();

      archiver.getDirectoryContent.mockResolvedValueOnce([`${filename}.zip`, `${filename}.zip`]);

      let err;
      try {
        await controller.handleTask();
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(compressor.handleCompression).not.toHaveBeenCalled();

        expect(uploader.handleUpload).toHaveBeenCalledTimes(2);
        expect(uploader.handleUpload).toHaveBeenCalledWith(filename);
      }
    });

    test('should handle a file to compress and upload, and one to upload', async () => {
      const filename = getFilename();

      archiver.getDirectoryContent.mockResolvedValueOnce([filename, `${filename}.zip`]);

      let err;
      try {
        await controller.handleTask();
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(compressor.handleCompression).toHaveBeenCalledTimes(1);
        expect(compressor.handleCompression).toHaveBeenCalledWith(filename);

        expect(uploader.handleUpload).toHaveBeenCalledTimes(2);
        expect(uploader.handleUpload).toHaveBeenCalledWith(filename);
      }
    });

    test('should handle a compression failure for the first file, and compress and upload the second file', async () => {
      const filename = getFilename();

      archiver.getDirectoryContent.mockResolvedValueOnce([filename, filename]);
      compressor.handleCompression.mockRejectedValueOnce(new Error());

      let err;
      try {
        await controller.handleTask();
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(compressor.handleCompression).toHaveBeenCalledTimes(2);
        expect(compressor.handleCompression).toHaveBeenCalledWith(filename);

        expect(uploader.handleUpload).toHaveBeenCalledTimes(1);
        expect(uploader.handleUpload).toHaveBeenCalledWith(filename);
      }
    });

    test('should handle an upload failure for the first file, and upload the second file', async () => {
      const filename = getFilename();

      archiver.getDirectoryContent.mockResolvedValueOnce([`${filename}.zip`, `${filename}.zip`]);
      uploader.handleUpload.mockRejectedValueOnce(new Error());

      let err;
      try {
        await controller.handleTask();
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(compressor.handleCompression).not.toHaveBeenCalled();

        expect(uploader.handleUpload).toHaveBeenCalledTimes(2);
        expect(uploader.handleUpload).toHaveBeenCalledWith(filename);
      }
    });
  });
});
