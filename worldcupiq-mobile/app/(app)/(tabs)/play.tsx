import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { triviaApi } from '../../../src/api/queries/trivia';
import { useAuthStore } from '../../../src/store/auth';
import { COLORS, FONTS, RADIUS } from '../../../constants/colors';

export default function PlayScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isPremium = user?.plan !== 'free';
  const isTournamentPass = user?.plan === 'tournament';

  const { data: dailyStatus } = useQuery({
    queryKey: ['daily-status'],
    queryFn: triviaApi.getDailyStatus,
  });

  const dailyDone = dailyStatus?.completed ?? false;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
    <ScrollView style={styles.flex} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.heading}>Play</Text>
      <Text style={styles.sub}>Choose your game mode</Text>

      {/* Daily Challenge */}
      <TouchableOpacity
        style={[styles.modeCard, dailyDone && styles.modeCardDone]}
        onPress={() => {
          if (dailyDone) {
            Alert.alert("Already done!", "You've completed today's daily challenge. Come back tomorrow!");
          } else {
            router.push('/(app)/daily');
          }
        }}
        activeOpacity={0.8}
      >
        <View style={[styles.modeIcon, { backgroundColor: `${COLORS.primary}20` }]}>
          <Ionicons name="calendar-outline" size={32} color={COLORS.primary} />
        </View>
        <View style={styles.modeInfo}>
          <View style={styles.modeRow}>
            <Text style={styles.modeTitle}>Daily Challenge</Text>
            {dailyDone && (
              <View style={styles.doneChip}>
                <Ionicons name="checkmark" size={12} color={COLORS.primary} />
                <Text style={styles.doneText}>Done</Text>
              </View>
            )}
          </View>
          <Text style={styles.modeSub}>5 questions · Resets at midnight</Text>
          <View style={styles.detailRow}>
            <View style={styles.detail}>
              <Ionicons name="star-outline" size={14} color={COLORS.accent} />
              <Text style={styles.detailText}>Up to 100 pts</Text>
            </View>
            <View style={styles.detail}>
              <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.detailText}>~5 min</Text>
            </View>
          </View>
        </View>
        {!dailyDone && <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />}
      </TouchableOpacity>

      {/* Quick Play */}
      <TouchableOpacity
        style={[styles.modeCard, { borderLeftColor: COLORS.accent }]}
        onPress={() => router.push('/(app)/quick')}
        activeOpacity={0.8}
      >
        <View style={[styles.modeIcon, { backgroundColor: `${COLORS.accent}20` }]}>
          <Ionicons name="flash-outline" size={32} color={COLORS.accent} />
        </View>
        <View style={styles.modeInfo}>
          <Text style={styles.modeTitle}>Quick Play</Text>
          <Text style={styles.modeSub}>
            {isPremium ? '10 questions · Choose difficulty & category' : '5 questions · Play anytime'}
          </Text>
          <View style={styles.detailRow}>
            <View style={styles.detail}>
              <Ionicons name="star-outline" size={14} color={COLORS.accent} />
              <Text style={styles.detailText}>{isPremium ? 'Up to 300 pts' : 'Up to 50 pts'}</Text>
            </View>
            <View style={styles.detail}>
              <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.detailText}>{isPremium ? '~4 min' : '~2 min'}</Text>
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
      </TouchableOpacity>

      {/* Tournament Challenges */}
      {isTournamentPass && (
        <TouchableOpacity
          style={[styles.modeCard, { borderLeftColor: '#f59e0b' }]}
          onPress={() => router.push('/(app)/tournament')}
          activeOpacity={0.8}
        >
          <View style={[styles.modeIcon, { backgroundColor: '#f59e0b20' }]}>
            <Ionicons name="trophy-outline" size={32} color={COLORS.accent} />
          </View>
          <View style={styles.modeInfo}>
            <View style={styles.modeRow}>
              <Text style={styles.modeTitle}>Tournament Challenges</Text>
              <View style={[styles.doneChip, { backgroundColor: `${COLORS.accent}20` }]}>
                <Text style={[styles.doneText, { color: COLORS.accent }]}>Pass</Text>
              </View>
            </View>
            <Text style={styles.modeSub}>5 exclusive 2026 WC challenges</Text>
            <View style={styles.detailRow}>
              <View style={styles.detail}>
                <Ionicons name="medal-outline" size={14} color={COLORS.accent} />
                <Text style={styles.detailText}>Special badges</Text>
              </View>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
      )}

      {/* Analytics shortcut for premium */}
      {isPremium && (
        <TouchableOpacity
          style={[styles.modeCard, { borderLeftColor: COLORS.primary }]}
          onPress={() => router.push('/(app)/analytics')}
          activeOpacity={0.8}
        >
          <View style={[styles.modeIcon, { backgroundColor: `${COLORS.primary}20` }]}>
            <Ionicons name="analytics-outline" size={32} color={COLORS.primary} />
          </View>
          <View style={styles.modeInfo}>
            <Text style={styles.modeTitle}>Performance Analytics</Text>
            <Text style={styles.modeSub}>Accuracy by category, difficulty & trend</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
      )}

      {/* Tips */}
      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>How to earn more points</Text>
        {[
          'Answer correctly for full points',
          'Faster answers earn bonus multipliers',
          'Keep your daily streak alive',
          'Harder questions = more points',
        ].map((tip, i) => (
          <View key={i} style={styles.tip}>
            <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.primary} />
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  heading: { color: COLORS.text, fontSize: FONTS['2xl'], fontWeight: '800', marginBottom: 4 },
  sub: { color: COLORS.textMuted, fontSize: FONTS.sm, marginBottom: 20 },

  modeCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  modeCardDone: { opacity: 0.6 },
  modeIcon: { width: 56, height: 56, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  modeInfo: { flex: 1 },
  modeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  modeTitle: { color: COLORS.text, fontSize: FONTS.md, fontWeight: '700' },
  modeSub: { color: COLORS.textMuted, fontSize: FONTS.sm, marginBottom: 8 },
  doneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: `${COLORS.primary}20`,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  doneText: { color: COLORS.primary, fontSize: FONTS.xs, fontWeight: '700' },
  detailRow: { flexDirection: 'row', gap: 14 },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { color: COLORS.textMuted, fontSize: FONTS.xs },

  tipsCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginTop: 8,
  },
  tipsTitle: { color: COLORS.text, fontSize: FONTS.base, fontWeight: '700', marginBottom: 12 },
  tip: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  tipText: { color: COLORS.textMuted, fontSize: FONTS.sm, flex: 1 },
});
