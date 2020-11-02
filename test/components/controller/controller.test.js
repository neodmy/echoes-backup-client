const system = require('../../../system');

const slackMock = require('../../mocks/slackMock');
const sftpMock = require('../../mocks/sftpMock');
const archiverMock = require('../../mocks/archiverMock');
const storeMock = require('../../mocks/storeMock');
const compressorMock = require('../../mocks/compressorMock');
const uploaderMock = require('../../mocks/uploaderMock');

const {
  controller: { removalOffset },
} = require('../../../config/test');

describe('Controller component tests', () => {
  const sys = system();
  let controller;
  let uploader;
  let compressor;
  let archiver;
  let store;

  beforeAll(async () => {
    sys.set('slack', slackMock());
    sys.set('sftp', sftpMock());
    sys.set('archiver', archiverMock());
    sys.set('store', storeMock());
    sys.set('compressor', compressorMock());
    sys.set('uploader', uploaderMock());
    ({
      controller, archiver, uploader, compressor, store,
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

  describe('init', () => {
    test('should handle two files to compress and upload', async () => {
      const filename = getFilename();

      archiver.getDirectoryContent.mockResolvedValueOnce([filename, filename]);

      let err;
      try {
        await controller.init();
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

    test('should handle two files to compress and upload, and omit other with no YYYY-mm-dd pattern on its name', async () => {
      const filename = getFilename();

      archiver.getDirectoryContent.mockResolvedValueOnce([filename, filename, 'someotherfile']);

      let err;
      try {
        await controller.init();
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
        await controller.init();
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(compressor.handleCompression).not.toHaveBeenCalled();

        expect(uploader.handleUpload).toHaveBeenCalledTimes(2);
        expect(uploader.handleUpload).toHaveBeenCalledWith(filename);
      }
    });

    test('should handle two files to upload, and omit other with no YYYY-mm-dd pattern on its name', async () => {
      const filename = getFilename();

      archiver.getDirectoryContent.mockResolvedValueOnce([`${filename}.zip`, `${filename}.zip`, 'someotherfile.zip']);

      let err;
      try {
        await controller.init();
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
        await controller.init();
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
        await controller.init();
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
        await controller.init();
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

  describe('processFileToCompress', () => {
    test('should compress and upload a file', async () => {
      const filename = getFilename();

      let err;
      try {
        await controller.processFileToCompress(filename);
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(compressor.handleCompression).toHaveBeenCalledTimes(1);
        expect(compressor.handleCompression).toHaveBeenCalledWith(filename);

        expect(uploader.handleUpload).toHaveBeenCalledTimes(1);
        expect(uploader.handleUpload).toHaveBeenCalledWith(filename);
      }
    });

    test('should handle a compress failure and not to try uploading the file', async () => {
      const filename = getFilename();

      compressor.handleCompression.mockRejectedValueOnce(new Error());

      let err;
      try {
        await controller.processFileToCompress(filename);
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(compressor.handleCompression).toHaveBeenCalledTimes(1);
        expect(compressor.handleCompression).toHaveBeenCalledWith(filename);

        expect(uploader.handleUpload).not.toHaveBeenCalled();
      }
    });

    test('should compress the file and handle an upload failure', async () => {
      const filename = getFilename();

      uploader.handleUpload.mockRejectedValueOnce(new Error());

      let err;
      try {
        await controller.processFileToCompress(filename);
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(compressor.handleCompression).toHaveBeenCalledTimes(1);
        expect(compressor.handleCompression).toHaveBeenCalledWith(filename);

        expect(uploader.handleUpload).toHaveBeenCalledTimes(1);
        expect(uploader.handleUpload).toHaveBeenCalledWith(filename);
      }
    });
  });

  describe('processRetries', () => {
    test('should compress and upload two files, and upload two other files', async () => {
      const fileToCompress1 = {
        filename: '2020-09-10',
        status: 'failed_to_compress',
        date: new Date().toISOString(),
        retries: 1,
      };

      const fileToCompress2 = {
        filename: '2020-09-11',
        status: 'failed_to_compress',
        date: new Date().toISOString(),
        retries: 2,
      };

      const fileToUpload1 = {
        filename: '2020-09-12',
        status: 'failed_to_send',
        date: new Date().toISOString(),
        retries: 1,
      };

      const fileToUpload2 = {
        filename: '2020-09-13',
        status: 'failed_to_send',
        date: new Date().toISOString(),
        retries: 2,
      };

      store.getAll.mockResolvedValueOnce([fileToCompress1, fileToCompress2]);
      store.getAll.mockResolvedValueOnce([fileToUpload1, fileToUpload2]);

      let err;
      try {
        await controller.processRetries();
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(compressor.handleCompression).toHaveBeenCalledTimes(2);
        expect(compressor.handleCompression).toHaveBeenCalledWith(fileToCompress1.filename);
        expect(compressor.handleCompression).toHaveBeenCalledWith(fileToCompress2.filename);

        expect(uploader.handleUpload).toHaveBeenCalledTimes(4);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToCompress1.filename);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToCompress2.filename);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToUpload1.filename);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToUpload2.filename);
      }
    });

    test('should handle a compress failure, compress and upload other file, and upload two other files', async () => {
      const fileToCompress1 = {
        filename: '2020-09-10',
        status: 'failed_to_compress',
        date: new Date().toISOString(),
        retries: 1,
      };

      const fileToCompress2 = {
        filename: '2020-09-11',
        status: 'failed_to_compress',
        date: new Date().toISOString(),
        retries: 2,
      };

      const fileToUpload1 = {
        filename: '2020-09-12',
        status: 'failed_to_send',
        date: new Date().toISOString(),
        retries: 1,
      };

      const fileToUpload2 = {
        filename: '2020-09-13',
        status: 'failed_to_send',
        date: new Date().toISOString(),
        retries: 2,
      };

      store.getAll.mockResolvedValueOnce([fileToCompress1, fileToCompress2]);
      store.getAll.mockResolvedValueOnce([fileToUpload1, fileToUpload2]);
      compressor.handleCompression.mockRejectedValueOnce(new Error());

      let err;
      try {
        await controller.processRetries();
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(compressor.handleCompression).toHaveBeenCalledTimes(2);
        expect(compressor.handleCompression).toHaveBeenCalledWith(fileToCompress1.filename);
        expect(compressor.handleCompression).toHaveBeenCalledWith(fileToCompress2.filename);

        expect(uploader.handleUpload).toHaveBeenCalledTimes(3);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToCompress2.filename);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToUpload1.filename);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToUpload2.filename);
      }
    });

    test('should compress and upload a file, compress and handle an upload failure for other file, and upload two other files', async () => {
      const fileToCompress1 = {
        filename: '2020-09-10',
        status: 'failed_to_compress',
        date: new Date().toISOString(),
        retries: 1,
      };

      const fileToCompress2 = {
        filename: '2020-09-11',
        status: 'failed_to_compress',
        date: new Date().toISOString(),
        retries: 2,
      };

      const fileToUpload1 = {
        filename: '2020-09-12',
        status: 'failed_to_send',
        date: new Date().toISOString(),
        retries: 1,
      };

      const fileToUpload2 = {
        filename: '2020-09-13',
        status: 'failed_to_send',
        date: new Date().toISOString(),
        retries: 2,
      };

      store.getAll.mockResolvedValueOnce([fileToCompress1, fileToCompress2]);
      store.getAll.mockResolvedValueOnce([fileToUpload1, fileToUpload2]);
      uploader.handleUpload.mockRejectedValueOnce(new Error());

      let err;
      try {
        await controller.processRetries();
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(compressor.handleCompression).toHaveBeenCalledTimes(2);
        expect(compressor.handleCompression).toHaveBeenCalledWith(fileToCompress1.filename);
        expect(compressor.handleCompression).toHaveBeenCalledWith(fileToCompress2.filename);

        expect(uploader.handleUpload).toHaveBeenCalledTimes(4);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToCompress1.filename);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToCompress2.filename);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToUpload1.filename);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToUpload2.filename);
      }
    });

    test('should compress and upload two files, upload other file, and handle an upload failure for other file', async () => {
      const fileToCompress1 = {
        filename: '2020-09-10',
        status: 'failed_to_compress',
        date: new Date().toISOString(),
        retries: 1,
      };

      const fileToCompress2 = {
        filename: '2020-09-11',
        status: 'failed_to_compress',
        date: new Date().toISOString(),
        retries: 2,
      };

      const fileToUpload1 = {
        filename: '2020-09-12',
        status: 'failed_to_send',
        date: new Date().toISOString(),
        retries: 1,
      };

      const fileToUpload2 = {
        filename: '2020-09-13',
        status: 'failed_to_send',
        date: new Date().toISOString(),
        retries: 2,
      };

      store.getAll.mockResolvedValueOnce([fileToCompress1, fileToCompress2]);
      store.getAll.mockResolvedValueOnce([fileToUpload1, fileToUpload2]);
      uploader.handleUpload.mockRejectedValueOnce(new Error());

      let err;
      try {
        await controller.processRetries();
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(compressor.handleCompression).toHaveBeenCalledTimes(2);
        expect(compressor.handleCompression).toHaveBeenCalledWith(fileToCompress1.filename);
        expect(compressor.handleCompression).toHaveBeenCalledWith(fileToCompress2.filename);

        expect(uploader.handleUpload).toHaveBeenCalledTimes(4);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToCompress1.filename);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToCompress2.filename);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToUpload1.filename);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToUpload2.filename);
      }
    });
  });
});
