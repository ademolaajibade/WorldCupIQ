import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
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
import { COLORS, FONTS } from '../../constants/colors';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  country: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function RegisterScreen() {
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
      const res = await authApi.register(data.name, data.email, data.password, data.country);
      await setAuth(res.user, res.accessToken, res.refreshToken);
      router.replace('/(app)/dashboard');
    } catch (err) {
      Alert.alert('Registration Failed', extractError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper scroll keyboardAvoiding>
      <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.back}>
        <Ionicons name="arrow-back" size={22} color={COLORS.textMuted} />
      </TouchableOpacity>

      <View style={styles.header}>
        <Ionicons name="football" size={36} color={COLORS.primary} />
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.sub}>Join thousands of World Cup fans</Text>
      </View>

      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Full Name"
            placeholder="Your name"
            leftIcon="person-outline"
            autoComplete="name"
            autoCapitalize="words"
            onChangeText={onChange}
            value={value}
            error={errors.name?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Email"
            placeholder="you@example.com"
            keyboardType="email-address"
            leftIcon="mail-outline"
            autoComplete="email"
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
            placeholder="Min 8 characters"
            leftIcon="lock-closed-outline"
            secureToggle
            onChangeText={onChange}
            value={value}
            error={errors.password?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="country"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Country (optional)"
            placeholder="e.g. Nigeria, USA, Brazil"
            leftIcon="flag-outline"
            autoCapitalize="words"
            onChangeText={onChange}
            value={value}
          />
        )}
      />

      <View style={styles.terms}>
        <Text style={styles.termsText}>
          By signing up you agree to our Terms of Service and Privacy Policy.
        </Text>
      </View>

      <Button label="Create Account" onPress={handleSubmit(onSubmit)} loading={loading} style={styles.btn} />

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.footerLink}>Sign in</Text>
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  back: { paddingBottom: 8 },
  header: { alignItems: 'center', marginBottom: 28, gap: 8 },
  title: { fontSize: FONTS['2xl'], fontWeight: '800', color: COLORS.text },
  sub: { fontSize: FONTS.sm, color: COLORS.textMuted },
  terms: { marginBottom: 16 },
  termsText: { color: COLORS.textFaint, fontSize: FONTS.xs, textAlign: 'center', lineHeight: 18 },
  btn: { marginBottom: 16 },
  footer: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { color: COLORS.textMuted, fontSize: FONTS.base },
  footerLink: { color: COLORS.primary, fontSize: FONTS.base, fontWeight: '700' },
});
