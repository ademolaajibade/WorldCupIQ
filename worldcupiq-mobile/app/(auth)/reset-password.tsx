import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
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

const schema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    path: ['confirm'],
    message: 'Passwords do not match',
  });
type FormData = z.infer<typeof schema>;

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    if (!token) return Alert.alert('Invalid link', 'No reset token found.');
    setLoading(true);
    try {
      await authApi.resetPassword(token, data.password);
      setDone(true);
    } catch (err) {
      Alert.alert('Error', extractError(err));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <ScreenWrapper>
        <View style={styles.center}>
          <Ionicons name="checkmark-circle-outline" size={64} color={COLORS.primary} />
          <Text style={styles.title}>Password reset!</Text>
          <Text style={styles.sub}>Your password has been updated. You can now sign in.</Text>
          <Button label="Go to Login" onPress={() => router.replace('/(auth)/login')} style={styles.btn} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper scroll keyboardAvoiding>
      <View style={styles.header}>
        <Ionicons name="lock-closed-outline" size={44} color={COLORS.primary} />
        <Text style={styles.title}>Set new password</Text>
        <Text style={styles.sub}>Choose a strong password for your account.</Text>
      </View>
      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, value } }) => (
          <Input
            label="New Password"
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
        name="confirm"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Confirm Password"
            placeholder="Repeat password"
            leftIcon="lock-closed-outline"
            secureToggle
            onChangeText={onChange}
            value={value}
            error={errors.confirm?.message}
          />
        )}
      />
      <Button label="Reset Password" onPress={handleSubmit(onSubmit)} loading={loading} style={styles.btn} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginBottom: 32, gap: 10 },
  title: { fontSize: FONTS['2xl'], fontWeight: '800', color: COLORS.text, textAlign: 'center' },
  sub: { fontSize: FONTS.sm, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20 },
  btn: { marginTop: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 8 },
});
