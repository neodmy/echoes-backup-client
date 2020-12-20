const path = require('path');
const fs = require('fs-extra');
const system = require('../../../system');

const slackMock = require('../../mocks/slackMock');
const sftpMock = require('../../mocks/sftpMock');
const storeMock = require('../../mocks/storeMock');
const archiverMock = require('../../mocks/archiverMock');
const mailerMock = require('../../mocks/mailerMock');

const {
  controller: { remotePath, clientId },
} = require('../../../config/test');

describe('Csv component tests', () => {
  const sys = system();
  let store;
  let archiver;
  let slack;
  let sftp;
  let csv;
  let mailer;
  let postMessageSpy;
  let mailerSpy;

  beforeAll(async () => {
    sys.remove('task');
    sys.set('slack', slackMock());
    sys.set('sftp', sftpMock());
    sys.set('store', storeMock());
    sys.set('archiver', archiverMock());
    sys.set('mailer', mailerMock());
    ({
      csv, slack, sftp, archiver, store, mailer,
    } = await sys.start());

    postMessageSpy = jest.spyOn(slack, 'postMessage');
    mailerSpy = jest.spyOn(mailer, 'sendMail');
  });

  afterEach(() => jest.clearAllMocks());

  afterAll(() => sys.stop());

  describe('handleCsvData', () => {
    test('should fail when the CSV file has not been generated yet on the first try', async () => {
      const filename = '2020-09-15';
      const failStatus = 'failed_to_extract_csv';

      store.getOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      archiver.getDirectoryContent.mockResolvedValueOnce(['something.txt']);

      let err;
      try {
        await csv.handleCsvData(filename);
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeDefined();
        expect(err.message).toEqual(expect.stringContaining('File does not exist. Check to make sure the file path to your csv is correct.'));

        expect(sftp.checkFileExists).not.toHaveBeenCalled();
        expect(sftp.appendToFile).not.toHaveBeenCalled();
        expect(sftp.createFile).not.toHaveBeenCalled();
        expect(store.deleteOne).not.toHaveBeenCalled();

        expect(store.upsertOne).toHaveBeenCalledWith({ filename, status: failStatus, retries: 1 });
        expect(postMessageSpy).toHaveBeenCalled();
        expect(mailerSpy).toHaveBeenCalled();
      }
    });

    test('should fail when there is no CSV data for a given filename on the first try', async () => {
      const filename = '2020-09-15';
      const failStatus = 'failed_to_extract_csv';

      const dailyCsv = 'daily.csv';
      const originalFixture = path.join(__dirname, `../../fixtures/original/echoes/${dailyCsv}`);
      const copiedFixture = path.join(__dirname, `../../fixtures/temp/echoes/${dailyCsv}`);
      fs.copySync(originalFixture, copiedFixture);

      store.getOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      archiver.getDirectoryContent.mockResolvedValueOnce(['daily.csv', 'something.txt']);

      let err;
      try {
        await csv.handleCsvData(filename);
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeDefined();
        expect(err.message).toMatch('Line for filename does not exist in CSV daily report');

        expect(sftp.checkFileExists).not.toHaveBeenCalled();
        expect(sftp.appendToFile).not.toHaveBeenCalled();
        expect(sftp.createFile).not.toHaveBeenCalled();
        expect(store.deleteOne).not.toHaveBeenCalled();

        expect(store.upsertOne).toHaveBeenCalledWith({ filename, status: failStatus, retries: 1 });
        expect(postMessageSpy).toHaveBeenCalled();
        expect(mailerSpy).toHaveBeenCalled();

        fs.removeSync(copiedFixture);
      }
    });

    test('should extract CSV data for a given filename and append to the remote file on the first try', async () => {
      const filename = '2020-09-09';
      const dailyCsv = 'daily.csv';
      const originalFixture = path.join(__dirname, `../../fixtures/original/echoes/${dailyCsv}`);
      const copiedFixture = path.join(__dirname, `../../fixtures/temp/echoes/${dailyCsv}`);
      fs.copySync(originalFixture, copiedFixture);

      const expectedContent = 'mié. sept. 9 2020;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-110,58;-126,36;9;5;3;1;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-110,58;-126,36;9;5;3;1;|\n';

      store.getOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      archiver.getDirectoryContent.mockResolvedValueOnce(['daily.csv', 'something.txt']);
      sftp.checkFileExists.mockResolvedValueOnce(true);

      let err;
      try {
        await csv.handleCsvData(filename);
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(sftp.appendToFile).toHaveBeenCalledWith({ filename: 'daily.csv', remotePath: path.join(remotePath, clientId, 'echoes_backup'), content: expectedContent });
        expect(sftp.createFile).not.toHaveBeenCalled();
        expect(store.deleteOne).not.toHaveBeenCalled();

        expect(postMessageSpy).not.toHaveBeenCalled();
        expect(mailerSpy).not.toHaveBeenCalled();
        expect(store.upsertOne).toHaveBeenCalledWith({ filename, status: 'csv_processed' });

        fs.removeSync(copiedFixture);
      }
    });

    test('should extract CSV data for a given filename and create the remote file on the first try', async () => {
      const filename = '2020-09-09';
      const dailyCsv = 'daily.csv';
      const originalFixture = path.join(__dirname, `../../fixtures/original/echoes/${dailyCsv}`);
      const copiedFixture = path.join(__dirname, `../../fixtures/temp/echoes/${dailyCsv}`);
      fs.copySync(originalFixture, copiedFixture);

      const expectHeader = 'Echoes Daily Report;\n';
      const expectedColumns = 'Date:;00h;;;;;;|;01h;;;;;;|;02h;;;;;;|;03h;;;;;;|;04h;;;;;;|;05h;;;;;;|;06h;;;;;;|;07h;;;;;;|;08h;;;;;;|;09h;;;;;;|;10h;;;;;;|;11h;;;;;;|;12h;;;;;;|;13h;;;;;;|;14h;;;;;;|;15h;;;;;;|;16h;;;;;;|;17h;;;;;;|;18h;;;;;;|;19h;;;;;;|;20h;;;;;;|;21h;;;;;;|;22h;;;;;;|;23h;;;;;;|;Daily totals;;;;;;|\n';
      const expectedFilenameRow = 'mié. sept. 9 2020;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-110,58;-126,36;9;5;3;1;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-110,58;-126,36;9;5;3;1;|\n';
      const expectedContent = `${expectHeader}${expectedColumns}${expectedFilenameRow}`;

      store.getOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      archiver.getDirectoryContent.mockResolvedValueOnce(['daily.csv', 'something.txt']);
      sftp.checkFileExists.mockResolvedValueOnce(false);

      let err;
      try {
        await csv.handleCsvData(filename);
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(sftp.appendToFile).not.toHaveBeenCalled();
        expect(sftp.createFile).toHaveBeenCalledWith({ filename: 'daily.csv', remotePath: path.join(remotePath, clientId, 'echoes_backup'), content: expectedContent });
        expect(store.deleteOne).not.toHaveBeenCalled();

        expect(postMessageSpy).not.toHaveBeenCalled();
        expect(mailerSpy).not.toHaveBeenCalled();
        expect(store.upsertOne).toHaveBeenCalledWith({ filename, status: 'csv_processed' });

        fs.removeSync(copiedFixture);
      }
    });

    test('should fail when the CSV file has not been generated yet on the second try', async () => {
      const filename = '2020-09-15';
      const failStatus = 'failed_to_extract_csv';

      store.getOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          _id: expect.any(String),
          filename,
          status: failStatus,
          retries: 1,
          date: expect.any(Date),
        });
      archiver.getDirectoryContent.mockResolvedValueOnce(['something.txt']);

      let err;
      try {
        await csv.handleCsvData(filename);
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeDefined();
        expect(err.message).toEqual(expect.stringContaining('File does not exist. Check to make sure the file path to your csv is correct.'));

        expect(sftp.checkFileExists).not.toHaveBeenCalled();
        expect(sftp.appendToFile).not.toHaveBeenCalled();
        expect(sftp.createFile).not.toHaveBeenCalled();

        expect(store.upsertOne).toHaveBeenCalledWith({ filename, status: failStatus, retries: 2 });
        expect(postMessageSpy).toHaveBeenCalled();
        expect(mailerSpy).toHaveBeenCalled();
      }
    });

    test('should fail when there is no CSV data for a given filename on the second try', async () => {
      const filename = '2020-09-15';
      const failStatus = 'failed_to_extract_csv';

      const dailyCsv = 'daily.csv';
      const originalFixture = path.join(__dirname, `../../fixtures/original/echoes/${dailyCsv}`);
      const copiedFixture = path.join(__dirname, `../../fixtures/temp/echoes/${dailyCsv}`);
      fs.copySync(originalFixture, copiedFixture);

      store.getOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          _id: expect.any(String),
          filename,
          status: failStatus,
          retries: 1,
          date: expect.any(Date),
        });
      archiver.getDirectoryContent.mockResolvedValueOnce(['daily.csv', 'something.txt']);

      let err;
      try {
        await csv.handleCsvData(filename);
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeDefined();
        expect(err.message).toMatch('Line for filename does not exist in CSV daily report');

        expect(sftp.checkFileExists).not.toHaveBeenCalled();
        expect(sftp.appendToFile).not.toHaveBeenCalled();
        expect(sftp.createFile).not.toHaveBeenCalled();

        expect(store.upsertOne).toHaveBeenCalledWith({ filename, status: failStatus, retries: 2 });
        expect(postMessageSpy).toHaveBeenCalled();
        expect(mailerSpy).toHaveBeenCalled();

        fs.removeSync(copiedFixture);
      }
    });

    test('should extract CSV data for a given filename and append to the remote file on the second try', async () => {
      const filename = '2020-09-09';
      const failStatus = 'failed_to_extract_csv';

      const dailyCsv = 'daily.csv';
      const originalFixture = path.join(__dirname, `../../fixtures/original/echoes/${dailyCsv}`);
      const copiedFixture = path.join(__dirname, `../../fixtures/temp/echoes/${dailyCsv}`);
      fs.copySync(originalFixture, copiedFixture);

      const expectedContent = 'mié. sept. 9 2020;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-110,58;-126,36;9;5;3;1;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-110,58;-126,36;9;5;3;1;|\n';

      store.getOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          _id: expect.any(String),
          filename,
          status: failStatus,
          retries: 1,
          date: expect.any(Date),
        });
      archiver.getDirectoryContent.mockResolvedValueOnce(['daily.csv', 'something.txt']);
      sftp.checkFileExists.mockResolvedValueOnce(true);

      let err;
      try {
        await csv.handleCsvData(filename);
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(sftp.appendToFile).toHaveBeenCalledWith({ filename: 'daily.csv', remotePath: path.join(remotePath, clientId, 'echoes_backup'), content: expectedContent });
        expect(sftp.createFile).not.toHaveBeenCalled();
        expect(store.deleteOne).toHaveBeenCalledWith({ filename, status: failStatus });

        expect(postMessageSpy).not.toHaveBeenCalled();
        expect(mailerSpy).not.toHaveBeenCalled();
        expect(store.upsertOne).toHaveBeenCalledWith({ filename, status: 'csv_processed' });

        fs.removeSync(copiedFixture);
      }
    });

    test('should extract CSV data for a given filename and create the remote file on the second try', async () => {
      const filename = '2020-09-09';
      const failStatus = 'failed_to_extract_csv';

      const dailyCsv = 'daily.csv';
      const originalFixture = path.join(__dirname, `../../fixtures/original/echoes/${dailyCsv}`);
      const copiedFixture = path.join(__dirname, `../../fixtures/temp/echoes/${dailyCsv}`);
      fs.copySync(originalFixture, copiedFixture);

      const expectHeader = 'Echoes Daily Report;\n';
      const expectedColumns = 'Date:;00h;;;;;;|;01h;;;;;;|;02h;;;;;;|;03h;;;;;;|;04h;;;;;;|;05h;;;;;;|;06h;;;;;;|;07h;;;;;;|;08h;;;;;;|;09h;;;;;;|;10h;;;;;;|;11h;;;;;;|;12h;;;;;;|;13h;;;;;;|;14h;;;;;;|;15h;;;;;;|;16h;;;;;;|;17h;;;;;;|;18h;;;;;;|;19h;;;;;;|;20h;;;;;;|;21h;;;;;;|;22h;;;;;;|;23h;;;;;;|;Daily totals;;;;;;|\n';
      const expectedFilenameRow = 'mié. sept. 9 2020;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-110,58;-126,36;9;5;3;1;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-;-;0;0;0;0;|;-110,58;-126,36;9;5;3;1;|\n';
      const expectedContent = `${expectHeader}${expectedColumns}${expectedFilenameRow}`;

      store.getOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          _id: expect.any(String),
          filename,
          status: failStatus,
          retries: 1,
          date: expect.any(Date),
        });
      archiver.getDirectoryContent.mockResolvedValueOnce(['daily.csv', 'something.txt']);
      sftp.checkFileExists.mockResolvedValueOnce(false);

      let err;
      try {
        await csv.handleCsvData(filename);
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(sftp.appendToFile).not.toHaveBeenCalled();
        expect(sftp.createFile).toHaveBeenCalledWith({ filename: 'daily.csv', remotePath: path.join(remotePath, clientId, 'echoes_backup'), content: expectedContent });
        expect(store.deleteOne).toHaveBeenCalledWith({ filename, status: failStatus });

        expect(postMessageSpy).not.toHaveBeenCalled();
        expect(mailerSpy).not.toHaveBeenCalled();
        expect(store.upsertOne).toHaveBeenCalledWith({ filename, status: 'csv_processed' });

        fs.removeSync(copiedFixture);
      }
    });

    test('should skip the CSV process when the CSV data for a given file has already been done', async () => {
      const filename = '2020-09-09';
      const successStatus = 'csv_processed';

      const dailyCsv = 'daily.csv';
      const originalFixture = path.join(__dirname, `../../fixtures/original/echoes/${dailyCsv}`);
      const copiedFixture = path.join(__dirname, `../../fixtures/temp/echoes/${dailyCsv}`);
      fs.copySync(originalFixture, copiedFixture);

      store.getOne
        .mockResolvedValueOnce({
          _id: expect.any(String),
          filename,
          status: successStatus,
          date: expect.any(Date),
        });

      let err;
      try {
        await csv.handleCsvData(filename);
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(sftp.appendToFile).not.toHaveBeenCalled();
        expect(sftp.createFile).not.toHaveBeenCalled();
        expect(store.deleteOne).not.toHaveBeenCalled();

        expect(postMessageSpy).not.toHaveBeenCalled();
        expect(mailerSpy).not.toHaveBeenCalled();
        expect(store.upsertOne).not.toHaveBeenCalled();

        fs.removeSync(copiedFixture);
      }
    });
  });
});
