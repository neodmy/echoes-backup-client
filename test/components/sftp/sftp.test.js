const fs = require('fs-extra');
const path = require('path');
const system = require('../../../system');

const slackBotMock = require('../../mocks/slackBotMock');

describe('Sftp component tests', () => {
  const sys = system();
  let sftp;

  beforeAll(async () => {
    sys.set('slackBot', slackBotMock());
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

  test('should upload a file when the directory does not exist', async () => {
    const filename = '2020-09-10.txt';
    const localPath = path.join(__dirname, '../../fixtures/temp/echoes/');
    const remotePath = '/echoes/temp';
    const fixtureFilePath = path.join(localPath, filename);

    fs.createFileSync(fixtureFilePath);
    const result = await sftp.uploadFile({ filename, localPath, remotePath });
    expect(result).toEqual(expect.stringContaining('was successfully uploaded'));
    fs.removeSync(fixtureFilePath);
    await sftp.removeDir({ remotePath });
  });

  test('should upload a file when the directory exists', async () => {
    const filename = '2020-09-10.txt';
    const localPath = path.join(__dirname, '../../fixtures/temp/echoes/');
    const remotePath = '/echoes/tmp';
    const fixtureFilePath = path.join(localPath, filename);

    fs.createFileSync(fixtureFilePath);
    let result = await sftp.uploadFile({ filename, localPath, remotePath });
    await sftp.removeFile({ filename, remotePath });
    result = await sftp.uploadFile({ filename, localPath, remotePath });
    expect(result).toEqual(expect.stringContaining('was successfully uploaded'));
    fs.removeSync(fixtureFilePath);
    await sftp.removeDir({ remotePath });
  });
});
