const supertest = require('supertest');
const system = require('../system');

const slackMock = require('./mocks/slackMock');

describe('Service Tests', () => {
  let request;
  let sys = system();

  beforeEach(async () => {
    sys = sys.set('slack', slackMock());
    const { app } = await sys.start();
    request = supertest(app);
  });

  afterEach(async () => {
    await sys.stop();
  });

  it('returns manifest', () => request
    .get('/__/manifest')
    .expect(200)
    .then(response => {
      expect(response.headers['content-type']).toEqual('application/json; charset=utf-8');
    }));
});
