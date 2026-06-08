import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { leaderboardApi, LeaderboardScope } from '../../../src/api/queries/leaderboard';
import { LeaderboardEntry } from '../../../src/types';
import { useAuthStore } from '../../../src/store/auth';
import { COLORS, FONTS, RADIUS } from '../../../constants/colors';

const TABS: { key: LeaderboardScope; label: string }[] = [
  { key: 'global', label: 'Global' },
  { key: 'country', label: 'Country' },
  { key: 'friends', label: 'Friends' },
];

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

function EntryRow({ item, myId }: { item: LeaderboardEntry; myId?: string }) {
  const isMe = item.user._id === myId;
  return (
    <View style={[styles.row, isMe && styles.rowMe]}>
      <Text style={styles.rank}>
        {MEDAL[item.rank] ?? `#${item.rank}`}
      </Text>
      <View style={styles.avatar}>
        {item.user.avatar ? (
          <Image source={{ uri: item.user.avatar }} style={styles.avatarImg} />
        ) : (
          <Ionicons name="person" size={18} color={COLORS.textMuted} />
        )}
      </View>
      <View style={styles.rowInfo}>
        <Text style={[styles.rowName, isMe && styles.rowNameMe]}>
          {item.user.name}{isMe ? ' (you)' : ''}
        </Text>
        {item.user.country && (
          <Text style={styles.rowCountry}>{item.user.country}</Text>
        )}
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.points}>{item.points.toLocaleString()}</Text>
        <Text style={styles.pointsLabel}>pts</Text>
      </View>
    </View>
  );
}

export default function LeaderboardScreen() {
  const [scope, setScope] = useState<LeaderboardScope>('global');
  const { user } = useAuthStore();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['leaderboard', scope],
    queryFn: () => leaderboardApi.get(scope),
  });

  const entries = data?.entries ?? [];
  const myRank = data?.myRank;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.heading}>Leaderboard</Text>
        {myRank && (
          <View style={styles.myRankChip}>
            <Ionicons name="trophy-outline" size={14} color={COLORS.accent} />
            <Text style={styles.myRankText}>Your rank: #{myRank}</Text>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, scope === t.key && styles.tabActive]}
            onPress={() => setScope(t.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, scope === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.user._id}
          renderItem={({ item }) => <EntryRow item={item} myId={user?._id} />}
          contentContainerStyle={styles.list}
          refreshing={isRefetching}
          onRefresh={refetch}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={48} color={COLORS.textFaint} />
              <Text style={styles.emptyText}>
                {scope === 'friends' ? 'No friends yet — invite some!' : 'No data available'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 8 },
  heading: { color: COLORS.text, fontSize: FONTS['2xl'], fontWeight: '800' },
  myRankChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${COLORS.accent}15`,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  myRankText: { color: COLORS.accent, fontSize: FONTS.sm, fontWeight: '700' },

  tabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { color: COLORS.textMuted, fontSize: FONTS.sm, fontWeight: '600' },
  tabTextActive: { color: COLORS.white },

  list: { paddingHorizontal: 16, paddingBottom: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  rowMe: { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}10` },
  rank: { width: 32, textAlign: 'center', fontSize: FONTS.md, color: COLORS.text },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: 36, height: 36 },
  rowInfo: { flex: 1 },
  rowName: { color: COLORS.text, fontSize: FONTS.sm, fontWeight: '600' },
  rowNameMe: { color: COLORS.primary },
  rowCountry: { color: COLORS.textMuted, fontSize: FONTS.xs },
  rowRight: { alignItems: 'flex-end' },
  points: { color: COLORS.accent, fontSize: FONTS.md, fontWeight: '800' },
  pointsLabel: { color: COLORS.textFaint, fontSize: FONTS.xs },

  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { color: COLORS.textMuted, fontSize: FONTS.base, textAlign: 'center' },
});
