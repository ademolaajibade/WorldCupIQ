const bcrypt = require('bcryptjs');

const createUserFixture = async (overrides = {}) => {
  const User = require('../../src/models/User');
  const defaults = {
    email: 'test@worldcupiq.com',
    passwordHash: await bcrypt.hash('Test@1234', 12),
    displayName: 'Test User',
    country: 'US',
    referral: { code: 'TESTCODE' },
  };
  return User.create({ ...defaults, ...overrides });
};

const createAdminFixture = async () =>
  createUserFixture({ email: 'admin@worldcupiq.com', role: 'admin', country: 'NG' });

module.exports = { createUserFixture, createAdminFixture };
