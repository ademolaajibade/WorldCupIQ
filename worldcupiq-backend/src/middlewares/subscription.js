const requirePremium = (req, res, next) => {
  const { plan, status } = req.user.subscription;
  const isPremium =
    ['premium', 'tournament_pass'].includes(plan) && status === 'active';

  if (!isPremium) {
    return res.status(403).json({
      success: false,
      message: 'Premium subscription required',
      upgradeUrl: '/upgrade',
    });
  }
  next();
};

const requireTournamentPass = (req, res, next) => {
  const { plan, status } = req.user.subscription;
  if (plan !== 'tournament_pass' || status !== 'active') {
    return res.status(403).json({
      success: false,
      message: 'Tournament Pass required',
      upgradeUrl: '/upgrade',
    });
  }
  next();
};

module.exports = { requirePremium, requireTournamentPass };
