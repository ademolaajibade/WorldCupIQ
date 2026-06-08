import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { triviaApi } from '../../src/api/queries/trivia';
import { extractError } from '../../src/api/client';
import { AnswerResult, GameResults, GameSession } from '../../src/types';
import { shareScore } from '../../src/utils/shareScore';
import { COLORS, FONTS, RADIUS } from '../../constants/colors';

type Phase = 'loading' | 'error' | 'ready' | 'playing' | 'answered' | 'finished';

const QUESTION_TIME = 20;

export default function QuickPlayScreen() {
  const router = useRouter();
  const qc = useQueryClient();

  const [phase, setPhase] = useState<Phase>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [session, setSession] = useState<GameSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [results, setResults] = useState<AnswerResult[]>([]);
  const [gameResults, setGameResults] = useState<GameResults | null>(null);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressAnim = useRef(new Animated.Value(1)).current;

  const loadSession = useCallback(() => {
    setPhase('loading');
    setCurrentIndex(0);
    setSelected(null);
    setAnswerResult(null);
    setResults([]);
    setGameResults(null);
    triviaApi
      .startQuick()
      .then((s) => {
        setSession(s);
        setPhase('ready');
      })
      .catch((err) => {
        setErrorMsg(extractError(err));
        setPhase('error');
      });
  }, []);

  useEffect(() => { loadSession(); }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    progressAnim.stopAnimation();
  }, []);

  const handleTimeout = useCallback(() => {
    if (!session) return;
    const q = session.questions[currentIndex];
    submitAnswer(q._id, '__timeout__');
  }, [session, currentIndex]);

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
        if (t <= 1) { clearInterval(timerRef.current!); handleTimeout(); return 0; }
        return t - 1;
      });
    }, 1000);
  }, [handleTimeout]);

  const submitAnswer = useCallback(
    async (questionId: string, answer: string) => {
      if (!session || phase === 'answered') return;
      stopTimer();
      setSelected(answer);
      setPhase('answered');
      try {
        const result = await triviaApi.submitAnswer(session.sessionId, questionId, answer);
        setAnswerResult(result);
        setResults((r) => [...r, result]);
      } catch {
        setAnswerResult({ questionId, correct: false, correctAnswer: '', pointsEarned: 0 });
      }
    },
    [session, phase, stopTimer]
  );

  const nextQuestion = useCallback(async () => {
    if (!session) return;
    const nextIdx = currentIndex + 1;
    if (nextIdx >= session.questions.length) {
      try {
        const gr = await triviaApi.finishSession(session.sessionId);
        setGameResults(gr);
        qc.invalidateQueries({ queryKey: ['me'] });
      } catch {
        setGameResults({
          score: results.reduce((s, r) => s + r.pointsEarned, 0),
          totalQuestions: session.questions.length,
          correctAnswers: results.filter((r) => r.correct).length,
          pointsEarned: results.reduce((s, r) => s + r.pointsEarned, 0),
          results,
        });
      }
      setPhase('finished');
    } else {
      setCurrentIndex(nextIdx);
      setSelected(null);
      setAnswerResult(null);
      setPhase('playing');
      startTimer();
    }
  }, [session, currentIndex, results, startTimer]);

  useEffect(() => () => stopTimer(), []);

  if (phase === 'loading') {
    return (
      <View style={styles.center}>
        <Ionicons name="flash-outline" size={48} color={COLORS.accent} />
        <Text style={styles.loadingText}>Loading quick play...</Text>
      </View>
    );
  }

  if (phase === 'error') {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={52} color={COLORS.danger} />
        <Text style={[styles.bigTitle, { fontSize: 18 }]}>Could not start Quick Play</Text>
        <Text style={[styles.readySub, { textAlign: 'center' }]}>{errorMsg}</Text>
        <TouchableOpacity
          style={[styles.startBtn, { backgroundColor: COLORS.accent }]}
          onPress={loadSession}
          activeOpacity={0.85}
        >
          <Text style={styles.startBtnText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(app)/dashboard')} style={{ marginTop: 12 }}>
          <Text style={{ color: COLORS.textMuted, fontSize: 14 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (phase === 'ready' && session && session.questions) {
    return (
      <View style={styles.center}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(app)/dashboard')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textMuted} />
        </TouchableOpacity>
        <Ionicons name="flash" size={56} color={COLORS.accent} />
        <Text style={styles.bigTitle}>Quick Play</Text>
        <Text style={styles.readySub}>{session.questions.length} questions · 20 seconds each</Text>
        <View style={styles.infoRow}>
          <View style={styles.infoChip}>
            <Ionicons name="star-outline" size={14} color={COLORS.accent} />
            <Text style={styles.infoText}>Up to 50 pts</Text>
          </View>
          <View style={styles.infoChip}>
            <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.infoText}>~2 min</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.startBtn, { backgroundColor: COLORS.accent }]}
          onPress={() => { setPhase('playing'); startTimer(); }}
          activeOpacity={0.85}
        >
          <Text style={styles.startBtnText}>Start!</Text>
          <Ionicons name="flash" size={18} color={COLORS.background} />
        </TouchableOpacity>
      </View>
    );
  }

  if ((phase === 'playing' || phase === 'answered') && session) {
    const q = session.questions[currentIndex];
    return (
      <View style={styles.gameContainer}>
        <View style={styles.gameHeader}>
          <TouchableOpacity onPress={() => Alert.alert('Quit?', 'Progress will be lost.', [
            { text: 'Continue', style: 'cancel' },
            { text: 'Quit', style: 'destructive', onPress: () => router.canGoBack() ? router.back() : router.replace('/(app)/dashboard') },
          ])}>
            <Ionicons name="close" size={24} color={COLORS.textMuted} />
          </TouchableOpacity>
          <Text style={styles.qCounter}>{currentIndex + 1} / {session.questions.length}</Text>
          <View style={[styles.timerChip, timeLeft <= 8 && styles.timerUrgent]}>
            <Ionicons name="flash" size={14} color={timeLeft <= 8 ? COLORS.danger : COLORS.accent} />
            <Text style={[styles.timerText, timeLeft <= 8 && styles.timerTextUrgent]}>{timeLeft}s</Text>
          </View>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${((currentIndex + 1) / session.questions.length) * 100}%` as any }]} />
        </View>
        <View style={styles.timeTrack}>
          <Animated.View
            style={[
              styles.timeFill,
              { width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
              timeLeft <= 8 && { backgroundColor: COLORS.danger },
            ]}
          />
        </View>

        <ScrollView style={styles.flex} contentContainerStyle={styles.questionContent}>
          <Text style={styles.questionText}>{q.text}</Text>
          <View style={styles.options}>
            {q.options.map((opt, i) => {
              const isSelected = selected === opt;
              // Only apply correct/wrong colors AFTER the API has responded
              const isCorrect = answerResult !== null && answerResult.correctAnswer === opt;
              const isWrong = answerResult !== null && isSelected && !answerResult.correct;
              // Neutral highlight while the answer is in-flight
              const isPending = phase === 'answered' && isSelected && answerResult === null;

              let optStyle = styles.optionBase;
              if (phase === 'answered') {
                if (isCorrect) optStyle = styles.optionCorrect;
                else if (isWrong) optStyle = styles.optionWrong;
                else if (isPending) optStyle = styles.optionSelected;
                else optStyle = styles.optionDim;
              } else if (isSelected) {
                optStyle = styles.optionSelected;
              }

              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.optionBase, optStyle]}
                  onPress={() => phase === 'playing' && submitAnswer(q._id, opt)}
                  disabled={phase === 'answered'}
                  activeOpacity={0.75}
                >
                  <View style={[
                    styles.optionLetter,
                    isCorrect && styles.optionLetterCorrect,
                    isWrong && styles.optionLetterWrong,
                  ]}>
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
              <Ionicons
                name={answerResult.correct ? 'checkmark-circle-outline' : 'close-circle-outline'}
                size={22}
                color={answerResult.correct ? COLORS.primary : COLORS.danger}
              />
              <View style={styles.feedbackText}>
                <Text style={styles.feedbackTitle}>{answerResult.correct ? 'Correct!' : 'Wrong!'}</Text>
                {!answerResult.correct && answerResult.correctAnswer && (
                  <Text style={styles.feedbackSub}>Answer: {answerResult.correctAnswer}</Text>
                )}
                {answerResult.correct && <Text style={styles.feedbackSub}>+{answerResult.pointsEarned} pts</Text>}
                {answerResult.explanation ? (
                  <Text style={styles.feedbackFact}>{answerResult.explanation}</Text>
                ) : null}
              </View>
              <TouchableOpacity style={styles.nextBtn} onPress={nextQuestion}>
                <Text style={styles.nextBtnText}>{currentIndex + 1 < session.questions.length ? 'Next' : 'Finish'}</Text>
                <Ionicons name="arrow-forward" size={14} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  if (phase === 'finished' && gameResults) {
    const pct = Math.round((gameResults.correctAnswers / gameResults.totalQuestions) * 100);
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.resultsContent}>
        <View style={[styles.scoreCircle, { borderColor: COLORS.accent }]}>
          <Text style={[styles.scoreCircleValue, { color: COLORS.accent }]}>{pct}%</Text>
          <Text style={styles.scoreCircleLabel}>Score</Text>
        </View>
        <Text style={styles.resultsTitle}>
          {pct >= 80 ? 'Lightning fast!' : pct >= 50 ? 'Good run!' : 'Try again!'}
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
        {/* Answer grid */}
        <View style={styles.emojiGrid}>
          {gameResults.results.map((r, i) => (
            <View key={i} style={[styles.emojiSquare, r.correct ? styles.emojiCorrect : styles.emojiWrong]} />
          ))}
        </View>

        <TouchableOpacity
          style={styles.shareBtn}
          activeOpacity={0.8}
          onPress={() => shareScore({
            mode: 'quick',
            correct: gameResults.correctAnswers,
            total: gameResults.totalQuestions,
            points: gameResults.pointsEarned,
            results: gameResults.results,
          })}
        >
          <Ionicons name="share-social-outline" size={18} color={COLORS.accent} />
          <Text style={[styles.shareBtnText, { color: COLORS.accent }]}>Share Score</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.doneBtn, { backgroundColor: COLORS.accent }]} onPress={loadSession} activeOpacity={0.8}>
          <Ionicons name="flash" size={18} color={COLORS.background} />
          <Text style={[styles.doneBtnText, { color: COLORS.background }]}>Play Again</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.leaderboardBtn} onPress={() => router.push('/(app)/leaderboard')} activeOpacity={0.8}>
          <Text style={styles.leaderboardBtnText}>View Leaderboard</Text>
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
  center: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 },
  backBtn: { position: 'absolute', top: 50, left: 20 },
  loadingText: { color: COLORS.textMuted, fontSize: FONTS.base },
  bigTitle: { color: COLORS.text, fontSize: FONTS['3xl'], fontWeight: '800', textAlign: 'center' },
  readySub: { color: COLORS.textMuted, fontSize: FONTS.base, textAlign: 'center' },
  infoRow: { flexDirection: 'row', gap: 12 },
  infoChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.card, paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full },
  infoText: { color: COLORS.textMuted, fontSize: FONTS.sm },
  startBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 32, paddingVertical: 16, borderRadius: RADIUS.xl, marginTop: 8 },
  startBtnText: { color: COLORS.background, fontSize: FONTS.lg, fontWeight: '800' },

  gameContainer: { flex: 1, backgroundColor: COLORS.background },
  gameHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12 },
  qCounter: { color: COLORS.text, fontSize: FONTS.base, fontWeight: '700' },
  timerChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: `${COLORS.accent}20`, paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full },
  timerUrgent: { backgroundColor: `${COLORS.danger}20` },
  timerText: { color: COLORS.accent, fontSize: FONTS.sm, fontWeight: '700' },
  timerTextUrgent: { color: COLORS.danger },
  progressTrack: { height: 4, backgroundColor: COLORS.border, marginHorizontal: 16, borderRadius: RADIUS.full, overflow: 'hidden', marginBottom: 2 },
  progressFill: { height: '100%', backgroundColor: COLORS.accent, borderRadius: RADIUS.full },
  timeTrack: { height: 3, backgroundColor: COLORS.border, marginHorizontal: 16, borderRadius: RADIUS.full, overflow: 'hidden', marginBottom: 4 },
  timeFill: { height: '100%', backgroundColor: COLORS.accent, borderRadius: RADIUS.full },
  flex: { flex: 1 },
  questionContent: { padding: 16, paddingBottom: 32 },
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
  feedbackFact: { color: COLORS.textMuted, fontSize: FONTS.sm, marginTop: 6, lineHeight: 18, fontStyle: 'italic' },
  nextBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.md },
  nextBtnText: { color: COLORS.white, fontSize: FONTS.sm, fontWeight: '700' },

  resultsContent: { padding: 24, alignItems: 'center', gap: 16 },
  scoreCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: COLORS.card, borderWidth: 4, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  scoreCircleValue: { fontSize: FONTS['3xl'], fontWeight: '800' },
  scoreCircleLabel: { color: COLORS.textMuted, fontSize: FONTS.xs },
  resultsTitle: { color: COLORS.text, fontSize: FONTS['2xl'], fontWeight: '800', textAlign: 'center' },
  resultsSummary: { flexDirection: 'row', gap: 24 },
  summaryItem: { alignItems: 'center' },
  summaryValue: { fontSize: FONTS['2xl'], fontWeight: '800' },
  summaryLabel: { color: COLORS.textMuted, fontSize: FONTS.sm },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, paddingHorizontal: 8 },
  emojiSquare: { width: 26, height: 26, borderRadius: 5 },
  emojiCorrect: { backgroundColor: COLORS.primary },
  emojiWrong: { backgroundColor: COLORS.danger },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.accent,
    backgroundColor: `${COLORS.accent}10`,
  },
  shareBtnText: { fontSize: FONTS.base, fontWeight: '700' },
  doneBtn: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: RADIUS.md },
  doneBtnText: { fontSize: FONTS.base, fontWeight: '700' },
  leaderboardBtn: { width: '100%', backgroundColor: COLORS.card, paddingVertical: 14, borderRadius: RADIUS.md, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  leaderboardBtnText: { color: COLORS.textMuted, fontSize: FONTS.base },
  dashLink: { color: COLORS.textFaint, fontSize: FONTS.sm, marginTop: 4 },
});
