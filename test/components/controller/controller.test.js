const path = require('path');

const system = require('../../../system');

const slackMock = require('../../mocks/slackMock');
const sftpMock = require('../../mocks/sftpMock');
const archiverMock = require('../../mocks/archiverMock');
const storeMock = require('../../mocks/storeMock');
const uploaderMock = require('../../mocks/uploaderMock');
const csvMock = require('../../mocks/csvMock');
const mailerMock = require('../../mocks/mailerMock');

const {
  controller: { removalOffset, localPath },
} = require('../../../config/test');

describe('Controller component tests', () => {
  const sys = system();
  let controller;
  let uploader;
  let csv;
  let archiver;
  let store;

  beforeAll(async () => {
    sys.remove('task');
    sys.set('slack', slackMock());
    sys.set('sftp', sftpMock());
    sys.set('archiver', archiverMock());
    sys.set('store', storeMock());
    sys.set('uploader', uploaderMock());
    sys.set('csv', csvMock());
    sys.set('mailer', mailerMock());
    ({
      controller, archiver, uploader, csv, store,
    } = await sys.start());
  });

  afterEach(() => jest.clearAllMocks());

  afterAll(() => sys.stop());

  describe('init', () => {
    test('should handle two files to extract CSV data and upload', async () => {
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

        expect(csv.handleCsvData).toHaveBeenCalledTimes(2);
        expect(csv.handleCsvData).toHaveBeenCalledWith(filename1);
        expect(csv.handleCsvData).toHaveBeenCalledWith(filename2);

        expect(uploader.handleUpload).toHaveBeenCalledTimes(2);
        expect(uploader.handleUpload).toHaveBeenCalledWith(filename1);
        expect(uploader.handleUpload).toHaveBeenCalledWith(filename2);
      }
    });

    test('should handle two files to extract CSV data and upload, and omit other with no YYYY-mm-dd pattern on its name', async () => {
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

        expect(csv.handleCsvData).toHaveBeenCalledTimes(2);
        expect(csv.handleCsvData).toHaveBeenCalledWith(filename1);
        expect(csv.handleCsvData).toHaveBeenCalledWith(filename2);

        expect(uploader.handleUpload).toHaveBeenCalledTimes(2);
        expect(uploader.handleUpload).toHaveBeenCalledWith(filename1);
        expect(uploader.handleUpload).toHaveBeenCalledWith(filename2);
      }
    });

    test('should handle an error extracting CSV data for the first file, and compress and upload the second file', async () => {
      const filename1 = '2020-10-09';
      const filename2 = '2020-10-10';

      archiver.getDirectoryContent.mockResolvedValueOnce([filename1, filename2]);
      csv.handleCsvData.mockRejectedValueOnce(new Error());

      let err;
      try {
        await controller.init();
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(csv.handleCsvData).toHaveBeenCalledTimes(2);
        expect(csv.handleCsvData).toHaveBeenCalledWith(filename1);
        expect(csv.handleCsvData).toHaveBeenCalledWith(filename2);

        expect(uploader.handleUpload).toHaveBeenCalledTimes(1);
        expect(uploader.handleUpload).toHaveBeenCalledWith(filename2);
      }
    });

    test('should handle an upload failure for the first file, and extract CSV data and upload the second file', async () => {
      const filename1 = '2020-10-09';
      const filename2 = '2020-10-10';

      archiver.getDirectoryContent.mockResolvedValueOnce([filename1, filename2]);
      uploader.handleUpload.mockRejectedValueOnce(new Error());

      let err;
      try {
        await controller.init();
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(csv.handleCsvData).toHaveBeenCalledTimes(2);
        expect(csv.handleCsvData).toHaveBeenCalledWith(filename1);
        expect(csv.handleCsvData).toHaveBeenCalledWith(filename2);

        expect(uploader.handleUpload).toHaveBeenCalledTimes(2);
        expect(uploader.handleUpload).toHaveBeenCalledWith(filename1);
        expect(uploader.handleUpload).toHaveBeenCalledWith(filename2);
      }
    });
  });

  describe('processFileToExtractCsvData', () => {
    test('should extract CSV data and upload a file', async () => {
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

        expect(uploader.handleUpload).toHaveBeenCalledTimes(1);
        expect(uploader.handleUpload).toHaveBeenCalledWith(filename);
      }
    });

    test('should handle an error extracting CSV data and not to try to upload the file', async () => {
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

        expect(uploader.handleUpload).not.toHaveBeenCalled();
      }
    });

    test('should extract CSV data and handle an upload failure', async () => {
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

        expect(uploader.handleUpload).toHaveBeenCalledTimes(1);
        expect(uploader.handleUpload).toHaveBeenCalledWith(filename);
      }
    });
  });

  describe('processRetries', () => {
    test('should extract CSV data and upload two files, and upload two other files', async () => {
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

        expect(uploader.handleUpload).toHaveBeenCalledTimes(4);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToProcessCsv1.filename);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToProcessCsv1.filename);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToUpload1.filename);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToUpload2.filename);
      }
    });

    test('should handle an error extracting CSV data, extract CSV data and upload other file, and upload two other files', async () => {
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

        expect(uploader.handleUpload).toHaveBeenCalledTimes(3);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToProcessCsv2.filename);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToUpload1.filename);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToUpload2.filename);
      }
    });

    test('should extract CSV data and handle an upload failure, extract CSV data and upload other file, and upload two other files', async () => {
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

        expect(uploader.handleUpload).toHaveBeenCalledTimes(4);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToProcessCsv1.filename);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToProcessCsv2.filename);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToUpload1.filename);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToUpload2.filename);

        // reset mock
        uploader.handleUpload.mockResolvedValue();
      }
    });

    test('should extract CSV data and upload two files, handle an upload failure for other file, and upload other file', async () => {
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

        expect(uploader.handleUpload).toHaveBeenCalledTimes(4);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToProcessCsv1.filename);
        expect(uploader.handleUpload).toHaveBeenCalledWith(fileToProcessCsv2.filename);
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
      const fileSent1 = {
        filename: getFilename(true, 1),
        status: 'sent',
        date: new Date().toISOString(),
        retries: 1,
      };

      const fileSent2 = {
        filename: getFilename(true, 2),
        status: 'sent',
        date: new Date().toISOString(),
        retries: 2,
      };

      store.getAll.mockResolvedValueOnce([fileSent1, fileSent2]);

      let err;
      try {
        await controller.deleteOldFiles();
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(archiver.deleteFile).toHaveBeenCalledWith(path.join(localPath, fileSent1.filename));
        expect(archiver.deleteFile).toHaveBeenCalledWith(path.join(localPath, fileSent2.filename));

        expect(store.deleteOne).toHaveBeenCalledWith({ filename: fileSent1.filename, status: fileSent1.status });
        expect(store.deleteOne).toHaveBeenCalledWith({ filename: fileSent2.filename, status: fileSent2.status });
        expect(store.deleteOne).toHaveBeenCalledWith({ filename: fileSent1.filename, status: 'csv_processed' });
        expect(store.deleteOne).toHaveBeenCalledWith({ filename: fileSent2.filename, status: 'csv_processed' });
      }
    });

    test('should delete one file older than the offset and skip other file', async () => {
      const fileSent1 = {
        filename: getFilename(true, 1),
        status: 'sent',
        date: new Date().toISOString(),
        retries: 1,
      };

      const fileSent2 = {
        filename: getFilename(false),
        status: 'sent',
        date: new Date().toISOString(),
        retries: 2,
      };

      store.getAll.mockResolvedValueOnce([fileSent1, fileSent2]);

      let err;
      try {
        await controller.deleteOldFiles();
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(archiver.deleteFile).toHaveBeenCalledWith(path.join(localPath, fileSent1.filename));

        expect(store.deleteOne).toHaveBeenCalledWith({ filename: fileSent1.filename, status: fileSent1.status });
        expect(store.deleteOne).toHaveBeenCalledWith({ filename: fileSent1.filename, status: 'csv_processed' });
      }
    });

    test('should delete one file older than the offset and handle an error when deleting the other file', async () => {
      const fileSent1 = {
        filename: getFilename(true, 1),
        status: 'sent',
        date: new Date().toISOString(),
        retries: 1,
      };

      const fileSent2 = {
        filename: getFilename(true, 2),
        status: 'sent',
        date: new Date().toISOString(),
        retries: 2,
      };

      store.getAll.mockResolvedValueOnce([fileSent1, fileSent2]);
      archiver.deleteFile.mockRejectedValueOnce(new Error('Error deleting file'));

      let err;
      try {
        await controller.deleteOldFiles();
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(archiver.deleteFile).toHaveBeenCalledWith(path.join(localPath, fileSent1.filename));
        expect(archiver.deleteFile).toHaveBeenCalledWith(path.join(localPath, fileSent2.filename));

        expect(store.deleteOne).toHaveBeenCalledWith({ filename: fileSent2.filename, status: fileSent2.status });
        expect(store.deleteOne).toHaveBeenCalledWith({ filename: fileSent2.filename, status: 'csv_processed' });
      }
    });
  });
});
