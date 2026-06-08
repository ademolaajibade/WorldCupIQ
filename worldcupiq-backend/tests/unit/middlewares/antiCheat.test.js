const { antiCheat } = require('../../../src/middlewares/antiCheat');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('antiCheat middleware', () => {
  test('passes when timeSpentMs >= 500', () => {
    const req = { body: { timeSpentMs: 1000 } };
    const res = mockRes();
    const next = jest.fn();
    antiCheat(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('passes at exactly 500ms', () => {
    const req = { body: { timeSpentMs: 500 } };
    const res = mockRes();
    const next = jest.fn();
    antiCheat(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('rejects when timeSpentMs < 500', () => {
    const req = { body: { timeSpentMs: 200 } };
    const res = mockRes();
    const next = jest.fn();
    antiCheat(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects when timeSpentMs is 0', () => {
    const req = { body: { timeSpentMs: 0 } };
    const res = mockRes();
    const next = jest.fn();
    antiCheat(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('rejects when timeSpentMs is missing', () => {
    const req = { body: {} };
    const res = mockRes();
    const next = jest.fn();
    antiCheat(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
