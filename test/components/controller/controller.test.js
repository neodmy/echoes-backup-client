const fs = require('fs-extra');
const path = require('path');
const system = require('../../../system');

const slackBotMock = require('../../mocks/slackBotMock');

describe('Controller component tests', () => {
  const sys = system();
  let controller;
  let store;
  let archiver;
  let slackBot;
  let insertOneSuccessSpy;
  let insertOneFailSpy;
  let compressFileSpy;
  let deleteFileSpy;
  let postMessageSpy;

  beforeAll(async () => {
    sys.set('slackBot', slackBotMock());
    ({
      controller, store, archiver, slackBot,
    } = await sys.start());
    insertOneSuccessSpy = jest.spyOn(store, 'insertOneSuccess');
    insertOneFailSpy = jest.spyOn(store, 'insertOneFail');
    compressFileSpy = jest.spyOn(archiver, 'compressFile');
    deleteFileSpy = jest.spyOn(archiver, 'deleteFile');
    postMessageSpy = jest.spyOn(slackBot, 'postMessage');
  });

  afterEach(async () => {
    await store.deleteAllSuccess();
    await store.deleteAllFail();
    jest.clearAllMocks();
  });

  afterAll(() => sys.stop());

  test('should not complete the task when the file to compress does not exist', async () => {
    const filename = 'not_a_file';
    const expectedSavedDocument = {
      filename,
      status: 'missing',
      retries: 0,
      date: expect.any(Date),
    };

    let err;
    try {
      await controller.handleTask(filename);
    } catch (error) {
      err = error;
    } finally {
      expect(err).toBeDefined();
      expect(err.message).toEqual(expect.stringContaining('not_a_file does not exist'));

      expect(insertOneSuccessSpy).not.toHaveBeenCalled();
      expect(insertOneFailSpy).toHaveBeenCalledWith({ filename, status: 'missing' });
      expect(postMessageSpy).toHaveBeenCalled();

      const [savedFail] = await store.getAllFail();
      expect(savedFail).toMatchObject(expectedSavedDocument);
    }
  });

  test('should complete the task when the file to compress exists', async () => {
    const filename = '2020-09-10';
    const statistics = [
      { '/gnuplot/specs/fakes': 1 },
      { '/gnuplot/specs/overdense': 1 },
      { '/gnuplot/specs': 1 },
      { '/gnuplot/specs/underdense': 1 },
      { '/screenshots/fakes': 1 },
      { '/screenshots/overdense': 1 },
      { '/screenshots/underdense': 1 },
      { '/stats': 1 },
    ];
    const expectedSavedDocument = {
      filename,
      status: 'compressed',
      retries: 0,
      statistics,
      date: expect.any(Date),
    };
    const originalFixture = path.join(__dirname, '../../fixtures/original/echoes/2020-09-10');
    const copiedFixture = path.join(__dirname, `../../fixtures/temp/echoes/${filename}`);
    fs.copySync(originalFixture, copiedFixture);

    let err;
    try {
      await controller.handleTask(filename);
    } catch (error) {
      err = error;
    } finally {
      expect(err).toBeUndefined();

      expect(insertOneFailSpy).not.toHaveBeenCalled();
      expect(insertOneSuccessSpy).toHaveBeenCalledWith({ filename, status: 'compressed', statistics });
      expect(compressFileSpy).toHaveBeenCalledWith(copiedFixture);
      expect(deleteFileSpy).toHaveBeenCalledWith(copiedFixture);
      expect(postMessageSpy).not.toHaveBeenCalled();

      const [savedSuccess] = await store.getAllSuccess();
      expect(savedSuccess).toMatchObject(expectedSavedDocument);

      fs.removeSync(`${copiedFixture}.zip`);
    }
  });
});
