const path = require('path');

const system = require('../../../system');

const slackMock = require('../../mocks/slackMock');
const sftpMock = require('../../mocks/sftpMock');
const archiverMock = require('../../mocks/archiverMock');
const storeMock = require('../../mocks/storeMock');
const compressorMock = require('../../mocks/compressorMock');
const uploaderMock = require('../../mocks/uploaderMock');
const csvMock = require('../../mocks/csvMock');

const {
  controller: { removalOffset, localPath },
} = require('../../../config/test');

describe('Controller component tests', () => {
  const sys = system();
  let controller;
  let uploader;
  let compressor;
  let csv;
  let archiver;
  let store;

  beforeAll(async () => {
    sys.set('slack', slackMock());
    sys.set('sftp', sftpMock());
    sys.set('archiver', archiverMock());
    sys.set('store', storeMock());
    sys.set('compressor', compressorMock());
    sys.set('uploader', uploaderMock());
    sys.set('csv', csvMock());
    ({
      controller, archiver, uploader, compressor, csv, store,
    } = await sys.start());
  });

  afterEach(() => jest.clearAllMocks());

  afterAll(() => sys.stop());

  describe('init', () => {
    test('should handle two files to compress and upload', async () => {
      const filename1 = '2020-10-09';
      const filename2 = '2020-10-10';

      archiver.getDirectoryContent.mockResolvedValueOnce([filename1, filename2]);

      let err;
      try {
        await controller.init();
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(compressor.handleCompression).toHaveBeenCalledTimes(2);
        expect(compressor.handleCompression).toHaveBeenCalledWith(filename1);
        expect(compressor.handleCompression).toHaveBeenCalledWith(filename2);

        expect(uploader.handleUpload).toHaveBeenCalledTimes(2);
        expect(uploader.handleUpload).toHaveBeenCalledWith(filename1);
        expect(uploader.handleUpload).toHaveBeenCalledWith(filename2);
      }
    });

    test('should handle two files to compress and upload, and omit other with no YYYY-mm-dd pattern on its name', async () => {
      const filename1 = '2020-10-09';
      const filename2 = '2020-10-10';

      archiver.getDirectoryContent.mockResolvedValueOnce([filename1, filename2, 'someotherfile']);

      let err;
      try {
        await controller.init();
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(compressor.handleCompression).toHaveBeenCalledTimes(2);
        expect(compressor.handleCompression).toHaveBeenCalledWith(filename1);
        expect(compressor.handleCompression).toHaveBeenCalledWith(filename2);

        expect(uploader.handleUpload).toHaveBeenCalledTimes(2);
        expect(uploader.handleUpload).toHaveBeenCalledWith(filename1);
        expect(uploader.handleUpload).toHaveBeenCalledWith(filename2);
      }
    });

    test('should handle two files to upload', async () => {
      const filename1 = '2020-10-09';
      const filename2 = '2020-10-10';

      archiver.getDirectoryContent.mockResolvedValueOnce([`${filename1}.zip`, `${filename2}.zip`]);

      let err;
      try {
        await controller.init();
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(compressor.handleCompression).not.toHaveBeenCalled();

        expect(uploader.handleUpload).toHaveBeenCalledTimes(2);
        expect(uploader.handleUpload).toHaveBeenCalledWith(filename1);
        expect(uploader.handleUpload).toHaveBeenCalledWith(filename2);
      }
    });

    test('should handle two files to upload, and omit other with no YYYY-mm-dd pattern on its name', async () => {
      const filename1 = '2020-10-09';
      const filename2 = '2020-10-10';

      archiver.getDirectoryContent.mockResolvedValueOnce([`${filename1}.zip`, `${filename2}.zip`, 'someotherfile.zip']);

      let err;
      try {
        await controller.init();
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(compressor.handleCompression).not.toHaveBeenCalled();

        expect(uploader.handleUpload).toHaveBeenCalledTimes(2);
        expect(uploader.handleUpload).toHaveBeenCalledWith(filename1);
        expect(uploader.handleUpload).toHaveBeenCalledWith(filename2);
      }
    });

    test('should handle a file to compress and upload, and one to upload', async () => {
      const filename1 = '2020-10-09';
      const filename2 = '2020-10-10';

      archiver.getDirectoryContent.mockResolvedValueOnce([filename1, `${filename2}.zip`]);

      let err;
      try {
        await controller.init();
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(compressor.handleCompression).toHaveBeenCalledTimes(1);
        expect(compressor.handleCompression).toHaveBeenCalledWith(filename1);

        expect(uploader.handleUpload).toHaveBeenCalledTimes(2);
        expect(uploader.handleUpload).toHaveBeenCalledWith(filename1);
        expect(uploader.handleUpload).toHaveBeenCalledWith(filename2);
      }
    });

    test('should handle a compression failure for the first file, and compress and upload the second file', async () => {
      const filename1 = '2020-10-09';
      const filename2 = '2020-10-10';

      archiver.getDirectoryContent.mockResolvedValueOnce([filename1, filename2]);
      compressor.handleCompression.mockRejectedValueOnce(new Error());

      let err;
      try {
        await controller.init();
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(compressor.handleCompression).toHaveBeenCalledTimes(2);
        expect(compressor.handleCompression).toHaveBeenCalledWith(filename1);
        expect(compressor.handleCompression).toHaveBeenCalledWith(filename2);

        expect(uploader.handleUpload).toHaveBeenCalledTimes(1);
        expect(uploader.handleUpload).toHaveBeenCalledWith(filename2);
      }
    });

    test('should handle an upload failure for the first file, and upload the second file', async () => {
      const filename1 = '2020-10-09';
      const filename2 = '2020-10-10';

      archiver.getDirectoryContent.mockResolvedValueOnce([`${filename1}.zip`, `${filename2}.zip`]);
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
        expect(uploader.handleUpload).toHaveBeenCalledWith(filename1);
        expect(uploader.handleUpload).toHaveBeenCalledWith(filename2);
      }
    });
  });

  describe('processFileToExtractCsvData', () => {
    test('should extract CSV data, compress and upload a file', async () => {
      const filename = '2020-10-09';

      let err;
      try {
        await controller.processFileToExtractCsvData(filename);
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(csv.handleCsvData).toHaveBeenCalledTimes(1);
        expect(csv.handleCsvData).toHaveBeenCalledWith(filename);

        expect(compressor.handleCompression).toHaveBeenCalledTimes(1);
        expect(compressor.handleCompression).toHaveBeenCalledWith(filename);

        expect(uploader.handleUpload).toHaveBeenCalledTimes(1);
        expect(uploader.handleUpload).toHaveBeenCalledWith(filename);
      }
    });

    test('should handle an error extracting CSV data and not to try compress and upload the file', async () => {
      const filename = '2020-10-09';

      csv.handleCsvData.mockRejectedValueOnce(new Error());

      let err;
      try {
        await controller.processFileToExtractCsvData(filename);
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(csv.handleCsvData).toHaveBeenCalledTimes(1);
        expect(csv.handleCsvData).toHaveBeenCalledWith(filename);

        expect(compressor.handleCompression).not.toHaveBeenCalled();

        expect(uploader.handleUpload).not.toHaveBeenCalled();
      }
    });

    test('should extract CSV data, handle a compression failure and not to try uploading the file', async () => {
      const filename = '2020-10-09';

      compressor.handleCompression.mockRejectedValueOnce(new Error());

      let err;
      try {
        await controller.processFileToExtractCsvData(filename);
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(csv.handleCsvData).toHaveBeenCalledTimes(1);
        expect(csv.handleCsvData).toHaveBeenCalledWith(filename);

        expect(compressor.handleCompression).toHaveBeenCalledTimes(1);
        expect(compressor.handleCompression).toHaveBeenCalledWith(filename);

        expect(uploader.handleUpload).not.toHaveBeenCalled();
      }
    });

    test('should extract CSV data, compress the file and handle an upload failure', async () => {
      const filename = '2020-10-09';

      uploader.handleUpload.mockRejectedValueOnce(new Error());

      let err;
      try {
        await controller.processFileToExtractCsvData(filename);
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(csv.handleCsvData).toHaveBeenCalledTimes(1);
        expect(csv.handleCsvData).toHaveBeenCalledWith(filename);

        expect(compressor.handleCompression).toHaveBeenCalledTimes(1);
        expect(compressor.handleCompression).toHaveBeenCalledWith(filename);

        expect(uploader.handleUpload).toHaveBeenCalledTimes(1);
        expect(uploader.handleUpload).toHaveBeenCalledWith(filename);
      }
    });
  });

  describe('processFileToCompress', () => {
    test('should compress and upload a file', async () => {
      const filename = '2020-10-09';

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
      const filename = '2020-10-09';

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
      const filename = '2020-10-09';

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
    test('should process, compress and upload two files; compress and upload two other files; and upload two other files', async () => {
      const fileToProcessCsv1 = {
        filename: '2020-09-08',
        status: 'failed_to_extract_csv',
        date: new Date().toISOString(),
        retries: 1,
      };

      const fileToProcessCsv2 = {
        filename: '2020-09-09',
        status: 'failed_to_extract_csv',
        date: new Date().toISOString(),
        retries: 2,
      };

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

      store.getAll.mockResolvedValueOnce([fileToProcessCsv1, fileToProcessCsv2]);
      store.getAll.mockResolvedValueOnce([fileToCompress1, fileToCompress2]);
      store.getAll.mockResolvedValueOnce([fileToUpload1, fileToUpload2]);

      let err;
      try {
        await controller.processRetries();
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(csv.handleCsvData).toHaveBeenCalledTimes(2);
        expect(csv.handleCsvData).toHaveBeenCalledWith(fileToProcessCsv1.filename);
        expect(csv.handleCsvData).toHaveBeenCalledWith(fileToProcessCsv2.filename);

        expect(compressor.handleCompression).toHaveBeenCalledTimes(4);
        expect(compressor.handleCompression).toHaveBeenCalledWith(fileToProcessCsv1.filename);
        expect(compressor.handleCompression).toHaveBeenCalledWith(fileToProcessCsv2.filename);
        expect(compressor.handleCompression).toHaveBeenCalledWith(fileToCompress1.filename);
        expect(compressor.handleCompression).toHaveBeenCalledWith(fileToCompress2.filename);

        expect(uploader.handleUpload).toHaveBeenCalledTimes(6);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToProcessCsv1.filename);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToProcessCsv1.filename);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToCompress1.filename);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToCompress2.filename);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToUpload1.filename);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToUpload2.filename);
      }
    });

    test('should handle a process failure;  process, compress and upload other file; compress and upload two other files; and upload two other files', async () => {
      const fileToProcessCsv1 = {
        filename: '2020-09-08',
        status: 'failed_to_extract_csv',
        date: new Date().toISOString(),
        retries: 1,
      };

      const fileToProcessCsv2 = {
        filename: '2020-09-09',
        status: 'failed_to_extract_csv',
        date: new Date().toISOString(),
        retries: 2,
      };

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

      store.getAll.mockResolvedValueOnce([fileToProcessCsv1, fileToProcessCsv2]);
      store.getAll.mockResolvedValueOnce([fileToCompress1, fileToCompress2]);
      store.getAll.mockResolvedValueOnce([fileToUpload1, fileToUpload2]);
      csv.handleCsvData.mockRejectedValueOnce(new Error());

      let err;
      try {
        await controller.processRetries();
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(csv.handleCsvData).toHaveBeenCalledTimes(2);
        expect(csv.handleCsvData).toHaveBeenCalledWith(fileToProcessCsv1.filename);
        expect(csv.handleCsvData).toHaveBeenCalledWith(fileToProcessCsv2.filename);

        expect(compressor.handleCompression).toHaveBeenCalledTimes(3);
        expect(compressor.handleCompression).toHaveBeenCalledWith(fileToProcessCsv2.filename);
        expect(compressor.handleCompression).toHaveBeenCalledWith(fileToCompress1.filename);
        expect(compressor.handleCompression).toHaveBeenCalledWith(fileToCompress2.filename);

        expect(uploader.handleUpload).toHaveBeenCalledTimes(5);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToProcessCsv2.filename);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToCompress1.filename);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToCompress2.filename);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToUpload1.filename);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToUpload2.filename);
      }
    });

    test('should process a file, and handle a compress failure;  process, compress and upload other file; compress and upload two other files; and upload two other files', async () => {
      const fileToProcessCsv1 = {
        filename: '2020-09-08',
        status: 'failed_to_extract_csv',
        date: new Date().toISOString(),
        retries: 1,
      };

      const fileToProcessCsv2 = {
        filename: '2020-09-09',
        status: 'failed_to_extract_csv',
        date: new Date().toISOString(),
        retries: 2,
      };

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

      store.getAll.mockResolvedValueOnce([fileToProcessCsv1, fileToProcessCsv2]);
      store.getAll.mockResolvedValueOnce([fileToCompress1, fileToCompress2]);
      store.getAll.mockResolvedValueOnce([fileToUpload1, fileToUpload2]);

      compressor.handleCompression.mockImplementation(filename => {
        if (filename === fileToProcessCsv1.filename) {
          return Promise.reject();
        }
        return Promise.resolve();
      });

      let err;
      try {
        await controller.processRetries();
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(csv.handleCsvData).toHaveBeenCalledTimes(2);
        expect(csv.handleCsvData).toHaveBeenCalledWith(fileToProcessCsv1.filename);
        expect(csv.handleCsvData).toHaveBeenCalledWith(fileToProcessCsv2.filename);

        expect(compressor.handleCompression).toHaveBeenCalledTimes(4);
        expect(compressor.handleCompression).toHaveBeenCalledWith(fileToProcessCsv1.filename);
        expect(compressor.handleCompression).toHaveBeenCalledWith(fileToProcessCsv2.filename);
        expect(compressor.handleCompression).toHaveBeenCalledWith(fileToCompress1.filename);
        expect(compressor.handleCompression).toHaveBeenCalledWith(fileToCompress2.filename);

        expect(uploader.handleUpload).toHaveBeenCalledTimes(5);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToProcessCsv2.filename);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToCompress1.filename);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToCompress2.filename);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToUpload1.filename);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToUpload2.filename);

        // reset mock
        compressor.handleCompression.mockResolvedValue();
      }
    });

    test('should process and compress a file, and handle an upload failure;  process, compress and upload other file; compress and upload two other files; and upload two other files', async () => {
      const fileToProcessCsv1 = {
        filename: '2020-09-08',
        status: 'failed_to_extract_csv',
        date: new Date().toISOString(),
        retries: 1,
      };

      const fileToProcessCsv2 = {
        filename: '2020-09-09',
        status: 'failed_to_extract_csv',
        date: new Date().toISOString(),
        retries: 2,
      };

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

      store.getAll.mockResolvedValueOnce([fileToProcessCsv1, fileToProcessCsv2]);
      store.getAll.mockResolvedValueOnce([fileToCompress1, fileToCompress2]);
      store.getAll.mockResolvedValueOnce([fileToUpload1, fileToUpload2]);

      uploader.handleUpload.mockImplementation(filename => {
        if (filename === fileToProcessCsv1.filename) {
          return Promise.reject();
        }
        return Promise.resolve();
      });

      let err;
      try {
        await controller.processRetries();
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(csv.handleCsvData).toHaveBeenCalledTimes(2);
        expect(csv.handleCsvData).toHaveBeenCalledWith(fileToProcessCsv1.filename);
        expect(csv.handleCsvData).toHaveBeenCalledWith(fileToProcessCsv2.filename);

        expect(compressor.handleCompression).toHaveBeenCalledTimes(4);
        expect(compressor.handleCompression).toHaveBeenCalledWith(fileToProcessCsv1.filename);
        expect(compressor.handleCompression).toHaveBeenCalledWith(fileToProcessCsv2.filename);
        expect(compressor.handleCompression).toHaveBeenCalledWith(fileToCompress1.filename);
        expect(compressor.handleCompression).toHaveBeenCalledWith(fileToCompress2.filename);

        expect(uploader.handleUpload).toHaveBeenCalledTimes(6);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToProcessCsv1.filename);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToProcessCsv2.filename);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToCompress1.filename);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToCompress2.filename);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToUpload1.filename);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToUpload2.filename);

        // reset mock
        uploader.handleUpload.mockResolvedValue();
      }
    });

    test('should process, compress and upload two files; handle a compress failure, compress and upload other file; and upload two other files', async () => {
      const fileToProcessCsv1 = {
        filename: '2020-09-08',
        status: 'failed_to_extract_csv',
        date: new Date().toISOString(),
        retries: 1,
      };

      const fileToProcessCsv2 = {
        filename: '2020-09-09',
        status: 'failed_to_extract_csv',
        date: new Date().toISOString(),
        retries: 2,
      };

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

      store.getAll.mockResolvedValueOnce([fileToProcessCsv1, fileToProcessCsv2]);
      store.getAll.mockResolvedValueOnce([fileToCompress1, fileToCompress2]);
      store.getAll.mockResolvedValueOnce([fileToUpload1, fileToUpload2]);
      compressor.handleCompression.mockImplementation(filename => {
        if (filename === fileToCompress1.filename) {
          throw new Error();
        }
      });

      let err;
      try {
        await controller.processRetries();
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(csv.handleCsvData).toHaveBeenCalledTimes(2);
        expect(csv.handleCsvData).toHaveBeenCalledWith(fileToProcessCsv1.filename);
        expect(csv.handleCsvData).toHaveBeenCalledWith(fileToProcessCsv2.filename);

        expect(compressor.handleCompression).toHaveBeenCalledTimes(4);
        expect(compressor.handleCompression).toHaveBeenCalledWith(fileToProcessCsv1.filename);
        expect(compressor.handleCompression).toHaveBeenCalledWith(fileToProcessCsv2.filename);
        expect(compressor.handleCompression).toHaveBeenCalledWith(fileToCompress1.filename);
        expect(compressor.handleCompression).toHaveBeenCalledWith(fileToCompress2.filename);

        expect(uploader.handleUpload).toHaveBeenCalledTimes(5);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToProcessCsv1.filename);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToProcessCsv2.filename);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToCompress2.filename);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToUpload1.filename);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToUpload2.filename);

        // reset mock
        compressor.handleCompression.mockResolvedValue();
      }
    });

    test('should process, compress and upload two files; compress and upload a file, compress and handle an upload failure for other file; and upload two other files', async () => {
      const fileToProcessCsv1 = {
        filename: '2020-09-08',
        status: 'failed_to_extract_csv',
        date: new Date().toISOString(),
        retries: 1,
      };

      const fileToProcessCsv2 = {
        filename: '2020-09-09',
        status: 'failed_to_extract_csv',
        date: new Date().toISOString(),
        retries: 2,
      };

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

      store.getAll.mockResolvedValueOnce([fileToProcessCsv1, fileToProcessCsv2]);
      store.getAll.mockResolvedValueOnce([fileToCompress1, fileToCompress2]);
      store.getAll.mockResolvedValueOnce([fileToUpload1, fileToUpload2]);
      uploader.handleUpload.mockImplementation(filename => {
        if (filename === fileToCompress1.filename) {
          throw new Error();
        }
      });

      let err;
      try {
        await controller.processRetries();
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(csv.handleCsvData).toHaveBeenCalledTimes(2);
        expect(csv.handleCsvData).toHaveBeenCalledWith(fileToProcessCsv1.filename);
        expect(csv.handleCsvData).toHaveBeenCalledWith(fileToProcessCsv2.filename);

        expect(compressor.handleCompression).toHaveBeenCalledTimes(4);
        expect(compressor.handleCompression).toHaveBeenCalledWith(fileToProcessCsv1.filename);
        expect(compressor.handleCompression).toHaveBeenCalledWith(fileToProcessCsv2.filename);
        expect(compressor.handleCompression).toHaveBeenCalledWith(fileToCompress1.filename);
        expect(compressor.handleCompression).toHaveBeenCalledWith(fileToCompress2.filename);

        expect(uploader.handleUpload).toHaveBeenCalledTimes(6);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToProcessCsv1.filename);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToProcessCsv2.filename);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToCompress1.filename);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToCompress2.filename);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToUpload1.filename);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToUpload2.filename);

        // reset mock
        uploader.handleUpload.mockResolvedValue();
      }
    });

    test('should process, compress and upload two files; compress and upload two files; upload other file, and handle an upload failure for other file', async () => {
      const fileToProcessCsv1 = {
        filename: '2020-09-08',
        status: 'failed_to_extract_csv',
        date: new Date().toISOString(),
        retries: 1,
      };

      const fileToProcessCsv2 = {
        filename: '2020-09-09',
        status: 'failed_to_extract_csv',
        date: new Date().toISOString(),
        retries: 2,
      };

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

      store.getAll.mockResolvedValueOnce([fileToProcessCsv1, fileToProcessCsv2]);
      store.getAll.mockResolvedValueOnce([fileToCompress1, fileToCompress2]);
      store.getAll.mockResolvedValueOnce([fileToUpload1, fileToUpload2]);
      uploader.handleUpload.mockImplementation(filename => {
        if (filename === fileToUpload1.filename) {
          throw new Error();
        }
      });

      let err;
      try {
        await controller.processRetries();
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(csv.handleCsvData).toHaveBeenCalledTimes(2);
        expect(csv.handleCsvData).toHaveBeenCalledWith(fileToProcessCsv1.filename);
        expect(csv.handleCsvData).toHaveBeenCalledWith(fileToProcessCsv2.filename);

        expect(compressor.handleCompression).toHaveBeenCalledTimes(4);
        expect(compressor.handleCompression).toHaveBeenCalledWith(fileToProcessCsv1.filename);
        expect(compressor.handleCompression).toHaveBeenCalledWith(fileToProcessCsv2.filename);
        expect(compressor.handleCompression).toHaveBeenCalledWith(fileToCompress1.filename);
        expect(compressor.handleCompression).toHaveBeenCalledWith(fileToCompress2.filename);

        expect(uploader.handleUpload).toHaveBeenCalledTimes(6);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToProcessCsv1.filename);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToProcessCsv2.filename);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToCompress1.filename);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToCompress2.filename);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToUpload1.filename);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToUpload2.filename);

        // reset mock
        uploader.handleUpload.mockResolvedValue();
      }
    });
  });

  describe('deleteOldFiles', () => {
    const getFilename = (shouldBeRemoved = false, offsetDays = 1) => {
      const today = new Date();
      const offset = shouldBeRemoved ? removalOffset + offsetDays : 0;
      today.setDate(today.getDate() - offset);
      return today.toISOString().split('T')[0];
    };

    test('should delete two files older than the offset', async () => {
      const fileToCompress1 = {
        filename: getFilename(true, 1),
        status: 'sent',
        date: new Date().toISOString(),
        retries: 1,
      };

      const fileToCompress2 = {
        filename: getFilename(true, 2),
        status: 'sent',
        date: new Date().toISOString(),
        retries: 2,
      };

      store.getAll.mockResolvedValueOnce([fileToCompress1, fileToCompress2]);

      let err;
      try {
        await controller.deleteOldFiles();
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(archiver.deleteFile).toHaveBeenCalledWith(path.join(localPath, `${fileToCompress1.filename}.zip`));
        expect(archiver.deleteFile).toHaveBeenCalledWith(path.join(localPath, `${fileToCompress2.filename}.zip`));

        expect(store.deleteOne).toHaveBeenCalledWith({ filename: fileToCompress1.filename, status: fileToCompress1.status });
        expect(store.deleteOne).toHaveBeenCalledWith({ filename: fileToCompress2.filename, status: fileToCompress2.status });
      }
    });

    test('should delete one file older than the offset and skip other file', async () => {
      const fileToCompress1 = {
        filename: getFilename(true, 1),
        status: 'sent',
        date: new Date().toISOString(),
        retries: 1,
      };

      const fileToCompress2 = {
        filename: getFilename(false),
        status: 'sent',
        date: new Date().toISOString(),
        retries: 2,
      };

      store.getAll.mockResolvedValueOnce([fileToCompress1, fileToCompress2]);

      let err;
      try {
        await controller.deleteOldFiles();
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(archiver.deleteFile).toHaveBeenCalledWith(path.join(localPath, `${fileToCompress1.filename}.zip`));

        expect(store.deleteOne).toHaveBeenCalledWith({ filename: fileToCompress1.filename, status: fileToCompress1.status });
      }
    });

    test('should delete one older than the offset and handle an error when deleting the other file', async () => {
      const fileToCompress1 = {
        filename: getFilename(true, 1),
        status: 'sent',
        date: new Date().toISOString(),
        retries: 1,
      };

      const fileToCompress2 = {
        filename: getFilename(true, 2),
        status: 'sent',
        date: new Date().toISOString(),
        retries: 2,
      };

      store.getAll.mockResolvedValueOnce([fileToCompress1, fileToCompress2]);
      archiver.deleteFile.mockRejectedValueOnce(new Error('Error deleting file'));

      let err;
      try {
        await controller.deleteOldFiles();
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(archiver.deleteFile).toHaveBeenCalledWith(path.join(localPath, `${fileToCompress1.filename}.zip`));
        expect(archiver.deleteFile).toHaveBeenCalledWith(path.join(localPath, `${fileToCompress2.filename}.zip`));

        expect(store.deleteOne).toHaveBeenCalledWith({ filename: fileToCompress2.filename, status: fileToCompress2.status });
      }
    });
  });
});
