import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/auth';
import { paymentsApi, PaymentPlan } from '../../src/api/queries/payments';
import { extractError } from '../../src/api/client';
import { COLORS, FONTS, RADIUS } from '../../constants/colors';

const PLANS = [
  {
    id: 'premium' as PaymentPlan,
    name: 'Premium',
    priceNGN: 3500,
    priceUSD: 2.99,
    period: '/month',
    color: COLORS.primary,
    features: [
      '10 questions per Quick Play (vs 5 free)',
      'Choose difficulty: Easy, Medium, or Hard',
      'Choose category: Players, History, Stats & more',
      'Streak shields — miss a day, keep your streak',
      'Country & friends leaderboard',
      'All trivia packs unlocked',
      'Detailed performance analytics',
    ],
    badge: 'Most Popular',
  },
  {
    id: 'tournament' as PaymentPlan,
    name: 'Tournament Pass',
    priceNGN: 6500,
    priceUSD: 7.99,
    period: 'one-time',
    color: COLORS.accent,
    features: [
      'Everything in Premium',
      'One-time payment — no subscription',
      'Valid for the full 2026 tournament',
      'Exclusive tournament-only challenges',
      'World Cup 2026 prediction game',
      'Special badge & achievement',
    ],
    badge: 'Best Value',
  },
];

export default function UpgradeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loadingPlan, setLoadingPlan] = useState<PaymentPlan | null>(null);

  const isNigeria = user?.country?.toLowerCase().includes('nigeria') ?? false;
  const currency = isNigeria ? 'NGN' : 'USD';

  const handleUpgrade = async (plan: PaymentPlan) => {
    setLoadingPlan(plan);
    try {
      const { paymentUrl, reference } = await paymentsApi.initiate(plan, currency);
      await Linking.openURL(paymentUrl);
      router.push(`/(app)/payments/verify?reference=${reference}`);
    } catch (err) {
      Alert.alert('Payment Error', extractError(err));
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(app)/dashboard')} style={styles.back}>
        <Ionicons name="arrow-back" size={22} color={COLORS.textMuted} />
      </TouchableOpacity>
      <View style={styles.header}>
        <Ionicons name="star" size={40} color={COLORS.accent} />
        <Text style={styles.heading}>Upgrade WorldCupIQ</Text>
        <Text style={styles.sub}>Unlock the full experience with premium features</Text>
      </View>

      {/* Current plan */}
      {user?.plan !== 'free' && (
        <View style={styles.currentPlan}>
          <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
          <Text style={styles.currentPlanText}>
            You're on the {user?.plan === 'tournament' ? 'Tournament Pass' : 'Premium'} plan
          </Text>
        </View>
      )}

      {/* Plans */}
      {PLANS.map((plan) => {
        const alreadyOwned =
          user?.plan === plan.id ||
          (user?.plan === 'tournament' && plan.id === 'premium');
        const isLoading = loadingPlan === plan.id;

        return (
          <View key={plan.id} style={[styles.planCard, { borderColor: plan.color }]}>
            <View style={styles.planHeader}>
              <View>
                <Text style={styles.planName}>{plan.name}</Text>
                <View style={styles.priceRow}>
                  <Text style={[styles.price, { color: plan.color }]}>
                    {currency === 'NGN'
                      ? `₦${plan.priceNGN.toLocaleString()}`
                      : `$${plan.priceUSD}`}
                  </Text>
                  <Text style={styles.period}>{plan.period}</Text>
                </View>
              </View>
              <View style={[styles.badge, { backgroundColor: `${plan.color}20` }]}>
                <Text style={[styles.badgeText, { color: plan.color }]}>{plan.badge}</Text>
              </View>
            </View>

            <View style={styles.featureList}>
              {plan.features.map((f, i) => (
                <View key={i} style={styles.feature}>
                  <Ionicons name="checkmark-circle-outline" size={16} color={plan.color} />
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.btn,
                { backgroundColor: plan.color },
                (alreadyOwned || isLoading) && styles.btnDisabled,
              ]}
              onPress={() => !alreadyOwned && handleUpgrade(plan.id)}
              disabled={alreadyOwned || isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.btnText}>
                {alreadyOwned ? 'Current Plan' : isLoading ? 'Opening payment...' : `Get ${plan.name}`}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}

      {/* Payment note */}
      <View style={styles.note}>
        <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.textMuted} />
        <Text style={styles.noteText}>
          Payments secured by {isNigeria ? 'Paystack' : 'Flutterwave'}. Cancel anytime.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 40 },
  back: { paddingBottom: 12 },
  header: { alignItems: 'center', marginBottom: 20, gap: 8 },
  heading: { color: COLORS.text, fontSize: FONTS['2xl'], fontWeight: '800', textAlign: 'center' },
  sub: { color: COLORS.textMuted, fontSize: FONTS.sm, textAlign: 'center' },

  currentPlan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${COLORS.primary}15`,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 16,
  },
  currentPlanText: { color: COLORS.primary, fontSize: FONTS.sm, fontWeight: '600' },

  planCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    borderWidth: 2,
    padding: 20,
    marginBottom: 16,
  },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  planName: { color: COLORS.text, fontSize: FONTS.lg, fontWeight: '800', marginBottom: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  price: { fontSize: FONTS['2xl'], fontWeight: '800' },
  period: { color: COLORS.textMuted, fontSize: FONTS.sm },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  badgeText: { fontSize: FONTS.xs, fontWeight: '700' },

  featureList: { gap: 10, marginBottom: 20 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { color: COLORS.textMuted, fontSize: FONTS.sm, flex: 1 },

  btn: { borderRadius: RADIUS.md, paddingVertical: 14, alignItems: 'center' },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: COLORS.white, fontSize: FONTS.base, fontWeight: '700' },

  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    marginTop: 8,
  },
  noteText: { color: COLORS.textFaint, fontSize: FONTS.xs },
});
