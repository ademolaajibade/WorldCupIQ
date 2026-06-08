import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../src/store/auth';
import { analyticsApi } from '../../src/api/queries/analytics';
import { COLORS, FONTS, RADIUS } from '../../constants/colors';
import { AnalyticsData } from '../../src/types';

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#22c55e',
  medium: '#f59e0b',
  hard: '#ef4444',
};

function AccuracyBar({ label, accuracy, total, color = COLORS.primary }: {
  label: string;
  accuracy: number;
  total: number;
  color?: string;
}) {
  return (
    <View style={styles.barContainer}>
      <View style={styles.barLabel}>
        <Text style={styles.barText} numberOfLines={1}>{label}</Text>
        <Text style={styles.barValue}>{accuracy}% <Text style={styles.barTotal}>({total})</Text></Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${accuracy}%` as `${number}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function AnalyticsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isPremium = user?.plan !== 'free';

  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['analytics'],
    queryFn: analyticsApi.get,
    enabled: isPremium,
  });

  if (!isPremium) {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textMuted} />
        </TouchableOpacity>
        <View style={styles.lockedContainer}>
          <Ionicons name="lock-closed" size={48} color={COLORS.textFaint} style={{ marginBottom: 16 }} />
          <Text style={styles.lockedTitle}>Performance Analytics</Text>
          <Text style={styles.lockedSub}>
            Unlock detailed accuracy breakdowns, trend charts, and session history with a Premium plan.
          </Text>
          <TouchableOpacity
            style={styles.upgradeBtn}
            onPress={() => router.push('/(app)/upgrade')}
          >
            <Ionicons name="flash" size={16} color={COLORS.background} />
            <Text style={styles.upgradeBtnText}>Upgrade to Premium</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const summary = data?.summary;
  const accuracy = summary?.questionsAnswered
    ? Math.round((summary.correctAnswers / summary.questionsAnswered) * 100)
    : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Ionicons name="arrow-back" size={22} color={COLORS.textMuted} />
      </TouchableOpacity>
      <Text style={styles.heading}>Performance Analytics</Text>
      <Text style={styles.sub}>Your detailed WorldCupIQ stats</Text>

      {/* Summary stats */}
      <View style={styles.statRow}>
        <StatBox label="Accuracy" value={`${accuracy}%`} />
        <StatBox label="Games" value={summary?.gamesPlayed ?? 0} />
        <StatBox label="Best Streak" value={`${summary?.longestStreak ?? 0}d`} />
        <StatBox label="Avg Time" value={data?.avgAnswerMs ? `${(data.avgAnswerMs / 1000).toFixed(1)}s` : '—'} />
      </View>

      {/* By Category */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accuracy by Category</Text>
        {isLoading ? (
          <Text style={styles.loading}>Loading...</Text>
        ) : data?.byCategory?.length ? (
          data.byCategory.map((item) => (
            <AccuracyBar
              key={item.category}
              label={item.category}
              accuracy={item.accuracy}
              total={item.total}
            />
          ))
        ) : (
          <Text style={styles.empty}>Play more games to unlock category stats.</Text>
        )}
      </View>

      {/* By Difficulty */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accuracy by Difficulty</Text>
        {isLoading ? (
          <Text style={styles.loading}>Loading...</Text>
        ) : data?.byDifficulty?.length ? (
          [...data.byDifficulty]
            .sort((a, b) => {
              const order = ['easy', 'medium', 'hard'];
              return order.indexOf(a.difficulty) - order.indexOf(b.difficulty);
            })
            .map((item) => (
              <AccuracyBar
                key={item.difficulty}
                label={item.difficulty}
                accuracy={item.accuracy}
                total={item.total}
                color={DIFFICULTY_COLORS[item.difficulty] ?? COLORS.primary}
              />
            ))
        ) : (
          <Text style={styles.empty}>Play more games to see difficulty stats.</Text>
        )}
      </View>

      {/* Score Trend */}
      {!isLoading && data?.dailyTrend?.length ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Score Trend — Last 14 Days</Text>
          <View style={styles.trendContainer}>
            {(() => {
              const maxScore = Math.max(...data.dailyTrend.map((t) => t.score), 1);
              return data.dailyTrend.map((t) => (
                <View key={t.date} style={styles.trendBar}>
                  <View
                    style={[
                      styles.trendFill,
                      {
                        height: `${Math.max((t.score / maxScore) * 100, 5)}%` as `${number}%`,
                      },
                    ]}
                  />
                  <Text style={styles.trendDate}>{t.date.slice(5)}</Text>
                </View>
              ));
            })()}
          </View>
        </View>
      ) : null}

      {/* Recent Sessions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Sessions</Text>
        {isLoading ? (
          <Text style={styles.loading}>Loading...</Text>
        ) : data?.recentSessions?.length ? (
          data.recentSessions.map((s, i) => {
            const sessionAccuracy = s.total ? Math.round((s.correct / s.total) * 100) : 0;
            const typeColor =
              s.type === 'daily'
                ? COLORS.primary
                : s.type === 'challenge'
                ? COLORS.accent
                : COLORS.textMuted;
            const typeLabel =
              s.type === 'daily' ? 'Daily' : s.type === 'challenge' ? 'Tournament' : 'Quick';
            return (
              <View key={i} style={styles.sessionRow}>
                <View style={[styles.sessionBadge, { backgroundColor: `${typeColor}25` }]}>
                  <Text style={[styles.sessionBadgeText, { color: typeColor }]}>{typeLabel}</Text>
                </View>
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionScore}>
                    {s.correct}/{s.total} correct · {s.score} pts
                  </Text>
                  <Text style={styles.sessionDate}>
                    {new Date(s.completedAt).toLocaleDateString()}
                    {s.timeSpentMs ? ` · ${Math.round(s.timeSpentMs / 1000)}s` : ''}
                  </Text>
                </View>
                <Text style={[styles.sessionAcc, { color: sessionAccuracy >= 70 ? COLORS.primary : COLORS.textMuted }]}>
                  {sessionAccuracy}%
                </Text>
              </View>
            );
          })
        ) : (
          <Text style={styles.empty}>No completed sessions yet.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 40 },
  back: { paddingBottom: 12 },
  heading: { color: COLORS.text, fontSize: FONTS['2xl'], fontWeight: '800', marginBottom: 4 },
  sub: { color: COLORS.textMuted, fontSize: FONTS.sm, marginBottom: 20 },

  statRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: { color: COLORS.text, fontSize: FONTS.lg, fontWeight: '800' },
  statLabel: { color: COLORS.textFaint, fontSize: FONTS.xs, marginTop: 2, textAlign: 'center' },

  section: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: FONTS.base,
    fontWeight: '700',
    marginBottom: 14,
  },
  loading: { color: COLORS.textMuted, fontSize: FONTS.sm },
  empty: { color: COLORS.textFaint, fontSize: FONTS.sm },

  barContainer: { marginBottom: 12 },
  barLabel: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  barText: { color: COLORS.textMuted, fontSize: FONTS.sm, textTransform: 'capitalize', flex: 1 },
  barValue: { color: COLORS.text, fontSize: FONTS.sm, fontWeight: '600' },
  barTotal: { color: COLORS.textFaint, fontWeight: '400' },
  barTrack: { height: 6, backgroundColor: COLORS.background, borderRadius: RADIUS.full },
  barFill: { height: 6, borderRadius: RADIUS.full },

  trendContainer: { flexDirection: 'row', alignItems: 'flex-end', height: 80, gap: 3 },
  trendBar: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  trendFill: { width: '100%', backgroundColor: `${COLORS.primary}80`, borderRadius: 3 },
  trendDate: { color: COLORS.textFaint, fontSize: 8, marginTop: 2, textAlign: 'center' },

  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sessionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  sessionBadgeText: { fontSize: FONTS.xs, fontWeight: '700' },
  sessionInfo: { flex: 1 },
  sessionScore: { color: COLORS.text, fontSize: FONTS.sm, fontWeight: '600' },
  sessionDate: { color: COLORS.textFaint, fontSize: FONTS.xs },
  sessionAcc: { fontSize: FONTS.sm, fontWeight: '700' },

  lockedContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  lockedTitle: { color: COLORS.text, fontSize: FONTS.xl, fontWeight: '800', marginBottom: 10, textAlign: 'center' },
  lockedSub: { color: COLORS.textMuted, fontSize: FONTS.sm, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.md,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  upgradeBtnText: { color: COLORS.background, fontSize: FONTS.base, fontWeight: '700' },
});
