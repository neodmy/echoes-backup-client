const fs = require('fs-extra');
const path = require('path');
const system = require('../../../system');

const slackBotMock = require('../../mocks/slackBotMock');

describe('Archiver component tests', () => {
  const sys = system();
  let archiver;

  beforeAll(async () => {
    sys.set('slackBot', slackBotMock());
    ({ archiver } = await sys.start());
  });

  afterEach(async () => {

  });

  afterAll(() => sys.stop());

  describe('compressfile', () => {
    test('should throw an error if the file does not exist', async () => {
      const fileName = 'not_a_file';
      try {
        await archiver.compressFile(fileName);
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

      const result = await archiver.compressFile(filename);
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

      const createdFileExists = fs.existsSync(tempFilePath);
      expect(createdFileExists).toBe(false);
      archiver.deleteFile(fileName);
    });

    test('should remove a file (directory)', async () => {
      const filename = '2020-09-10';
      const originalFixture = path.join(__dirname, `../../fixtures/original/echoes/${filename}`);
      const copiedFixture = path.join(__dirname, `../../fixtures/temp/echoes/${filename}`);
      fs.copySync(originalFixture, copiedFixture);

      let createdFileExists = fs.existsSync(copiedFixture);
      expect(createdFileExists).toBe(true);

      archiver.deleteFile(filename);

      createdFileExists = fs.existsSync(copiedFixture);
      expect(createdFileExists).toBe(false);
    });

    test('should remove a file (zip)', async () => {
      const filename = '2020-09-10.zip';
      const tempFilePath = path.join(__dirname, `../../fixtures/temp/echoes/${filename}`);

      fs.createFileSync(tempFilePath);
      let createdFileExists = fs.existsSync(tempFilePath);
      expect(createdFileExists).toBe(true);

      archiver.deleteFile(filename);

      createdFileExists = fs.existsSync(tempFilePath);
      expect(createdFileExists).toBe(false);
    });
  });
});
