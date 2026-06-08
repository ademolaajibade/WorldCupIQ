import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../src/store/auth';
import { triviaApi } from '../../../src/api/queries/trivia';
import { authApi } from '../../../src/api/queries/auth';
import { Card } from '../../../src/components/ui/Card';
import { Badge } from '../../../src/components/ui/Badge';
import { COLORS, FONTS, RADIUS } from '../../../constants/colors';

type StatCardProps = { label: string; value: string | number; icon: keyof typeof Ionicons.glyphMap; color: string };

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <Card style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const { data: dailyStatus, refetch: refetchDaily, isRefetching } = useQuery({
    queryKey: ['daily-status'],
    queryFn: triviaApi.getDailyStatus,
  });

  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ['me'],
    queryFn: authApi.getMe,
  });

  const currentUser = profile ?? user;
  if (!currentUser) return null;
  const dailyDone = dailyStatus?.completed ?? false;
  const greeting = getGreeting();

  function onRefresh() {
    refetchDaily();
    refetchProfile();
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={COLORS.primary} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting}</Text>
          <TouchableOpacity
            style={styles.nameRow}
            onPress={() => router.push('/(app)/(tabs)/profile')}
            activeOpacity={0.7}
          >
            <Text style={styles.name}>{currentUser.name ?? ''}</Text>
            <Ionicons name="pencil-outline" size={14} color={COLORS.textMuted} style={styles.nameEditIcon} />
          </TouchableOpacity>
        </View>
        <View style={styles.streakBadge}>
          <Ionicons name="flame" size={16} color={COLORS.accent} />
          <Text style={styles.streakText}>{currentUser.streak ?? 0} day streak</Text>
        </View>
      </View>

      {/* Plan badge */}
      {currentUser.plan !== 'free' && (
        <Badge
          label={currentUser.plan === 'tournament' ? 'Tournament Pass' : 'Premium'}
          variant={currentUser.plan === 'tournament' ? 'accent' : 'primary'}
          style={styles.planBadge}
        />
      )}

      {/* Stats row */}
      <View style={styles.statsRow}>
        <StatCard
          label="Total Points"
          value={(currentUser.points ?? 0).toLocaleString()}
          icon="star-outline"
          color={COLORS.accent}
        />
        <StatCard
          label="Games Played"
          value={currentUser.totalGames ?? 0}
          icon="game-controller-outline"
          color={COLORS.primary}
        />
        <StatCard
          label="Best Streak"
          value={currentUser.longestStreak ?? 0}
          icon="flame-outline"
          color={COLORS.danger}
        />
      </View>

      {/* Daily challenge CTA */}
      <TouchableOpacity
        style={[styles.dailyCard, dailyDone && styles.dailyDone]}
        onPress={() => !dailyDone && router.push('/(app)/daily')}
        activeOpacity={dailyDone ? 1 : 0.8}
      >
        <View style={styles.dailyLeft}>
          <Text style={styles.dailyTitle}>
            {dailyDone ? 'Daily Challenge Complete!' : "Today's Challenge"}
          </Text>
          <Text style={styles.dailySub}>
            {dailyDone
              ? `You scored ${dailyStatus?.score ?? 0} points today`
              : '5 questions · Daily points'}
          </Text>
          {!dailyDone && (
            <View style={styles.startRow}>
              <Text style={styles.startText}>Start now</Text>
              <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
            </View>
          )}
        </View>
        <Ionicons
          name={dailyDone ? 'checkmark-circle' : 'football-outline'}
          size={44}
          color={dailyDone ? COLORS.primary : COLORS.textFaint}
        />
      </TouchableOpacity>

      {/* Quick play */}
      <TouchableOpacity
        style={styles.quickCard}
        onPress={() => router.push('/(app)/quick')}
        activeOpacity={0.8}
      >
        <View style={styles.dailyLeft}>
          <Text style={styles.quickTitle}>Quick Play</Text>
          <Text style={styles.dailySub}>5 questions · Play anytime</Text>
        </View>
        <Ionicons name="flash" size={32} color={COLORS.accent} />
      </TouchableOpacity>

      {/* Upgrade prompt for free users */}
      {currentUser.plan === 'free' && (
        <TouchableOpacity
          style={styles.upgradeCard}
          onPress={() => router.push('/(app)/upgrade')}
          activeOpacity={0.8}
        >
          <Ionicons name="star" size={20} color={COLORS.accent} />
          <View style={styles.upgradeText}>
            <Text style={styles.upgradeTitle}>Unlock Premium</Text>
            <Text style={styles.upgradeSub}>All trivia packs + exclusive content</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      )}

      {/* Achievements preview */}
      {(currentUser.achievements ?? []).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Achievements</Text>
          <View style={styles.achievementsRow}>
            {(currentUser.achievements ?? []).slice(0, 4).map((a, i) => (
              <View key={i} style={styles.achievementChip}>
                <Ionicons name="ribbon-outline" size={14} color={COLORS.accent} />
                <Text style={styles.achievementText}>{a}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
    </SafeAreaView>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning,';
  if (h < 17) return 'Good afternoon,';
  return 'Good evening,';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  greeting: { color: COLORS.textMuted, fontSize: FONTS.sm },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { color: COLORS.text, fontSize: FONTS.xl, fontWeight: '800' },
  nameEditIcon: { marginTop: 2 },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${COLORS.accent}15`,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  streakText: { color: COLORS.accent, fontSize: FONTS.sm, fontWeight: '700' },
  planBadge: { marginBottom: 12 },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statCard: { flex: 1, alignItems: 'center', padding: 12 },
  statIcon: { width: 36, height: 36, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  statValue: { color: COLORS.text, fontSize: FONTS.lg, fontWeight: '800' },
  statLabel: { color: COLORS.textMuted, fontSize: FONTS.xs, textAlign: 'center' },

  dailyCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  dailyDone: { borderLeftColor: COLORS.textFaint, opacity: 0.75 },
  dailyLeft: { flex: 1, paddingRight: 12 },
  dailyTitle: { color: COLORS.text, fontSize: FONTS.md, fontWeight: '700', marginBottom: 3 },
  dailySub: { color: COLORS.textMuted, fontSize: FONTS.sm },
  startRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  startText: { color: COLORS.primary, fontSize: FONTS.sm, fontWeight: '700' },

  quickCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
  },
  quickTitle: { color: COLORS.text, fontSize: FONTS.md, fontWeight: '700', marginBottom: 3 },

  upgradeCard: {
    backgroundColor: `${COLORS.accent}10`,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: `${COLORS.accent}30`,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  upgradeText: { flex: 1 },
  upgradeTitle: { color: COLORS.accent, fontSize: FONTS.base, fontWeight: '700' },
  upgradeSub: { color: COLORS.textMuted, fontSize: FONTS.xs },

  section: { marginBottom: 16 },
  sectionTitle: { color: COLORS.text, fontSize: FONTS.base, fontWeight: '700', marginBottom: 10 },
  achievementsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  achievementChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${COLORS.accent}15`,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  achievementText: { color: COLORS.accent, fontSize: FONTS.xs, fontWeight: '600' },
});
