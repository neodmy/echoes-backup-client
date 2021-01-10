const fs = require('fs-extra');
const path = require('path');
const system = require('../../../system');

const slackMock = require('../../mocks/slackMock');

describe('Archiver component tests', () => {
  let sys = system();
  let archiver;

  beforeAll(async () => {
    sys = sys.set('slack', slackMock());
    ({ archiver } = await sys.start());
  });

  afterEach(async () => {

  });

  afterAll(() => sys.stop());

  describe('compressFile', () => {
    test('should throw an error if the file does not exist', async () => {
      const fileName = 'not_a_file';
      const localDir = path.join(__dirname, '..', '..', 'fixtures', 'temp', 'echoes', fileName);
      try {
        await archiver.compressFile(localDir);
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.message).toEqual(expect.stringContaining(`${fileName} does not exist`));
      }
    });

    test('should compress a file providing its name', async () => {
      const filename = '2020-09-10';
      const originalFixture = path.join(__dirname, `../../fixtures/original/echoes/${filename}`);
      const copiedFixture = path.join(__dirname, `../../fixtures/temp/echoes/${filename}`);
      fs.copySync(originalFixture, copiedFixture);

      const result = await archiver.compressFile(copiedFixture);
      const expectResult = [
        { '/gnuplot/specs/fakes': 1 },
        { '/gnuplot/specs/overdense': 1 },
        { '/gnuplot/specs': 1 },
        { '/gnuplot/specs/underdense': 1 },
        { '/screenshots/fakes': 1 },
        { '/screenshots/overdense': 1 },
        { '/screenshots/underdense': 1 },
        { '/stats': 1 },
      ];
      expect(result).toEqual(expectResult);
      fs.removeSync(`${copiedFixture}.zip`);
      fs.removeSync(copiedFixture);
    });
  });

  describe('deleteFile', () => {
    test('should do nothing if a file (directory) does not exists', async () => {
      const fileName = 'not_a_file';
      const tempFilePath = path.join(__dirname, `../../fixtures/temp/echoes/${fileName}`);

      let err;
      try {
        const createdFileExists = fs.existsSync(tempFilePath);
        expect(createdFileExists).toBe(false);
        await archiver.deleteFile(fileName);
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();
      }
    });

    test('should remove a file (directory)', async () => {
      const filename = '2020-09-10';
      const originalFixture = path.join(__dirname, `../../fixtures/original/echoes/${filename}`);
      const copiedFixture = path.join(__dirname, `../../fixtures/temp/echoes/${filename}`);
      fs.copySync(originalFixture, copiedFixture);

      let createdFileExists = fs.existsSync(copiedFixture);
      expect(createdFileExists).toBe(true);

      let err;
      try {
        await archiver.deleteFile(copiedFixture);
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        createdFileExists = fs.existsSync(copiedFixture);
        expect(createdFileExists).toBe(false);
      }
    });

    test('should remove a file (zip)', async () => {
      const filename = '2020-09-10.zip';
      const tempFilePath = path.join(__dirname, `../../fixtures/temp/echoes/${filename}`);

      fs.createFileSync(tempFilePath);
      let createdFileExists = fs.existsSync(tempFilePath);
      expect(createdFileExists).toBe(true);

      let err;
      try {
        await archiver.deleteFile(tempFilePath);
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        createdFileExists = fs.existsSync(tempFilePath);
        expect(createdFileExists).toBe(false);
      }
    });
  });

  describe('getDirectoryContent', () => {
    test('should throw if the directory does not exist', async () => {
      const dirPath = '/not/a/valid/path';
      let err;
      try {
        await archiver.getDirectoryContent(dirPath);
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeDefined();
        expect(err.message).toStrictEqual(expect.stringMatching('ENOENT: no such file or directory'));
      }
    });

    test('should list the content of a directory', async () => {
      const filename = '2020-09-10';
      const fixtureDir = path.join(__dirname, '../../fixtures/temp/echoes/');

      const originalFixture = path.join(__dirname, `../../fixtures/original/echoes/${filename}`);
      const copiedFixture = path.join(fixtureDir, `${filename}`);
      fs.createFileSync(path.join(fixtureDir, `${filename}.zip`));
      fs.copySync(originalFixture, copiedFixture);

      const expectedResult = ['2020-09-10', '2020-09-10.zip'];
      let err;
      let result;
      try {
        result = await archiver.getDirectoryContent(fixtureDir);
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(result).toEqual(expectedResult);
        fs.remove(path.join(__dirname, '../../fixtures/temp/echoes/'));
      }
    });
  });
});
