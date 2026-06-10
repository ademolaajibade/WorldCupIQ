const redis = require('../config/redis');
const DailyChallenge = require('../models/DailyChallenge');
const GameSession = require('../models/GameSession');
const Question = require('../models/Question');
const UserAnswer = require('../models/UserAnswer');
const User = require('../models/User');
const { syncLeaderboardScore } = require('../services/leaderboard');
const { checkAndUnlockAchievements } = require('../services/achievementChecker');
const { releaseSessionLock } = require('../middlewares/sessionLock');
const { todayUTC, yesterdayUTC, nDaysAgoUTC } = require('../utils/helpers');
const {
  ANTI_CHEAT_MIN_MS,
  CATEGORIES,
  DAILY_QUESTION_COUNT,
  FREE_QUICK_QUESTION_COUNT,
  PREMIUM_QUICK_QUESTION_COUNT,
} = require('../utils/constants');

// Convert stored {A,B,C,D} options object to array for mobile client
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

// Build AnswerResult[] from UserAnswer docs (with populated questionId)
function buildResults(answers) {
  return answers.map((a) => {
    const q = a.questionId;
    const correctAnswerText =
      q && q.options ? q.options[q.correctAnswer] ?? q.correctAnswer : '';
    return {
      questionId: (q?._id ?? a.questionId).toString(),
      correct: a.isCorrect,
      correctAnswer: correctAnswerText,
      pointsEarned: a.pointsEarned,
    };
  });
}

// GET /api/v1/trivia/daily
const getDailyChallenge = async (req, res, next) => {
  try {
    const today = todayUTC();
    const cacheKey = `daily:questions:${today}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json({ success: true, challenge: JSON.parse(cached) });
    }

    const challenge = await DailyChallenge.findOne({ date: today }).populate({
      path: 'questions',
      select: '-correctAnswer',
    });

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: "Today's challenge is not ready yet. Check back soon!",
      });
    }

    const payload = challenge.toObject();
    await redis.set(cacheKey, JSON.stringify(payload), { ex: 25 * 3600 });

    res.json({ success: true, challenge: payload });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/trivia/daily/start
const startDailySession = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const today = todayUTC();

    const challenge = await DailyChallenge.findOne({ date: today });
    if (!challenge) {
      return res.status(404).json({ success: false, message: "Today's challenge not found" });
    }

    // Prevent replaying the same day's challenge
    const existing = await GameSession.findOne({
      userId,
      dailyChallengeId: challenge._id,
      status: { $in: ['completed', 'in_progress'] },
    });

    if (existing) {
      if (existing.status === 'completed') {
        return res.status(409).json({
          success: false,
          message: "You've already completed today's challenge",
        });
      }
      // Resume in-progress: clear any stale lock and fetch question data
      releaseSessionLock(userId.toString()).catch(() => {});
      const questions = await Question.find({
        _id: { $in: existing.questions.map((q) => q.questionId) },
      }).select('-correctAnswer');
      return res.json({
        success: true,
        sessionId: existing._id,
        questions: formatQuestions(questions),
        type: 'daily',
        resumed: true,
      });
    }

    const sessionQuestions = challenge.questions.map((qId) => ({
      questionId: qId,
      sentAt: new Date(),
    }));

    const session = await GameSession.create({
      userId,
      type: 'daily',
      dailyChallengeId: challenge._id,
      questions: sessionQuestions,
    });

    DailyChallenge.findByIdAndUpdate(challenge._id, { $inc: { participantCount: 1 } }).catch(() => {});

    const questions = await Question.find({
      _id: { $in: challenge.questions },
    }).select('-correctAnswer');

    res.status(201).json({
      success: true,
      sessionId: session._id,
      questions: formatQuestions(questions),
      type: 'daily',
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/trivia/daily/status
const getDailyStatus = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const today = todayUTC();

    const challenge = await DailyChallenge.findOne({ date: today });
    if (!challenge) {
      return res.json({ success: true, completed: false });
    }

    const session = await GameSession.findOne({
      userId,
      dailyChallengeId: challenge._id,
      status: 'completed',
    });

    res.json({
      success: true,
      completed: !!session,
      score: session?.totalScore,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/trivia/answer
// Accepts { sessionId, questionId, answer } where answer is full option text or '__timeout__'
const submitAnswer = async (req, res, next) => {
  try {
    const { sessionId, questionId, answer } = req.body;
    const userId = req.user._id;

    if (!sessionId || !questionId || answer === undefined) {
      return res.status(400).json({
        success: false,
        message: 'sessionId, questionId, and answer are required',
      });
    }

    const session = await GameSession.findOne({ _id: sessionId, userId, status: 'in_progress' });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found or already completed' });
    }

    const sessionQuestion = session.questions.find(
      (q) => q.questionId.toString() === questionId
    );
    if (!sessionQuestion) {
      return res.status(400).json({ success: false, message: 'Question not part of this session' });
    }

    // Compute time server-side (anti-cheat; client value is untrusted)
    const timeSpentMs = Date.now() - new Date(sessionQuestion.sentAt).getTime();
    if (timeSpentMs < ANTI_CHEAT_MIN_MS) {
      return res.status(400).json({ success: false, message: 'Answer submitted too quickly' });
    }

    // Duplicate answer check
    const alreadyAnswered = await UserAnswer.findOne({ sessionId: session._id, questionId });
    if (alreadyAnswered) {
      return res.status(409).json({ success: false, message: 'Already answered this question' });
    }

    const question = await Question.findById(questionId).select('+correctAnswer');
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    // Map full option text → letter (A/B/C/D); treat timeout specially
    let selectedLetter;
    if (answer === '__timeout__') {
      selectedLetter = '__timeout__';
    } else {
      const answerTrimmed = answer.trim();
      const letters = ['A', 'B', 'C', 'D'];
      selectedLetter =
        letters.find((k) => question.options[k]?.trim() === answerTrimmed) ?? '__timeout__';
    }

    const isCorrect = selectedLetter === question.correctAnswer;
    const pointsEarned = isCorrect ? question.points : 0;
    const correctAnswerText = question.options[question.correctAnswer];

    await UserAnswer.create({
      sessionId: session._id,
      userId,
      questionId,
      selectedAnswer: selectedLetter,
      isCorrect,
      timeSpentMs,
      pointsEarned,
    });

    session.score += pointsEarned;
    if (isCorrect) session.correctCount += 1;
    session.currentQuestionIndex += 1;
    await session.save();

    Question.findByIdAndUpdate(questionId, {
      $inc: { timesAnswered: 1, ...(isCorrect ? { timesCorrect: 1 } : {}) },
    }).catch(() => {});

    res.json({
      success: true,
      questionId,
      correct: isCorrect,
      correctAnswer: correctAnswerText,
      explanation: question.explanation,
      pointsEarned,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/trivia/finish  (mobile)
// Accepts { sessionId } in body; returns GameResults
const finishSession = async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    const userId = req.user._id;

    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'sessionId is required' });
    }

    const session = await GameSession.findOne({ _id: sessionId, userId });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // If already completed return the stored results
    if (session.status === 'completed') {
      const answers = await UserAnswer.find({ sessionId: session._id }).populate({
        path: 'questionId',
        select: '+correctAnswer',
      });
      return res.json({
        success: true,
        score: session.totalScore,
        totalQuestions: session.questions.length,
        correctAnswers: session.correctCount,
        pointsEarned: session.totalScore,
        results: buildResults(answers),
        newAchievements: [],
      });
    }

    session.status = 'completed';
    session.completedAt = new Date();
    session.timeSpentMs = Date.now() - session.startedAt.getTime();
    session.totalScore = session.score + session.bonusScore;
    await session.save();

    const user = await User.findById(userId);
    user.stats.totalScore += session.totalScore;
    user.stats.gamesPlayed += 1;
    user.stats.questionsAnswered += session.questions.length;
    user.stats.correctAnswers += session.correctCount;

    if (session.type === 'daily') {
      user.stats.dailyChallengesCompleted += 1;
      const last = user.stats.lastChallengeDate;
      const today = todayUTC();
      const yesterday = yesterdayUTC();
      if (last === yesterday) {
        user.stats.currentStreak += 1;
      } else if (last !== today) {
        const twoDaysAgo = nDaysAgoUTC(2);
        if (last === twoDaysAgo && user.stats.streakShields > 0) {
          user.stats.streakShields -= 1;
          user.stats.currentStreak += 1;
        } else {
          user.stats.currentStreak = 1;
        }
      }
      user.stats.longestStreak = Math.max(user.stats.longestStreak, user.stats.currentStreak);
      user.stats.lastChallengeDate = today;
      redis.set(`user:streak:${userId}`, user.stats.currentStreak, { ex: 48 * 3600 }).catch(() => {});
    } else if (session.type === 'challenge') {
      user.stats.tournamentChallengesCompleted = (user.stats.tournamentChallengesCompleted ?? 0) + 1;
    }

    user.lastActiveAt = new Date();
    await user.save();

    syncLeaderboardScore(userId, user.country).catch(() => {});
    const newAchievements = await checkAndUnlockAchievements(userId).catch(() => []);
    releaseSessionLock(userId.toString()).catch(() => {});

    const answers = await UserAnswer.find({ sessionId: session._id }).populate({
      path: 'questionId',
      select: '+correctAnswer',
    });

    res.json({
      success: true,
      score: session.totalScore,
      totalQuestions: session.questions.length,
      correctAnswers: session.correctCount,
      pointsEarned: session.totalScore,
      results: buildResults(answers),
      newAchievements,
      streakShieldsRemaining: user.stats.streakShields,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/trivia/session/:id/complete  (web)
const completeSession = async (req, res, next) => {
  try {
    const { id: sessionId } = req.params;
    const userId = req.user._id;

    const session = await GameSession.findOne({ _id: sessionId, userId });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    if (session.status === 'completed') {
      return res.json({ success: true, session, message: 'Already completed' });
    }

    session.status = 'completed';
    session.completedAt = new Date();
    session.timeSpentMs = Date.now() - session.startedAt.getTime();
    session.totalScore = session.score + session.bonusScore;
    await session.save();

    const user = await User.findById(userId);
    user.stats.totalScore += session.totalScore;
    user.stats.gamesPlayed += 1;
    user.stats.questionsAnswered += session.questions.length;
    user.stats.correctAnswers += session.correctCount;

    if (session.type === 'daily') {
      user.stats.dailyChallengesCompleted += 1;
      const last = user.stats.lastChallengeDate;
      const today = todayUTC();
      const yesterday = yesterdayUTC();
      if (last === yesterday) {
        user.stats.currentStreak += 1;
      } else if (last !== today) {
        const twoDaysAgo = nDaysAgoUTC(2);
        if (last === twoDaysAgo && user.stats.streakShields > 0) {
          user.stats.streakShields -= 1;
          user.stats.currentStreak += 1;
        } else {
          user.stats.currentStreak = 1;
        }
      }
      user.stats.longestStreak = Math.max(user.stats.longestStreak, user.stats.currentStreak);
      user.stats.lastChallengeDate = today;
      redis.set(`user:streak:${userId}`, user.stats.currentStreak, { ex: 48 * 3600 }).catch(() => {});
    } else if (session.type === 'challenge') {
      user.stats.tournamentChallengesCompleted = (user.stats.tournamentChallengesCompleted ?? 0) + 1;
    }

    user.lastActiveAt = new Date();
    await user.save();

    syncLeaderboardScore(userId, user.country).catch(() => {});
    const newAchievements = await checkAndUnlockAchievements(userId).catch(() => []);
    releaseSessionLock(userId.toString()).catch(() => {});

    res.json({
      success: true,
      session,
      totalScore: session.totalScore,
      newAchievements,
      streakShieldsRemaining: user.stats.streakShields,
    });
  } catch (err) {
    next(err);
  }
};

// GET/POST /api/v1/trivia/quick/start
const startQuickPlay = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const isPremium = req.user.isPremium();
    const questionCount = isPremium ? PREMIUM_QUICK_QUESTION_COUNT : FREE_QUICK_QUESTION_COUNT;

    const matchFilter = { isActive: true, pack: null };

    if (isPremium) {
      const { difficulty, category } = { ...req.query, ...req.body };
      if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty)) {
        matchFilter.difficulty = difficulty;
      }
      if (category && CATEGORIES.includes(category)) {
        matchFilter.category = category;
      }
    }

    const questions = await Question.aggregate([
      { $match: matchFilter },
      { $sample: { size: questionCount } },
      { $project: { correctAnswer: 0 } },
    ]);

    if (questions.length === 0) {
      return res.status(404).json({ success: false, message: 'No questions available' });
    }

    const sessionQuestions = questions.map((q) => ({
      questionId: q._id,
      sentAt: new Date(),
    }));

    const session = await GameSession.create({
      userId,
      type: 'quick',
      questions: sessionQuestions,
    });

    res.status(201).json({
      success: true,
      sessionId: session._id,
      questions: formatQuestions(questions),
      type: 'quick',
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/trivia/history
const getHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const sessions = await GameSession.find({
      userId: req.user._id,
      status: 'completed',
    })
      .sort({ completedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-questions');

    const total = await GameSession.countDocuments({
      userId: req.user._id,
      status: 'completed',
    });

    res.json({ success: true, sessions, total, page: parseInt(page) });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDailyChallenge,
  startDailySession,
  getDailyStatus,
  submitAnswer,
  finishSession,
  completeSession,
  startQuickPlay,
  getHistory,
};
