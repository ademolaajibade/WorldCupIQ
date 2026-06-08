const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'WorldCupIQ <noreply@worldcupiq.com>';

const sendWelcomeEmail = async (to, displayName) => {
  await resend.emails.send({
    from: FROM,
    to,
    subject: '🏆 Welcome to WorldCupIQ!',
    html: `
      <h1>Welcome, ${displayName}!</h1>
      <p>You're now part of the WorldCupIQ community. Test your World Cup 2026 knowledge every day.</p>
      <p>Your daily challenge awaits — play now and climb the leaderboard!</p>
      <a href="${process.env.FRONTEND_URL}/play/daily" style="padding:12px 24px;background:#003087;color:#fff;border-radius:6px;text-decoration:none;">Play Today's Challenge</a>
    `,
  });
};

const sendStreakBreakEmail = async (to, displayName, streak) => {
  await resend.emails.send({
    from: FROM,
    to,
    subject: '😢 Your streak ended — start a new one today!',
    html: `
      <h1>Your ${streak}-day streak ended, ${displayName}</h1>
      <p>Don't give up! Play today's challenge to start a brand-new streak.</p>
      <a href="${process.env.FRONTEND_URL}/play/daily" style="padding:12px 24px;background:#003087;color:#fff;border-radius:6px;text-decoration:none;">Play Now</a>
    `,
  });
};

const sendPasswordResetEmail = async (to, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Reset your WorldCupIQ password',
    html: `
      <h1>Password Reset</h1>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <a href="${resetUrl}" style="padding:12px 24px;background:#003087;color:#fff;border-radius:6px;text-decoration:none;">Reset Password</a>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
  });
};

const sendPaymentConfirmationEmail = async (to, displayName, plan, amount, currency) => {
  const formatted = currency === 'NGN'
    ? `₦${(amount / 100).toLocaleString()}`
    : `$${(amount / 100).toFixed(2)}`;

  await resend.emails.send({
    from: FROM,
    to,
    subject: '✅ Payment confirmed — Welcome to Premium!',
    html: `
      <h1>Payment Confirmed</h1>
      <p>Hi ${displayName}, your payment of ${formatted} for <strong>${plan}</strong> was successful.</p>
      <p>Enjoy unlimited questions, AI chat, and all premium features!</p>
      <a href="${process.env.FRONTEND_URL}/dashboard" style="padding:12px 24px;background:#003087;color:#fff;border-radius:6px;text-decoration:none;">Go to Dashboard</a>
    `,
  });
};

module.exports = {
  sendWelcomeEmail,
  sendStreakBreakEmail,
  sendPasswordResetEmail,
  sendPaymentConfirmationEmail,
};
