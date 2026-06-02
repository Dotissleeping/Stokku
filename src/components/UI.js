import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import { DarkColors, LightColors, Radius, Shadow, Spacing } from '../utils/theme';

export const useColors = () => {
  const { isDark } = useTheme();
  return isDark ? DarkColors : LightColors;
};

// ─── Button ──────────────────────────────────────────────────────────────────

export const Button = ({
  title, onPress, variant = 'primary', size = 'md',
  disabled = false, loading = false, icon, style,
}) => {
  const Colors = useColors();
  const variantStyles = {
    primary: { bg: Colors.primary, text: Colors.textInverse },
    secondary: { bg: Colors.primaryLight, text: Colors.primary },
    danger: { bg: Colors.danger, text: Colors.textInverse },
    ghost: { bg: 'transparent', text: Colors.primary },
    success: { bg: Colors.success, text: Colors.textInverse },
  };
  const sizeStyles = {
    sm: { paddingVertical: 8, paddingHorizontal: 14, fontSize: 13 },
    md: { paddingVertical: 12, paddingHorizontal: 20, fontSize: 15 },
    lg: { paddingVertical: 16, paddingHorizontal: 28, fontSize: 16 },
  };
  const v = variantStyles[variant] || variantStyles.primary;
  const s = sizeStyles[size] || sizeStyles.md;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.button,
        { backgroundColor: v.bg, paddingVertical: s.paddingVertical, paddingHorizontal: s.paddingHorizontal },
        variant === 'ghost' && styles.buttonGhost,
        (disabled || loading) && styles.buttonDisabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <View style={styles.buttonInner}>
          {icon && <Text style={styles.buttonIcon}>{icon}</Text>}
          <Text style={[styles.buttonText, { color: v.text, fontSize: s.fontSize }]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// ─── Card ─────────────────────────────────────────────────────────────────────

export const Card = ({ children, style, onPress }) => {
  const Colors = useColors();
  const cardStyle = [{ backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, ...Shadow.sm }, style];
  if (onPress) {
    return <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={cardStyle}>{children}</TouchableOpacity>;
  }
  return <View style={cardStyle}>{children}</View>;
};

// ─── Input ────────────────────────────────────────────────────────────────────

export const Input = ({
  label, value, onChangeText, placeholder, keyboardType,
  multiline, numberOfLines, style, error, returnKeyType,
  onSubmitEditing, autoFocus,
}) => {
  const Colors = useColors();
  return (
    <View style={[styles.inputWrapper, style]}>
      {label && <Text style={[styles.inputLabel, { color: Colors.textSecondary }]}>{label}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        autoFocus={autoFocus}
        style={[
          styles.input,
          {
            backgroundColor: Colors.surfaceAlt,
            color: Colors.textPrimary,
            borderColor: error ? Colors.danger : Colors.border,
          },
          multiline && styles.inputMultiline,
        ]}
      />
      {error && <Text style={[styles.inputErrorText, { color: Colors.danger }]}>{error}</Text>}
    </View>
  );
};

// ─── EmptyState ───────────────────────────────────────────────────────────────

export const EmptyState = ({ icon, title, subtitle, action }) => {
  const Colors = useColors();
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={[styles.emptyTitle, { color: Colors.textPrimary }]}>{title}</Text>
      {subtitle && <Text style={[styles.emptySubtitle, { color: Colors.textSecondary }]}>{subtitle}</Text>}
      {action}
    </View>
  );
};

// ─── Badge ────────────────────────────────────────────────────────────────────

export const Badge = ({ label, color, bg }) => {
  const Colors = useColors();
  return (
    <View style={[styles.badge, { backgroundColor: bg || Colors.primaryLight }]}>
      <Text style={[styles.badgeText, { color: color || Colors.primary }]}>{label}</Text>
    </View>
  );
};

// ─── Divider ─────────────────────────────────────────────────────────────────

export const Divider = ({ style }) => {
  const Colors = useColors();
  return <View style={[styles.divider, { backgroundColor: Colors.border }, style]} />;
};

// ─── SectionHeader ───────────────────────────────────────────────────────────

export const SectionHeader = ({ title, right }) => {
  const Colors = useColors();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionHeaderText, { color: Colors.textSecondary }]}>{title}</Text>
      {right}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  button: { borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', ...Shadow.sm },
  buttonGhost: { shadowOpacity: 0, elevation: 0 },
  buttonDisabled: { opacity: 0.5 },
  buttonInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  buttonIcon: { fontSize: 16 },
  buttonText: { fontWeight: '600', letterSpacing: 0.2 },
  inputWrapper: { marginBottom: Spacing.md },
  inputLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6, letterSpacing: 0.3, textTransform: 'uppercase' },
  input: { borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 12, fontSize: 15, borderWidth: 1.5 },
  inputMultiline: { paddingTop: 12, textAlignVertical: 'top', minHeight: 80 },
  inputErrorText: { fontSize: 12, marginTop: 4 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.xxl },
  emptyIcon: { fontSize: 56, marginBottom: Spacing.md },
  emptyTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: Spacing.lg },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  badgeText: { fontSize: 12, fontWeight: '700' },
  divider: { height: 1, marginVertical: Spacing.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm, paddingHorizontal: 2 },
  sectionHeaderText: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
});