const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../services/email');
const { generateReferralCode } = require('../utils/helpers');
const {
  registerSchema,
  loginSchema,
  googleAuthSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('../utils/validators');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateTokens = (userId, role) => {
  const accessToken = jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
  return { accessToken, refreshToken };
};

const setRefreshCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const isMobile = (req) => req.headers['x-platform'] === 'mobile';

// POST /api/v1/auth/register
const register = async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);

    const exists = await User.findOne({ email: data.email });
    if (exists) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const referralCode = generateReferralCode();

    const user = await User.create({
      email: data.email,
      passwordHash,
      displayName: data.displayName,
      username: data.username,
      country: data.country,
      referral: { code: referralCode },
    });

    const { accessToken, refreshToken } = generateTokens(user._id, user.role);

    sendWelcomeEmail(user.email, user.displayName).catch(() => {});

    const responseData = {
      success: true,
      accessToken,
      user: {
        _id: user._id,
        email: user.email,
        displayName: user.displayName,
        username: user.username,
        avatarUrl: user.avatarUrl,
        country: user.country,
        role: user.role,
        subscription: user.subscription,
        stats: user.stats,
      },
    };

    if (isMobile(req)) {
      responseData.refreshToken = refreshToken;
    } else {
      setRefreshCookie(res, refreshToken);
    }

    res.status(201).json(responseData);
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/auth/login
const login = async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await User.findOne({ email: data.email }).select('+passwordHash');
    if (!user || !user.passwordHash) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.isBanned) {
      return res.status(403).json({ success: false, message: 'Account suspended' });
    }

    user.lastActiveAt = new Date();
    await user.save();

    const { accessToken, refreshToken } = generateTokens(user._id, user.role);

    const responseData = {
      success: true,
      accessToken,
      user: {
        _id: user._id,
        email: user.email,
        displayName: user.displayName,
        username: user.username,
        avatarUrl: user.avatarUrl,
        country: user.country,
        role: user.role,
        subscription: user.subscription,
        stats: user.stats,
      },
    };

    if (isMobile(req)) {
      responseData.refreshToken = refreshToken;
    } else {
      setRefreshCookie(res, refreshToken);
    }

    res.json(responseData);
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/auth/google
const googleLogin = async (req, res, next) => {
  try {
    const { idToken, country } = googleAuthSchema.parse(req.body);

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (!user) {
      const referralCode = generateReferralCode();
      user = await User.create({
        email,
        displayName: name,
        avatarUrl: picture,
        googleId,
        country: country || 'US',
        authProvider: 'google',
        referral: { code: referralCode },
      });
      sendWelcomeEmail(user.email, user.displayName).catch(() => {});
    } else if (!user.googleId) {
      user.googleId = googleId;
      if (!user.avatarUrl) user.avatarUrl = picture;
      await user.save();
    }

    if (user.isBanned) {
      return res.status(403).json({ success: false, message: 'Account suspended' });
    }

    const { accessToken, refreshToken } = generateTokens(user._id, user.role);

    const responseData = {
      success: true,
      accessToken,
      user: {
        _id: user._id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        country: user.country,
        role: user.role,
        subscription: user.subscription,
        stats: user.stats,
      },
    };

    if (isMobile(req)) {
      responseData.refreshToken = refreshToken;
    } else {
      setRefreshCookie(res, refreshToken);
    }

    res.json(responseData);
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/auth/refresh
const refreshToken = async (req, res, next) => {
  try {
    const token = isMobile(req)
      ? req.body.refreshToken
      : req.cookies?.refreshToken;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Refresh token missing' });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user || user.isBanned) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id, user.role);

    const responseData = { success: true, accessToken };
    if (isMobile(req)) {
      responseData.refreshToken = newRefreshToken;
    } else {
      setRefreshCookie(res, newRefreshToken);
    }

    res.json(responseData);
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/auth/logout
const logout = (req, res) => {
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Logged out' });
};

// POST /api/v1/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    const user = await User.findOne({ email });

    // Always respond 200 — don't reveal whether email exists
    if (user && user.passwordHash) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashed = crypto.createHash('sha256').update(rawToken).digest('hex');

      user.passwordResetToken = hashed;
      user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();

      sendPasswordResetEmail(user.email, rawToken).catch(() => {});
    }

    res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/auth/reset-password
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = resetPasswordSchema.parse(req.body);
    const hashed = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashed,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    user.passwordHash = await bcrypt.hash(password, 12);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully. Please log in.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  googleLogin,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
};
