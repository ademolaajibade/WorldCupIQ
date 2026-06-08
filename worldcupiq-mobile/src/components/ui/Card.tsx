import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, RADIUS } from '../../../constants/colors';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  alt?: boolean;
}

export function Card({ children, style, alt = false }: Props) {
  return (
    <View style={[styles.card, alt && styles.alt, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  alt: {
    backgroundColor: COLORS.cardAlt,
  },
});
