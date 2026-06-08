import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, FONTS, RADIUS } from '../../../constants/colors';

type BadgeVariant = 'primary' | 'accent' | 'danger' | 'muted';

interface Props {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

export function Badge({ label, variant = 'primary', style }: Props) {
  return (
    <View style={[styles.base, styles[variant], style]}>
      <Text style={[styles.text, styles[`${variant}Text`]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  primary: { backgroundColor: `${COLORS.primary}20` },
  accent: { backgroundColor: `${COLORS.accent}20` },
  danger: { backgroundColor: `${COLORS.danger}20` },
  muted: { backgroundColor: COLORS.border },

  text: { fontSize: FONTS.xs, fontWeight: '700' },
  primaryText: { color: COLORS.primary },
  accentText: { color: COLORS.accent },
  dangerText: { color: COLORS.danger },
  mutedText: { color: COLORS.textMuted },
});
