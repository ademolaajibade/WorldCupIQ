const { todayUTC, yesterdayUTC, tomorrowUTC, midnightUTCTTL, paginateQuery, sampleArray } = require('../../../src/utils/helpers');

describe('helpers', () => {
  test('todayUTC returns YYYY-MM-DD format', () => {
    expect(todayUTC()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('yesterdayUTC is one day before todayUTC', () => {
    const today = new Date(todayUTC());
    const yesterday = new Date(yesterdayUTC());
    const diff = today - yesterday;
    expect(diff).toBe(24 * 60 * 60 * 1000);
  });

  test('tomorrowUTC is one day after todayUTC', () => {
    const today = new Date(todayUTC());
    const tomorrow = new Date(tomorrowUTC());
    const diff = tomorrow - today;
    expect(diff).toBe(24 * 60 * 60 * 1000);
  });

  test('midnightUTCTTL returns positive number less than 86401', () => {
    const ttl = midnightUTCTTL();
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(86400);
  });

  test('paginateQuery returns correct skip/limit', () => {
    const result = paginateQuery(3, 10);
    expect(result.skip).toBe(20);
    expect(result.limit).toBe(10);
    expect(result.page).toBe(3);
  });

  test('paginateQuery defaults to page 1 limit 20', () => {
    const result = paginateQuery();
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.skip).toBe(0);
  });

  test('sampleArray returns correct count', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(sampleArray(arr, 3)).toHaveLength(3);
  });

  test('sampleArray returns no duplicates', () => {
    const arr = [1, 2, 3, 4, 5];
    const result = sampleArray(arr, 5);
    expect(new Set(result).size).toBe(5);
  });
});
