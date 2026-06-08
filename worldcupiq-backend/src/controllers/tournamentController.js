const TournamentChallenge = require('../models/TournamentChallenge');
const GameSession = require('../models/GameSession');
const Question = require('../models/Question');

function formatQuestions(questions) {
  return questions.map((q) => {
    const obj = q.toObject ? q.toObject() : { ...q };
    const { options, ...rest } = obj;
    return {
      ...rest,
      options:
        options && !Array.isArray(options)
          ? [options.A, options.B, options.C, options.D]
          : options,
    };
  });
}

// GET /api/v1/tournament/challenges
const listChallenges = async (req, res, next) => {
  try {
    const now = new Date();
    const challenges = await TournamentChallenge.find({
      isActive: true,
      $and: [
        { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
        { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] },
      ],
    }).select('-questionFilter');

    const userId = req.user._id;
    const challengeIds = challenges.map((c) => c._id);

    const completedSessions = await GameSession.find({
      userId,
      type: 'challenge',
      status: 'completed',
      challengeId: { $in: challengeIds },
    }).select('challengeId totalScore correctCount');

    const completedMap = new Map(
      completedSessions.map((s) => [s.challengeId?.toString(), s])
    );

    const result = challenges.map((c) => {
      const session = completedMap.get(c._id.toString());
      return {
        ...c.toObject(),
        completed: !!session,
        bestScore: session?.totalScore ?? null,
      };
    });

    res.json({ success: true, challenges: result });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/tournament/challenges/:id/start
const startChallenge = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const now = new Date();

    const challenge = await TournamentChallenge.findOne({
      _id: id,
      isActive: true,
      $and: [
        { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] },
      ],
    });

    if (!challenge) {
      return res.status(404).json({ success: false, message: 'Challenge not found or expired' });
    }

    // Resume in-progress session if exists
    const existing = await GameSession.findOne({
      userId,
      type: 'challenge',
      status: 'in_progress',
      challengeId: challenge._id,
    });

    if (existing) {
      const questions = await Question.find({
        _id: { $in: existing.questions.map((q) => q.questionId) },
      }).select('-correctAnswer');
      return res.json({
        success: true,
        sessionId: existing._id,
        questions: formatQuestions(questions),
        type: 'challenge',
        resumed: true,
        challenge: { title: challenge.title, badge: challenge.badge },
      });
    }

    const matchFilter = { isActive: true };
    if (challenge.questionFilter.categories?.length) {
      matchFilter.category = { $in: challenge.questionFilter.categories };
    }
    if (challenge.questionFilter.difficulty && challenge.questionFilter.difficulty !== 'any') {
      matchFilter.difficulty = challenge.questionFilter.difficulty;
    }

    const count = challenge.questionFilter.count || 10;
    const questions = await Question.aggregate([
      { $match: matchFilter },
      { $sample: { size: count } },
      { $project: { correctAnswer: 0 } },
    ]);

    if (questions.length === 0) {
      return res.status(404).json({ success: false, message: 'No questions available for this challenge' });
    }

    const session = await GameSession.create({
      userId,
      type: 'challenge',
      challengeId: challenge._id,
      questions: questions.map((q) => ({ questionId: q._id, sentAt: new Date() })),
    });

    TournamentChallenge.findByIdAndUpdate(id, { $inc: { participantCount: 1 } }).catch(() => {});

    res.status(201).json({
      success: true,
      sessionId: session._id,
      questions: formatQuestions(questions),
      type: 'challenge',
      challenge: { title: challenge.title, badge: challenge.badge },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { listChallenges, startChallenge };
