import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../src/components/shared/ScreenWrapper';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { authApi } from '../../src/api/queries/auth';
import { extractError } from '../../src/api/client';
import { COLORS, FONTS } from '../../constants/colors';

const schema = z.object({ email: z.string().email('Enter a valid email') });
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await authApi.forgotPassword(data.email);
      setSent(true);
    } catch (err) {
      Alert.alert('Error', extractError(err));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <ScreenWrapper>
        <View style={styles.center}>
          <Ionicons name="mail-open-outline" size={64} color={COLORS.primary} />
          <Text style={styles.title}>Check your inbox</Text>
          <Text style={styles.sub}>
            We sent a password reset link to your email. Follow the link to set a new password.
          </Text>
          <Button label="Back to Login" onPress={() => router.replace('/(auth)/login')} style={styles.btn} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper scroll keyboardAvoiding>
      <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(auth)/login')} style={styles.back}>
        <Ionicons name="arrow-back" size={22} color={COLORS.textMuted} />
      </TouchableOpacity>
      <View style={styles.header}>
        <Ionicons name="lock-open-outline" size={44} color={COLORS.primary} />
        <Text style={styles.title}>Forgot password?</Text>
        <Text style={styles.sub}>Enter your email and we'll send you a reset link.</Text>
      </View>
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Email"
            placeholder="you@example.com"
            keyboardType="email-address"
            leftIcon="mail-outline"
            onChangeText={onChange}
            value={value}
            error={errors.email?.message}
          />
        )}
      />
      <Button label="Send Reset Link" onPress={handleSubmit(onSubmit)} loading={loading} style={styles.btn} />
      <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(auth)/login')} style={styles.backLink}>
        <Text style={styles.backLinkText}>Back to login</Text>
      </TouchableOpacity>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  back: { paddingBottom: 8 },
  header: { alignItems: 'center', marginBottom: 32, gap: 10 },
  title: { fontSize: FONTS['2xl'], fontWeight: '800', color: COLORS.text, textAlign: 'center' },
  sub: { fontSize: FONTS.sm, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20 },
  btn: { marginTop: 8, marginBottom: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 8 },
  backLink: { alignItems: 'center' },
  backLinkText: { color: COLORS.textMuted, fontSize: FONTS.sm },
});
