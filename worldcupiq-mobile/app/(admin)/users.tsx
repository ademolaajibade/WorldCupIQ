import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { adminApi } from '../../src/api/queries/admin';
import { AdminUser } from '../../src/types';
import { Badge } from '../../src/components/ui/Badge';
import { extractError } from '../../src/api/client';
import { COLORS, FONTS, RADIUS } from '../../constants/colors';

function UserRow({ user, onBan, onRole }: {
  user: AdminUser;
  onBan: (id: string, ban: boolean) => void;
  onRole: (id: string, role: 'user' | 'admin') => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowTop}>
        <View style={styles.rowLeft}>
          <Text style={styles.rowName}>{user.name}</Text>
          <Text style={styles.rowEmail}>{user.email}</Text>
        </View>
        <View style={styles.rowBadges}>
          <Badge
            label={user.role}
            variant={user.role === 'admin' ? 'accent' : 'muted'}
          />
          {user.isBanned && <Badge label="Banned" variant="danger" />}
        </View>
      </View>
      <View style={styles.rowStats}>
        <Text style={styles.rowStat}>{user.points.toLocaleString()} pts</Text>
        <Text style={styles.rowPlan}>{user.plan}</Text>
      </View>
      <View style={styles.rowActions}>
        <TouchableOpacity
          style={[styles.actionBtn, user.isBanned ? styles.actionBtnGreen : styles.actionBtnRed]}
          onPress={() => onBan(user._id, !user.isBanned)}
        >
          <Text style={[styles.actionBtnText, user.isBanned ? styles.actionBtnTextGreen : styles.actionBtnTextRed]}>
            {user.isBanned ? 'Unban' : 'Ban'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onRole(user._id, user.role === 'admin' ? 'user' : 'admin')}
        >
          <Text style={styles.actionBtnText}>
            {user.role === 'admin' ? 'Demote' : 'Make Admin'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function AdminUsersScreen() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-users', page, search],
    queryFn: () => adminApi.getUsers(page, search),
  });

  const banMutation = useMutation({
    mutationFn: ({ id, ban }: { id: string; ban: boolean }) =>
      ban ? adminApi.banUser(id) : adminApi.unbanUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
    onError: (err) => Alert.alert('Error', extractError(err)),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: 'user' | 'admin' }) =>
      adminApi.changeRole(id, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
    onError: (err) => Alert.alert('Error', extractError(err)),
  });

  const handleBan = (id: string, ban: boolean) => {
    Alert.alert(ban ? 'Ban User' : 'Unban User', `Are you sure?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: ban ? 'Ban' : 'Unban', style: 'destructive', onPress: () => banMutation.mutate({ id, ban }) },
    ]);
  };

  const handleRole = (id: string, role: 'user' | 'admin') => {
    Alert.alert('Change Role', `Set role to ${role}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => roleMutation.mutate({ id, role }) },
    ]);
  };

  const users = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Users</Text>
        {data && <Text style={styles.count}>{data.total} total</Text>}
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={16} color={COLORS.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email..."
          placeholderTextColor={COLORS.textFaint}
          value={search}
          onChangeText={(t) => { setSearch(t); setPage(1); }}
          selectionColor={COLORS.primary}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator color={COLORS.primary} size="large" style={styles.loading} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(u) => u._id}
          renderItem={({ item }) => (
            <UserRow user={item} onBan={handleBan} onRole={handleRole} />
          )}
          contentContainerStyle={styles.list}
          refreshing={false}
          onRefresh={refetch}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.empty}>No users found</Text>
          }
          ListFooterComponent={
            <View style={styles.pagination}>
              <TouchableOpacity
                style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
                onPress={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <Ionicons name="chevron-back" size={16} color={page === 1 ? COLORS.textFaint : COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.pageText}>{page} / {totalPages}</Text>
              <TouchableOpacity
                style={[styles.pageBtn, page >= totalPages && styles.pageBtnDisabled]}
                onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                <Ionicons name="chevron-forward" size={16} color={page >= totalPages ? COLORS.textFaint : COLORS.text} />
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 8 },
  heading: { color: COLORS.text, fontSize: FONTS['2xl'], fontWeight: '800' },
  count: { color: COLORS.textMuted, fontSize: FONTS.sm },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, color: COLORS.text, fontSize: FONTS.base, paddingVertical: 10 },

  loading: { marginTop: 40 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },

  row: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginBottom: 10,
  },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  rowLeft: { flex: 1, paddingRight: 8 },
  rowName: { color: COLORS.text, fontSize: FONTS.base, fontWeight: '700' },
  rowEmail: { color: COLORS.textMuted, fontSize: FONTS.xs },
  rowBadges: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  rowStats: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  rowStat: { color: COLORS.accent, fontSize: FONTS.sm, fontWeight: '600' },
  rowPlan: { color: COLORS.textMuted, fontSize: FONTS.sm },
  rowActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1,
    backgroundColor: COLORS.border,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  actionBtnRed: { backgroundColor: `${COLORS.danger}15` },
  actionBtnGreen: { backgroundColor: `${COLORS.primary}15` },
  actionBtnText: { color: COLORS.textMuted, fontSize: FONTS.xs, fontWeight: '700' },
  actionBtnTextRed: { color: COLORS.danger },
  actionBtnTextGreen: { color: COLORS.primary },

  empty: { color: COLORS.textMuted, textAlign: 'center', padding: 40 },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 12 },
  pageBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageBtnDisabled: { opacity: 0.4 },
  pageText: { color: COLORS.text, fontSize: FONTS.sm },
});
