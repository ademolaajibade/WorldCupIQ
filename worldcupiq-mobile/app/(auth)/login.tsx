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
import { useAuthStore } from '../../src/store/auth';
import { extractError } from '../../src/api/client';
import { COLORS, FONTS, RADIUS } from '../../constants/colors';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type FormData = z.infer<typeof schema>;

export default function LoginScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await authApi.login(data.email, data.password);
      await setAuth(res.user, res.accessToken, res.refreshToken);
      router.replace('/(app)/dashboard');
    } catch (err) {
      Alert.alert('Login Failed', extractError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper scroll keyboardAvoiding>
      {/* Back */}
      <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.back}>
        <Ionicons name="arrow-back" size={22} color={COLORS.textMuted} />
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="football" size={36} color={COLORS.primary} />
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.sub}>Sign in to your WorldCupIQ account</Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Email"
              placeholder="you@example.com"
              keyboardType="email-address"
              autoComplete="email"
              leftIcon="mail-outline"
              onChangeText={onChange}
              value={value}
              error={errors.email?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Password"
              placeholder="Your password"
              leftIcon="lock-closed-outline"
              secureToggle
              onChangeText={onChange}
              value={value}
              error={errors.password?.message}
            />
          )}
        />

        <TouchableOpacity
          onPress={() => router.push('/(auth)/forgot-password')}
          style={styles.forgotRow}
        >
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        <Button label="Sign In" onPress={handleSubmit(onSubmit)} loading={loading} />
      </View>

      {/* Divider */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Register link */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
          <Text style={styles.footerLink}>Sign up free</Text>
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  back: { paddingBottom: 8 },
  header: { alignItems: 'center', marginBottom: 32, gap: 8 },
  title: { fontSize: FONTS['2xl'], fontWeight: '800', color: COLORS.text },
  sub: { fontSize: FONTS.sm, color: COLORS.textMuted, textAlign: 'center' },
  form: { gap: 0 },
  forgotRow: { alignSelf: 'flex-end', marginBottom: 16, marginTop: -4 },
  forgotText: { color: COLORS.primary, fontSize: FONTS.sm },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { color: COLORS.textFaint, fontSize: FONTS.sm },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  footerText: { color: COLORS.textMuted, fontSize: FONTS.base },
  footerLink: { color: COLORS.primary, fontSize: FONTS.base, fontWeight: '700' },
});
