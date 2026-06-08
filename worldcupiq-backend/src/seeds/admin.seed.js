const bcrypt = require('bcryptjs');
const User = require('../models/User');

const seedAdmin = async () => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn('ADMIN_EMAIL or ADMIN_PASSWORD not set — skipping admin seed');
    return;
  }

  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      await existing.save();
      console.log(`Promoted existing user ${email} to admin`);
    } else {
      console.log(`Admin user ${email} already exists`);
    }
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await User.create({
    email,
    passwordHash,
    displayName: 'Admin',
    role: 'admin',
    country: 'NG',
    referral: { code: 'ADMIN001' },
  });

  console.log(`Admin user created: ${email}`);
};

module.exports = seedAdmin;
