const path = require('path');
const system = require('../../../system');

const slackMock = require('../../mocks/slackMock');
const mailerMock = require('../../mocks/mailerMock');

describe('Sftp component tests', () => {
  let sys = system();
  let sftp;

  beforeAll(async () => {
    sys.remove('task');
    sys = sys.set('slack', slackMock());
    sys = sys.set('mailer', mailerMock());
    ({ sftp } = await sys.start());
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  afterAll(() => sys.stop());

  test('should fail when local path does not exists', async () => {
    const filename = 'not_a_file';
    const localPath = path.join(__dirname, '../../fixtures/temp/echoes/');
    const remotePath = '/echoes';
    let err;
    try {
      await sftp.uploadFile({ filename, localPath, remotePath });
    } catch (error) {
      err = error;
    } finally {
      expect(err).toBeDefined();
      expect(err.message).toEqual(expect.stringContaining('No such file'));
    }
  });

  test('should upload a file when the directory does not exist in the FTP server', async () => {
    const filename = '2020-09-10.txt';
    const localPath = path.join(__dirname, '../../fixtures/original/echoes/');
    const remotePath = '/echoes/temp';

    let result;
    let err;
    try {
      result = await sftp.uploadFile({ filename, localPath, remotePath });
    } catch (error) {
      err = error;
    } finally {
      expect(err).toBeUndefined();
      expect(result).toEqual(expect.stringContaining('was successfully uploaded'));

      await sftp.removeDir({ remotePath });
    }
  });

  test('should upload a file when the directory exists in the FTP server', async () => {
    const filename = '2020-09-10.txt';
    const localPath = path.join(__dirname, '../../fixtures/original/echoes/');
    const remotePath = '/echoes/tmp';

    let result;
    let err;
    try {
      result = await sftp.uploadFile({ filename, localPath, remotePath });
      await sftp.removeFile({ filename, remotePath });
      result = await sftp.uploadFile({ filename, localPath, remotePath });
    } catch (error) {
      err = error;
    } finally {
      expect(err).toBeUndefined();
      expect(result).toEqual(expect.stringContaining('was successfully uploaded'));

      await sftp.removeDir({ remotePath });
    }
  });

  test('should fail when the local directory does not exists', async () => {
    const dirName = 'not_a_directory';
    const localPath = path.join(__dirname, '../../fixtures/temp/echoes/');
    const remotePath = '/echoes';
    let err;
    try {
      await sftp.uploadDir({ dirName, localPath, remotePath });
    } catch (error) {
      err = error;
    } finally {
      expect(err).toBeDefined();
      expect(err.message).toEqual(expect.stringContaining('No such directory'));
    }
  });

  test('should upload a directory when the directory does not exists in the FTP server', async () => {
    const dirName = '2020-09-10';
    const localPath = path.join(__dirname, '../../fixtures/original/echoes/');
    const remotePath = '/echoes/tmp';

    let result;
    let err;
    try {
      result = await sftp.uploadDir({ dirName, localPath, remotePath });
    } catch (error) {
      err = error;
    } finally {
      expect(err).toBeUndefined();
      expect(result).toEqual(expect.stringContaining('uploaded to /echoes/tmp/2020-09-10'));

      await sftp.removeDir({ remotePath });
    }
  });

  test('should create a file in the FTP server with no content', async () => {
    const filename = '2020-09-10.txt';
    const remotePath = '/echoes/tmp';

    let result;
    let err;
    try {
      result = await sftp.createFile({ filename, remotePath });
    } catch (error) {
      err = error;
    } finally {
      expect(err).toBeUndefined();
      expect(result).toEqual(expect.stringContaining('Uploaded data stream'));

      await sftp.removeDir({ remotePath });
    }
  });

  test('should create a file in the FTP server with some content', async () => {
    const filename = '2020-09-10.txt';
    const remotePath = '/echoes/tmp';

    let result;
    let err;
    try {
      result = await sftp.createFile({ filename, remotePath, content: 'some content' });
    } catch (error) {
      err = error;
    } finally {
      expect(err).toBeUndefined();
      expect(result).toEqual(expect.stringContaining('Uploaded data stream'));

      await sftp.removeDir({ remotePath });
    }
  });

  test('should throw when appending to remote file if the file does not exist in the FTP server', async () => {
    const filename = 'daily.csv';
    const remotePath = '/echoes/tmp';

    let err;
    try {
      await sftp.appendToFile({ remotePath, filename, content: 'some content\n' });
    } catch (error) {
      err = error;
    } finally {
      expect(err).toBeDefined();
      expect(err.message).toEqual(expect.stringContaining('Bad path'));
    }
  });

  test('should append to remote file if the file exists in the FTP server', async () => {
    const filename = 'daily.csv';
    const remotePath = '/echoes/tmp';
    const localPath = path.join(__dirname, '../../fixtures/original/echoes/');

    let result;
    let err;
    try {
      await sftp.uploadFile({ filename, localPath, remotePath });
      result = await sftp.appendToFile({ remotePath, filename, content: 'some content\n' });
    } catch (error) {
      err = error;
    } finally {
      expect(err).toBeUndefined();
      expect(result).toEqual(expect.stringContaining('Uploaded data stream'));

      await sftp.removeDir({ remotePath });
    }
  });

  test('should return false when the file does not exist in th FTP server', async () => {
    const filename = 'daily.csv';
    const remotePath = '/echoes/tmp';

    let result;
    let err;
    try {
      result = await sftp.checkFileExists({ filename, remotePath });
    } catch (error) {
      err = error;
    } finally {
      expect(err).toBeUndefined();
      expect(result).toEqual(false);
    }
  });

  test('should return true when the file exist in th FTP server', async () => {
    const filename = 'daily.csv';
    const remotePath = '/echoes/tmp';

    let result;
    let err;
    try {
      await sftp.createFile({ filename, remotePath });
      result = await sftp.checkFileExists({ filename, remotePath });
    } catch (error) {
      err = error;
    } finally {
      expect(err).toBeUndefined();
      expect(result).toEqual(true);

      await sftp.removeDir({ remotePath });
    }
  });
});
