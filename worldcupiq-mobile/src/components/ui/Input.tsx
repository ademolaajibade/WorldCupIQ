import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS } from '../../../constants/colors';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  secureToggle?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
}

export function Input({ label, error, secureToggle, leftIcon, style, ...rest }: Props) {
  const [hidden, setHidden] = useState(secureToggle ?? false);

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.row, error ? styles.rowError : null]}>
        {leftIcon && (
          <Ionicons name={leftIcon} size={18} color={COLORS.textMuted} style={styles.leftIcon} />
        )}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={COLORS.textFaint}
          selectionColor={COLORS.primary}
          secureTextEntry={hidden}
          autoCapitalize="none"
          {...rest}
        />
        {secureToggle && (
          <TouchableOpacity onPress={() => setHidden((h) => !h)} style={styles.eye}>
            <Ionicons
              name={hidden ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={COLORS.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 14 },
  label: { color: COLORS.textMuted, fontSize: FONTS.sm, marginBottom: 6, fontWeight: '500' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rowError: { borderColor: COLORS.danger },
  leftIcon: { paddingLeft: 12 },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: FONTS.base,
    paddingVertical: 13,
    paddingHorizontal: 12,
  },
  eye: { paddingRight: 12 },
  error: { color: COLORS.danger, fontSize: FONTS.xs, marginTop: 4 },
});
