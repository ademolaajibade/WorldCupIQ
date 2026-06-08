import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../src/store/auth';
import { LoadingOverlay } from '../src/components/shared/LoadingOverlay';
import { COLORS, FONTS, RADIUS } from '../constants/colors';

const { width } = Dimensions.get('window');

const FEATURES = [
  { icon: 'football-outline' as const, title: 'Daily Challenges', desc: '10 fresh questions every day' },
  { icon: 'flash-outline' as const, title: 'Quick Play', desc: '5-question blitz anytime' },
  { icon: 'trophy-outline' as const, title: 'Leaderboard', desc: 'Compete globally & with friends' },
  { icon: 'chatbubbles-outline' as const, title: 'AI Coach', desc: 'Powered by Claude AI' },
];

export default function LandingScreen() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/(app)/dashboard');
    }
  }, [isLoading, user]);

  if (isLoading) return <LoadingOverlay message="Loading WorldCupIQ..." />;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.hero}>
        <View style={styles.logoRow}>
          <Ionicons name="football" size={40} color={COLORS.primary} />
          <Text style={styles.logoText}>WorldCupIQ</Text>
        </View>
        <Text style={styles.tagline}>The ultimate World Cup 2026{'\n'}trivia challenge</Text>
        <Text style={styles.sub}>Test your football knowledge, climb the ranks, and earn rewards.</Text>
      </View>

      {/* Feature grid */}
      <View style={styles.grid}>
        {FEATURES.map((f) => (
          <View key={f.title} style={styles.featureCard}>
            <View style={styles.iconCircle}>
              <Ionicons name={f.icon} size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.featureTitle}>{f.title}</Text>
            <Text style={styles.featureDesc}>{f.desc}</Text>
          </View>
        ))}
      </View>

      {/* CTA */}
      <View style={styles.cta}>
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={() => router.push('/(auth)/register')}
          activeOpacity={0.8}
        >
          <Text style={styles.btnPrimaryText}>Get Started — It's Free</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btnGhost}
          onPress={() => router.push('/(auth)/login')}
          activeOpacity={0.8}
        >
          <Text style={styles.btnGhostText}>I already have an account</Text>
        </TouchableOpacity>
      </View>

      {/* Badge */}
      <Text style={styles.badge}>World Cup 2026 Edition</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 32,
  },
  hero: { alignItems: 'center', marginBottom: 32 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  logoText: {
    fontSize: FONTS['3xl'],
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: FONTS.xl,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 30,
  },
  sub: {
    fontSize: FONTS.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 28,
  },
  featureCard: {
    width: (width - 52) / 2,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  featureTitle: { color: COLORS.text, fontSize: FONTS.sm, fontWeight: '700', marginBottom: 3 },
  featureDesc: { color: COLORS.textMuted, fontSize: FONTS.xs, lineHeight: 16 },

  cta: { gap: 10, marginBottom: 20 },
  btnPrimary: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  btnPrimaryText: { color: COLORS.white, fontSize: FONTS.md, fontWeight: '700' },
  btnGhost: {
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  btnGhostText: { color: COLORS.textMuted, fontSize: FONTS.base },

  badge: {
    textAlign: 'center',
    color: COLORS.textFaint,
    fontSize: FONTS.xs,
  },
});
