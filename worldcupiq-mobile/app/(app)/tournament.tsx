import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { tournamentApi } from '../../src/api/queries/tournament';
import { triviaApi } from '../../src/api/queries/trivia';
import { extractError } from '../../src/api/client';
import { TournamentChallenge, GameSession, AnswerResult, GameResults } from '../../src/types';
import { useAuthStore } from '../../src/store/auth';
import { COLORS, FONTS, RADIUS } from '../../constants/colors';

type Phase = 'list' | 'starting' | 'playing' | 'answered' | 'finished';
const QUESTION_TIME = 20;

export default function TournamentScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const isTournamentPass = user?.plan === 'tournament';

  const [phase, setPhase] = useState<Phase>('list');
  const [activeChallenge, setActiveChallenge] = useState<TournamentChallenge | null>(null);
  const [session, setSession] = useState<GameSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [results, setResults] = useState<AnswerResult[]>([]);
  const [gameResults, setGameResults] = useState<GameResults | null>(null);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressAnim = useRef(new Animated.Value(1)).current;

  const { data: challenges, isLoading, refetch } = useQuery<TournamentChallenge[]>({
    queryKey: ['tournament-challenges'],
    queryFn: tournamentApi.listChallenges,
    enabled: isTournamentPass,
  });

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    progressAnim.stopAnimation();
  }, []);

  const startTimer = useCallback(() => {
    setTimeLeft(QUESTION_TIME);
    progressAnim.setValue(1);
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: QUESTION_TIME * 1000,
      useNativeDriver: false,
    }).start();
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    if (timeLeft === 0 && phase === 'playing' && session) {
      const q = session.questions[currentIndex];
      handleSubmit(q._id, '__timeout__');
    }
  }, [timeLeft, phase]);

  useEffect(() => () => stopTimer(), []);

  const handleSubmit = useCallback(
    async (questionId: string, answer: string) => {
      if (!session || phase !== 'playing') return;
      stopTimer();
      setSelected(answer);
      setPhase('answered');
      try {
        const result = await triviaApi.submitAnswer(session.sessionId, questionId, answer);
        setAnswerResult(result);
        setResults((prev) => [...prev, result]);
      } catch {
        setAnswerResult({ questionId, correct: false, correctAnswer: '', pointsEarned: 0 });
      }
    },
    [session, phase, stopTimer]
  );

  const nextQuestion = useCallback(async () => {
    if (!session) return;
    const next = currentIndex + 1;
    if (next >= session.questions.length) {
      try {
        const gr = await triviaApi.finishSession(session.sessionId);
        setGameResults(gr);
        setPhase('finished');
        qc.invalidateQueries({ queryKey: ['tournament-challenges'] });
        qc.invalidateQueries({ queryKey: ['user-stats'] });
      } catch {
        setPhase('finished');
      }
    } else {
      setCurrentIndex(next);
      setSelected(null);
      setAnswerResult(null);
      setPhase('playing');
      startTimer();
    }
  }, [session, currentIndex, qc, startTimer]);

  const startChallenge = useCallback(async (challenge: TournamentChallenge) => {
    setPhase('starting');
    setActiveChallenge(challenge);
    try {
      const s = await tournamentApi.startChallenge(challenge._id);
      setSession(s as unknown as GameSession);
      setCurrentIndex(0);
      setSelected(null);
      setAnswerResult(null);
      setResults([]);
      setGameResults(null);
      setPhase('playing');
      startTimer();
    } catch (err) {
      Alert.alert('Error', extractError(err));
      setPhase('list');
      setActiveChallenge(null);
    }
  }, [startTimer]);

  const backToList = useCallback(() => {
    stopTimer();
    setPhase('list');
    setActiveChallenge(null);
    setSession(null);
    setGameResults(null);
    refetch();
  }, [stopTimer, refetch]);

  // ─── Not tournament pass ───────────────────────────────────────────────────
  if (!isTournamentPass) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.lockedContent}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textMuted} />
        </TouchableOpacity>
        <View style={styles.lockedInner}>
          <Text style={styles.bigBadge}>🏆</Text>
          <Text style={styles.lockedTitle}>Tournament Challenges</Text>
          <Text style={styles.lockedSub}>
            Exclusive challenges for the 2026 World Cup are unlocked with the Tournament Pass.
          </Text>
          {['Everything in Premium', 'One-time payment', '5 exclusive challenges', 'Special badge & achievement'].map((f) => (
            <View key={f} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.accent} />
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
          <TouchableOpacity
            style={styles.upgradeBtn}
            onPress={() => router.push('/(app)/upgrade')}
          >
            <Ionicons name="flash" size={16} color={COLORS.background} />
            <Text style={styles.upgradeBtnText}>Get Tournament Pass</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // ─── Challenge list ─────────────────────────────────────────────────────────
  if (phase === 'list' || phase === 'starting') {
    const completedCount = challenges?.filter((c) => c.completed).length ?? 0;
    const totalCount = challenges?.length ?? 0;

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textMuted} />
        </TouchableOpacity>
        <Text style={styles.heading}>Tournament Challenges</Text>
        <Text style={styles.sub}>Exclusive to Tournament Pass holders</Text>

        {/* Progress */}
        {totalCount > 0 && (
          <View style={styles.progressCard}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Your Progress</Text>
              <Text style={styles.progressCount}>{completedCount}/{totalCount}</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${(completedCount / totalCount) * 100}%` as `${number}%` }]} />
            </View>
          </View>
        )}

        {isLoading ? (
          <Text style={styles.loadingText}>Loading challenges...</Text>
        ) : challenges?.length ? (
          challenges.map((challenge) => (
            <View key={challenge._id} style={[styles.challengeCard, challenge.completed && styles.challengeCompleted]}>
              <View style={styles.challengeHeader}>
                <Text style={styles.challengeBadge}>{challenge.badge}</Text>
                <View style={styles.challengeInfo}>
                  <Text style={styles.challengeTitle}>{challenge.title}</Text>
                  <Text style={styles.challengeMeta}>
                    {challenge.participantCount.toLocaleString()} players
                    {challenge.bestScore !== null ? ` · Best: ${challenge.bestScore} pts` : ''}
                  </Text>
                </View>
                {challenge.completed && (
                  <Ionicons name="checkmark-circle" size={22} color={COLORS.accent} />
                )}
              </View>
              <Text style={styles.challengeDesc}>{challenge.description}</Text>
              <TouchableOpacity
                style={[
                  styles.startBtn,
                  challenge.completed && styles.startBtnDone,
                  phase === 'starting' && activeChallenge?._id === challenge._id && styles.startBtnLoading,
                ]}
                onPress={() => !challenge.completed && startChallenge(challenge)}
                disabled={challenge.completed || phase === 'starting'}
                activeOpacity={0.8}
              >
                {phase === 'starting' && activeChallenge?._id === challenge._id ? (
                  <Text style={styles.startBtnText}>Loading...</Text>
                ) : challenge.completed ? (
                  <>
                    <Ionicons name="checkmark" size={15} color={COLORS.textMuted} />
                    <Text style={[styles.startBtnText, { color: COLORS.textMuted }]}>Completed</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="flash" size={15} color={COLORS.background} />
                    <Text style={styles.startBtnText}>Start Challenge</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={styles.empty}>No challenges available. Check back soon!</Text>
        )}
      </ScrollView>
    );
  }

  // ─── Game view ──────────────────────────────────────────────────────────────
  if ((phase === 'playing' || phase === 'answered') && session) {
    const q = session.questions[currentIndex];
    const total = session.questions.length;

    return (
      <View style={styles.gameContainer}>
        <View style={styles.gameHeader}>
          <TouchableOpacity onPress={backToList}>
            <Ionicons name="close" size={22} color={COLORS.textMuted} />
          </TouchableOpacity>
          <Text style={styles.qCounter}>{currentIndex + 1} / {total}</Text>
          <View style={[styles.timerChip, timeLeft <= 5 && styles.timerUrgent]}>
            <Ionicons name="time-outline" size={14} color={timeLeft <= 5 ? COLORS.danger : COLORS.accent} />
            <Text style={[styles.timerText, timeLeft <= 5 && styles.timerTextUrgent]}>{timeLeft}s</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrackThin}>
          <View style={[styles.progressFillThin, { width: `${((currentIndex) / total) * 100}%` as `${number}%` }]} />
        </View>
        <View style={styles.timeTrack}>
          <Animated.View style={[styles.timeFill, { width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
        </View>

        <ScrollView style={styles.flex} contentContainerStyle={styles.questionContent}>
          {activeChallenge && (
            <Text style={styles.challengeBadgeSm}>{activeChallenge.badge} {activeChallenge.title}</Text>
          )}
          <Text style={styles.questionText}>{q.text}</Text>
          <View style={styles.options}>
            {q.options.map((opt, i) => {
              const isSelected = selected === opt;
              const isCorrect = phase === 'answered' && answerResult?.correctAnswer === opt;
              const isWrong = phase === 'answered' && isSelected && !answerResult?.correct;
              const isPending = phase === 'answered' && isSelected && !isCorrect && !isWrong;
              const isDim = phase === 'answered' && !isSelected && !isCorrect;
              let optStyle = {};
              if (phase === 'answered') {
                if (isCorrect) optStyle = styles.optionCorrect;
                else if (isWrong) optStyle = styles.optionWrong;
                else if (isPending) optStyle = styles.optionSelected;
                else if (isDim) optStyle = styles.optionDim;
              } else if (isSelected) {
                optStyle = styles.optionSelected;
              }
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.optionBase, optStyle]}
                  onPress={() => phase === 'playing' && handleSubmit(q._id, opt)}
                  disabled={phase === 'answered'}
                  activeOpacity={0.75}
                >
                  <View style={[styles.optionLetter, isCorrect && styles.optionLetterCorrect, isWrong && styles.optionLetterWrong]}>
                    <Text style={styles.optionLetterText}>{String.fromCharCode(65 + i)}</Text>
                  </View>
                  <Text style={styles.optionText}>{opt}</Text>
                  {isCorrect && <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />}
                  {isWrong && <Ionicons name="close-circle" size={20} color={COLORS.danger} />}
                </TouchableOpacity>
              );
            })}
          </View>
          {phase === 'answered' && answerResult && (
            <View style={[styles.feedback, answerResult.correct ? styles.feedbackCorrect : styles.feedbackWrong]}>
              <Ionicons name={answerResult.correct ? 'checkmark-circle-outline' : 'close-circle-outline'} size={22} color={answerResult.correct ? COLORS.primary : COLORS.danger} />
              <View style={styles.feedbackText}>
                <Text style={styles.feedbackTitle}>{answerResult.correct ? 'Correct!' : 'Wrong!'}</Text>
                {!answerResult.correct && answerResult.correctAnswer ? (
                  <Text style={styles.feedbackSub}>Answer: {answerResult.correctAnswer}</Text>
                ) : null}
                {answerResult.correct ? <Text style={styles.feedbackSub}>+{answerResult.pointsEarned} pts</Text> : null}
              </View>
              <TouchableOpacity style={styles.nextBtn} onPress={nextQuestion}>
                <Text style={styles.nextBtnText}>{currentIndex + 1 < total ? 'Next' : 'Finish'}</Text>
                <Ionicons name="arrow-forward" size={14} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  // ─── Results ────────────────────────────────────────────────────────────────
  if (phase === 'finished' && gameResults) {
    const pct = Math.round((gameResults.correctAnswers / gameResults.totalQuestions) * 100);
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.resultsContent}>
        <Text style={styles.bigBadge}>{activeChallenge?.badge ?? '🏆'}</Text>
        <Text style={styles.resultsChallengeName}>{activeChallenge?.title ?? 'Tournament Challenge'}</Text>
        <View style={[styles.scoreCircle, { borderColor: COLORS.accent }]}>
          <Text style={[styles.scoreCircleValue, { color: COLORS.accent }]}>{pct}%</Text>
          <Text style={styles.scoreCircleLabel}>Score</Text>
        </View>
        <Text style={styles.resultsTitle}>
          {pct >= 80 ? 'Outstanding!' : pct >= 50 ? 'Well done!' : 'Keep practicing!'}
        </Text>
        <View style={styles.resultsSummary}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: COLORS.primary }]}>{gameResults.correctAnswers}/{gameResults.totalQuestions}</Text>
            <Text style={styles.summaryLabel}>Correct</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: COLORS.accent }]}>+{gameResults.pointsEarned}</Text>
            <Text style={styles.summaryLabel}>Points</Text>
          </View>
        </View>
        <View style={styles.emojiGrid}>
          {gameResults.results.map((r, i) => (
            <View key={i} style={[styles.emojiSquare, r.correct ? styles.emojiCorrect : styles.emojiWrong]} />
          ))}
        </View>
        {gameResults.newAchievements?.length ? (
          <View style={styles.achievementsBox}>
            <Text style={styles.achievementsTitle}>Achievements Unlocked!</Text>
            {gameResults.newAchievements.map((a) => (
              <Text key={a.slug} style={styles.achievementItem}>🏅 {a.title}</Text>
            ))}
          </View>
        ) : null}
        <TouchableOpacity style={styles.doneBtn} onPress={backToList} activeOpacity={0.8}>
          <Text style={styles.doneBtnText}>Back to Challenges</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace('/(app)/dashboard')}>
          <Text style={styles.dashLink}>Back to Dashboard</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 40 },
  lockedContent: { padding: 16, paddingBottom: 40 },
  back: { paddingBottom: 12 },
  heading: { color: COLORS.text, fontSize: FONTS['2xl'], fontWeight: '800', marginBottom: 4 },
  sub: { color: COLORS.textMuted, fontSize: FONTS.sm, marginBottom: 20 },

  lockedInner: { alignItems: 'center', paddingTop: 24 },
  bigBadge: { fontSize: 48, marginBottom: 12, textAlign: 'center' },
  lockedTitle: { color: COLORS.text, fontSize: FONTS.xl, fontWeight: '800', textAlign: 'center', marginBottom: 10 },
  lockedSub: { color: COLORS.textMuted, fontSize: FONTS.sm, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, alignSelf: 'stretch' },
  featureText: { color: COLORS.textMuted, fontSize: FONTS.sm },
  upgradeBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.accent, borderRadius: RADIUS.md, paddingHorizontal: 20, paddingVertical: 13, marginTop: 12 },
  upgradeBtnText: { color: COLORS.background, fontSize: FONTS.base, fontWeight: '700' },

  progressCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { color: COLORS.text, fontSize: FONTS.sm, fontWeight: '600' },
  progressCount: { color: COLORS.accent, fontSize: FONTS.sm, fontWeight: '700' },
  progressTrack: { height: 6, backgroundColor: COLORS.background, borderRadius: RADIUS.full, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: COLORS.accent, borderRadius: RADIUS.full },

  loadingText: { color: COLORS.textMuted, fontSize: FONTS.base, textAlign: 'center', marginTop: 20 },
  empty: { color: COLORS.textFaint, fontSize: FONTS.base, textAlign: 'center', marginTop: 20 },

  challengeCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 14 },
  challengeCompleted: { opacity: 0.7 },
  challengeHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  challengeBadge: { fontSize: 28 },
  challengeInfo: { flex: 1 },
  challengeTitle: { color: COLORS.text, fontSize: FONTS.base, fontWeight: '800' },
  challengeMeta: { color: COLORS.textFaint, fontSize: FONTS.xs, marginTop: 2 },
  challengeDesc: { color: COLORS.textMuted, fontSize: FONTS.sm, lineHeight: 18, marginBottom: 14 },
  startBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: COLORS.accent, borderRadius: RADIUS.md, paddingVertical: 12 },
  startBtnDone: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  startBtnLoading: { opacity: 0.6 },
  startBtnText: { color: COLORS.background, fontSize: FONTS.sm, fontWeight: '700' },

  gameContainer: { flex: 1, backgroundColor: COLORS.background },
  gameHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12 },
  qCounter: { color: COLORS.text, fontSize: FONTS.base, fontWeight: '700' },
  timerChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: `${COLORS.accent}20`, paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full },
  timerUrgent: { backgroundColor: `${COLORS.danger}20` },
  timerText: { color: COLORS.accent, fontSize: FONTS.sm, fontWeight: '700' },
  timerTextUrgent: { color: COLORS.danger },
  progressTrackThin: { height: 4, backgroundColor: COLORS.border, marginHorizontal: 16, borderRadius: RADIUS.full, overflow: 'hidden', marginBottom: 2 },
  progressFillThin: { height: '100%', backgroundColor: COLORS.accent, borderRadius: RADIUS.full },
  timeTrack: { height: 3, backgroundColor: COLORS.border, marginHorizontal: 16, borderRadius: RADIUS.full, overflow: 'hidden', marginBottom: 4 },
  timeFill: { height: '100%', backgroundColor: COLORS.accent, borderRadius: RADIUS.full },
  flex: { flex: 1 },
  questionContent: { padding: 16, paddingBottom: 32 },
  challengeBadgeSm: { color: COLORS.accent, fontSize: FONTS.xs, fontWeight: '700', marginBottom: 10 },
  questionText: { color: COLORS.text, fontSize: FONTS.lg, fontWeight: '700', lineHeight: 28, marginBottom: 20 },
  options: { gap: 10 },
  optionBase: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: 14 },
  optionSelected: { borderColor: COLORS.accent, backgroundColor: `${COLORS.accent}10` },
  optionCorrect: { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}15` },
  optionWrong: { borderColor: COLORS.danger, backgroundColor: `${COLORS.danger}15` },
  optionDim: { opacity: 0.45 },
  optionLetter: { width: 28, height: 28, borderRadius: RADIUS.full, backgroundColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  optionLetterCorrect: { backgroundColor: COLORS.primary },
  optionLetterWrong: { backgroundColor: COLORS.danger },
  optionLetterText: { color: COLORS.text, fontSize: FONTS.xs, fontWeight: '700' },
  optionText: { color: COLORS.text, fontSize: FONTS.base, flex: 1, lineHeight: 22 },
  feedback: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: RADIUS.lg, padding: 14, marginTop: 16 },
  feedbackCorrect: { backgroundColor: `${COLORS.primary}15`, borderWidth: 1, borderColor: `${COLORS.primary}40` },
  feedbackWrong: { backgroundColor: `${COLORS.danger}15`, borderWidth: 1, borderColor: `${COLORS.danger}40` },
  feedbackText: { flex: 1 },
  feedbackTitle: { color: COLORS.text, fontSize: FONTS.base, fontWeight: '700' },
  feedbackSub: { color: COLORS.textMuted, fontSize: FONTS.sm },
  nextBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.md },
  nextBtnText: { color: COLORS.white, fontSize: FONTS.sm, fontWeight: '700' },

  resultsContent: { padding: 24, alignItems: 'center', gap: 14 },
  resultsChallengeName: { color: COLORS.accent, fontSize: FONTS.sm, fontWeight: '700' },
  scoreCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: COLORS.card, borderWidth: 4, alignItems: 'center', justifyContent: 'center' },
  scoreCircleValue: { fontSize: FONTS['3xl'], fontWeight: '800' },
  scoreCircleLabel: { color: COLORS.textMuted, fontSize: FONTS.xs },
  resultsTitle: { color: COLORS.text, fontSize: FONTS['2xl'], fontWeight: '800', textAlign: 'center' },
  resultsSummary: { flexDirection: 'row', gap: 28 },
  summaryItem: { alignItems: 'center' },
  summaryValue: { fontSize: FONTS['2xl'], fontWeight: '800' },
  summaryLabel: { color: COLORS.textMuted, fontSize: FONTS.sm },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
  emojiSquare: { width: 26, height: 26, borderRadius: 5 },
  emojiCorrect: { backgroundColor: COLORS.primary },
  emojiWrong: { backgroundColor: COLORS.danger },
  achievementsBox: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: 16, alignSelf: 'stretch', borderWidth: 1, borderColor: COLORS.accent },
  achievementsTitle: { color: COLORS.accent, fontSize: FONTS.base, fontWeight: '700', marginBottom: 8 },
  achievementItem: { color: COLORS.text, fontSize: FONTS.sm, marginBottom: 4 },
  doneBtn: { width: '100%', backgroundColor: COLORS.accent, paddingVertical: 14, borderRadius: RADIUS.md, alignItems: 'center' },
  doneBtnText: { color: COLORS.background, fontSize: FONTS.base, fontWeight: '700' },
  dashLink: { color: COLORS.textFaint, fontSize: FONTS.sm, marginTop: 4 },
});
