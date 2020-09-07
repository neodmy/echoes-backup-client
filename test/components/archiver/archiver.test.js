const fs = require('fs');
const path = require('path');
const system = require('../../../system');

describe('Archiver component tests', () => {
  const sys = system();
  let archiver;

  beforeAll(async () => {
    sys.remove('controller');
    sys.remove('store');
    ({ archiver } = await sys.start());
  });

  afterEach(async () => {

  });

  afterAll(() => sys.stop());

  test('should throw an error if file does not exist', async () => {
    try {
      await archiver.compressFile('not_a_file');
    } catch (error) {
      expect(error.message).toBe('File /Users/davidyusta/development/tfg/echoes-backup-client/test/fixtures/echoes/not_a_file does not exists');
    }
  });

  test('should compress a file providing its name', async () => {
    const filename = '2020-09-10';
    const result = await archiver.compressFile('2020-09-10');
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
    fs.unlinkSync(path.join(__dirname, `../../fixtures/echoes/${filename}.zip`));
  });
});
