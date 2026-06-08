import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { adminApi } from '../../src/api/queries/admin';
import { AdminStats } from '../../src/types';
import { Card } from '../../src/components/ui/Card';
import { LoadingOverlay } from '../../src/components/shared/LoadingOverlay';
import { COLORS, FONTS, RADIUS } from '../../constants/colors';

function StatTile({
  label,
  value,
  icon,
  color,
  sub,
}: {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  sub?: string;
}) {
  return (
    <Card style={styles.tile}>
      <View style={[styles.tileIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
      {sub && <Text style={styles.tileSub}>{sub}</Text>}
    </Card>
  );
}

export default function AdminStatsScreen() {
  const router = useRouter();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminApi.getStats,
  });

  if (isLoading) return <LoadingOverlay message="Loading stats..." />;

  const stats = data as AdminStats;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.accent} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>Admin Dashboard</Text>
          <Text style={styles.sub}>Platform overview</Text>
        </View>
        <TouchableOpacity
          style={styles.appBtn}
          onPress={() => router.replace('/(app)/dashboard')}
        >
          <Ionicons name="exit-outline" size={16} color={COLORS.textMuted} />
          <Text style={styles.appBtnText}>App</Text>
        </TouchableOpacity>
      </View>

      {/* Tiles grid */}
      <View style={styles.grid}>
        <StatTile label="Total Users" value={stats.totalUsers.toLocaleString()} icon="people-outline" color={COLORS.primary} />
        <StatTile label="Active Today" value={stats.activeToday.toLocaleString()} icon="pulse-outline" color={COLORS.accent} />
        <StatTile label="Premium Users" value={stats.premiumUsers.toLocaleString()} icon="star-outline" color={COLORS.accent} />
        <StatTile label="Total Questions" value={stats.totalQuestions.toLocaleString()} icon="help-circle-outline" color={COLORS.primary} />
        <StatTile label="Games Played" value={stats.totalGamesPlayed.toLocaleString()} icon="game-controller-outline" color={COLORS.primary} />
      </View>

      {/* Revenue */}
      <Card style={styles.revenueCard}>
        <Text style={styles.revenueTitle}>Revenue</Text>
        <View style={styles.revenueRow}>
          <View style={styles.revenueItem}>
            <Text style={styles.revenueLabel}>NGN</Text>
            <Text style={styles.revenueValue}>₦{stats.revenue.NGN.toLocaleString()}</Text>
          </View>
          <View style={styles.revenueDivider} />
          <View style={styles.revenueItem}>
            <Text style={styles.revenueLabel}>USD</Text>
            <Text style={styles.revenueValue}>${stats.revenue.USD.toLocaleString()}</Text>
          </View>
        </View>
      </Card>

      {/* Quick links */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      {[
        { label: 'Manage Users', icon: 'people-outline' as const, onPress: () => {} },
        { label: 'Manage Questions', icon: 'help-circle-outline' as const, onPress: () => {} },
      ].map((a) => (
        <TouchableOpacity key={a.label} style={styles.actionRow} onPress={a.onPress} activeOpacity={0.75}>
          <Ionicons name={a.icon} size={18} color={COLORS.textMuted} />
          <Text style={styles.actionLabel}>{a.label}</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textFaint} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  heading: { color: COLORS.text, fontSize: FONTS['2xl'], fontWeight: '800' },
  sub: { color: COLORS.textMuted, fontSize: FONTS.sm },
  appBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.card, paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.md },
  appBtnText: { color: COLORS.textMuted, fontSize: FONTS.sm },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  tile: { width: '47%', alignItems: 'center', padding: 14 },
  tileIcon: { width: 42, height: 42, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  tileValue: { color: COLORS.text, fontSize: FONTS.xl, fontWeight: '800' },
  tileLabel: { color: COLORS.textMuted, fontSize: FONTS.xs, textAlign: 'center' },
  tileSub: { color: COLORS.textFaint, fontSize: FONTS.xs },

  revenueCard: { marginBottom: 20 },
  revenueTitle: { color: COLORS.text, fontSize: FONTS.base, fontWeight: '700', marginBottom: 14 },
  revenueRow: { flexDirection: 'row', alignItems: 'center' },
  revenueItem: { flex: 1, alignItems: 'center' },
  revenueLabel: { color: COLORS.textMuted, fontSize: FONTS.sm, marginBottom: 4 },
  revenueValue: { color: COLORS.accent, fontSize: FONTS['2xl'], fontWeight: '800' },
  revenueDivider: { width: 1, height: 40, backgroundColor: COLORS.border },

  sectionTitle: { color: COLORS.text, fontSize: FONTS.base, fontWeight: '700', marginBottom: 10 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 8,
  },
  actionLabel: { flex: 1, color: COLORS.text, fontSize: FONTS.base },
});
