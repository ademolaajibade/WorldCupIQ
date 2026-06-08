import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { paymentsApi } from '../../../src/api/queries/payments';
import { authApi } from '../../../src/api/queries/auth';
import { useAuthStore } from '../../../src/store/auth';
import { Button } from '../../../src/components/ui/Button';
import { COLORS, FONTS } from '../../../constants/colors';

type Status = 'verifying' | 'success' | 'failed';

export default function PaymentVerifyScreen() {
  const router = useRouter();
  const { reference } = useLocalSearchParams<{ reference: string }>();
  const { updateUser } = useAuthStore();
  const qc = useQueryClient();
  const [status, setStatus] = useState<Status>('verifying');
  const [plan, setPlan] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!reference) {
      setStatus('failed');
      setMessage('No payment reference found.');
      return;
    }

    paymentsApi
      .verify(reference)
      .then(async (res) => {
        if (res.success) {
          setPlan(res.plan);
          setStatus('success');
          // Refresh user data to reflect new plan
          try {
            const updated = await authApi.getMe();
            updateUser(updated);
            qc.setQueryData(['me'], updated);
          } catch {}
        } else {
          setStatus('failed');
          setMessage(res.message || 'Payment could not be verified.');
        }
      })
      .catch(() => {
        setStatus('failed');
        setMessage('Verification failed. Please contact support if payment was deducted.');
      });
  }, [reference]);

  if (status === 'verifying') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.title}>Verifying payment...</Text>
        <Text style={styles.sub}>Please wait, do not close this screen.</Text>
      </View>
    );
  }

  if (status === 'success') {
    return (
      <View style={styles.center}>
        <Ionicons name="checkmark-circle" size={80} color={COLORS.primary} />
        <Text style={styles.title}>Payment Successful!</Text>
        <Text style={styles.sub}>
          Your {plan === 'tournament' ? 'Tournament Pass' : 'Premium'} plan is now active.
          Enjoy unlimited features!
        </Text>
        <Button label="Go to Dashboard" onPress={() => router.replace('/(app)/dashboard')} style={styles.btn} />
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <Ionicons name="close-circle" size={80} color={COLORS.danger} />
      <Text style={styles.title}>Payment Failed</Text>
      <Text style={styles.sub}>{message}</Text>
      <Button
        label="Try Again"
        onPress={() => router.replace('/(app)/upgrade')}
        style={styles.btn}
      />
      <Button
        label="Back to Dashboard"
        onPress={() => router.replace('/(app)/dashboard')}
        variant="ghost"
        style={styles.btn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 28,
  },
  title: { color: COLORS.text, fontSize: FONTS['2xl'], fontWeight: '800', textAlign: 'center' },
  sub: { color: COLORS.textMuted, fontSize: FONTS.base, textAlign: 'center', lineHeight: 22 },
  btn: { width: '100%' },
});
