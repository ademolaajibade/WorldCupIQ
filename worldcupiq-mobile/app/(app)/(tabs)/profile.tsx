import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { authApi } from '../../../src/api/queries/auth';
import { useAuthStore } from '../../../src/store/auth';
import { extractError } from '../../../src/api/client';
import { Badge } from '../../../src/components/ui/Badge';
import { COLORS, FONTS, RADIUS } from '../../../constants/colors';

export default function ProfileScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { user: storeUser, updateUser, clearAuth } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(storeUser?.name ?? '');
  const [country, setCountry] = useState(storeUser?.country ?? '');

  const { data: user = storeUser! } = useQuery({
    queryKey: ['me'],
    queryFn: authApi.getMe,
  });

  const updateMutation = useMutation({
    mutationFn: () => authApi.updateProfile({ name: name.trim(), country: country.trim() || undefined }),
    onSuccess: (updated) => {
      updateUser(updated);
      qc.setQueryData(['me'], updated);
      setEditing(false);
    },
    onError: (err) => Alert.alert('Error', extractError(err)),
  });

  const handlePickAvatar = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (res.canceled || !res.assets[0]) return;

    const asset = res.assets[0];
    const fd = new FormData();
    fd.append('avatar', { uri: asset.uri, name: 'avatar.jpg', type: 'image/jpeg' } as any);

    try {
      const { avatarUrl } = await authApi.uploadAvatar(fd);
      const updated = { ...user, avatar: avatarUrl };
      updateUser(updated as any);
      qc.setQueryData(['me'], updated);
    } catch (err) {
      Alert.alert('Upload failed', extractError(err));
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await authApi.logout().catch(() => {});
          await clearAuth();
          router.replace('/');
        },
      },
    ]);
  };

  const accuracy =
    user.questionsAnswered > 0
      ? Math.round((user.correctAnswers / user.questionsAnswered) * 100)
      : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
    <ScrollView style={styles.flex} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Avatar + Name */}
      <View style={styles.avatarSection}>
        <TouchableOpacity onPress={handlePickAvatar} style={styles.avatarWrap}>
          {user.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>{user.name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.editAvatarBtn}>
            <Ionicons name="camera-outline" size={14} color={COLORS.white} />
          </View>
        </TouchableOpacity>
        <Text style={styles.nameText}>{user.name}</Text>
        <Text style={styles.emailText}>{user.email}</Text>
        <View style={styles.badgeRow}>
          <Badge
            label={user.plan === 'free' ? 'Free' : user.plan === 'premium' ? 'Premium' : 'Tournament Pass'}
            variant={user.plan === 'free' ? 'muted' : user.plan === 'premium' ? 'primary' : 'accent'}
          />
          {user.country && <Badge label={user.country} variant="muted" />}
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsGrid}>
        {[
          { label: 'Points', value: user.points.toLocaleString(), icon: 'star-outline', color: COLORS.accent },
          { label: 'Games', value: user.totalGames, icon: 'game-controller-outline', color: COLORS.primary },
          { label: 'Accuracy', value: `${accuracy}%`, icon: 'analytics-outline', color: COLORS.primary },
          { label: 'Best Streak', value: user.longestStreak, icon: 'flame-outline', color: COLORS.danger },
        ].map((s) => (
          <View key={s.label} style={styles.statItem}>
            <Ionicons name={s.icon as any} size={20} color={s.color} style={styles.statItemIcon} />
            <Text style={styles.statItemValue}>{s.value}</Text>
            <Text style={styles.statItemLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Edit profile */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Profile Details</Text>
          <TouchableOpacity onPress={() => setEditing((e) => !e)}>
            <Ionicons name={editing ? 'close-outline' : 'pencil-outline'} size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        {editing ? (
          <View style={styles.editForm}>
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput
                style={styles.fieldInput}
                value={name}
                onChangeText={setName}
                placeholderTextColor={COLORS.textFaint}
                selectionColor={COLORS.primary}
              />
            </View>
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Country (2-letter code)</Text>
              <TextInput
                style={styles.fieldInput}
                value={country}
                onChangeText={(v) => setCountry(v.toUpperCase())}
                placeholder="e.g. NG, US, BR"
                placeholderTextColor={COLORS.textFaint}
                selectionColor={COLORS.primary}
                autoCapitalize="characters"
                maxLength={2}
              />
            </View>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
              activeOpacity={0.8}
            >
              <Text style={styles.saveBtnText}>
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.fieldList}>
            <View style={styles.field}>
              <Ionicons name="person-outline" size={16} color={COLORS.textMuted} />
              <Text style={styles.fieldValue}>{user.name}</Text>
            </View>
            <View style={styles.field}>
              <Ionicons name="mail-outline" size={16} color={COLORS.textMuted} />
              <Text style={styles.fieldValue}>{user.email}</Text>
            </View>
            {user.country && (
              <View style={styles.field}>
                <Ionicons name="flag-outline" size={16} color={COLORS.textMuted} />
                <Text style={styles.fieldValue}>{user.country}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Achievements */}
      {user.achievements.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <View style={styles.achievementWrap}>
            {user.achievements.map((a, i) => (
              <View key={i} style={styles.achievement}>
                <Ionicons name="ribbon" size={16} color={COLORS.accent} />
                <Text style={styles.achievementText}>{a}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {user.plan === 'free' && (
          <TouchableOpacity style={styles.upgradeBtn} onPress={() => router.push('/(app)/upgrade')}>
            <Ionicons name="star-outline" size={18} color={COLORS.accent} />
            <Text style={styles.upgradeBtnText}>Upgrade to Premium</Text>
          </TouchableOpacity>
        )}
        {(user.plan === 'premium' || user.plan === 'tournament') && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(app)/analytics')}>
            <Ionicons name="analytics-outline" size={18} color={COLORS.primary} />
            <Text style={[styles.actionBtnText, { color: COLORS.primary }]}>View Analytics</Text>
          </TouchableOpacity>
        )}
        {user.plan === 'tournament' && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(app)/tournament')}>
            <Ionicons name="trophy-outline" size={18} color={COLORS.accent} />
            <Text style={[styles.actionBtnText, { color: COLORS.accent }]}>Tournament Challenges</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.danger} />
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },

  avatarSection: { alignItems: 'center', marginBottom: 24, paddingTop: 8 },
  avatarWrap: { position: 'relative', marginBottom: 12 },
  avatar: { width: 90, height: 90, borderRadius: RADIUS.full },
  avatarFallback: {
    width: 90,
    height: 90,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { color: COLORS.white, fontSize: FONTS['2xl'], fontWeight: '800' },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  nameText: { color: COLORS.text, fontSize: FONTS.xl, fontWeight: '800', marginBottom: 2 },
  emailText: { color: COLORS.textMuted, fontSize: FONTS.sm, marginBottom: 10 },
  badgeRow: { flexDirection: 'row', gap: 8 },

  statsGrid: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
    overflow: 'hidden',
  },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRightWidth: 1, borderRightColor: COLORS.border },
  statItemIcon: { marginBottom: 4 },
  statItemValue: { color: COLORS.text, fontSize: FONTS.md, fontWeight: '800' },
  statItemLabel: { color: COLORS.textMuted, fontSize: FONTS.xs },

  section: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 14,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { color: COLORS.text, fontSize: FONTS.base, fontWeight: '700' },

  fieldList: { gap: 12 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  fieldValue: { color: COLORS.textMuted, fontSize: FONTS.sm },

  editForm: { gap: 12 },
  fieldWrap: { gap: 4 },
  fieldLabel: { color: COLORS.textMuted, fontSize: FONTS.xs, fontWeight: '600' },
  fieldInput: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
    fontSize: FONTS.base,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: { color: COLORS.white, fontSize: FONTS.base, fontWeight: '700' },

  achievementWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  achievement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: `${COLORS.accent}15`,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  achievementText: { color: COLORS.accent, fontSize: FONTS.xs, fontWeight: '600' },

  actions: { gap: 10, marginTop: 4 },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: `${COLORS.accent}15`,
    borderRadius: RADIUS.md,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: `${COLORS.accent}40`,
  },
  upgradeBtnText: { color: COLORS.accent, fontSize: FONTS.base, fontWeight: '700' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionBtnText: { fontSize: FONTS.base, fontWeight: '700' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: `${COLORS.danger}10`,
    borderRadius: RADIUS.md,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: `${COLORS.danger}30`,
  },
  logoutBtnText: { color: COLORS.danger, fontSize: FONTS.base, fontWeight: '700' },
});
