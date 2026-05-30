import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Colors, Radius, Shadow, Spacing } from '../utils/theme';

// ─── Button ──────────────────────────────────────────────────────────────────

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  style,
}) => {
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
          {icon && <Text style={[styles.buttonIcon]}>{icon}</Text>}
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
  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        style={[styles.card, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
};

// ─── Input ────────────────────────────────────────────────────────────────────

export const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  numberOfLines,
  style,
  error,
  returnKeyType,
  onSubmitEditing,
  autoFocus,
}) => (
  <View style={[styles.inputWrapper, style]}>
    {label && <Text style={styles.inputLabel}>{label}</Text>}
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
        multiline && styles.inputMultiline,
        error && styles.inputError,
      ]}
    />
    {error && <Text style={styles.inputErrorText}>{error}</Text>}
  </View>
);

// ─── EmptyState ───────────────────────────────────────────────────────────────

export const EmptyState = ({ icon, title, subtitle, action }) => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyIcon}>{icon}</Text>
    <Text style={styles.emptyTitle}>{title}</Text>
    {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
    {action}
  </View>
);

// ─── Badge ────────────────────────────────────────────────────────────────────

export const Badge = ({ label, color = Colors.primary, bg }) => (
  <View style={[styles.badge, { backgroundColor: bg || Colors.primaryLight }]}>
    <Text style={[styles.badgeText, { color }]}>{label}</Text>
  </View>
);

// ─── Divider ─────────────────────────────────────────────────────────────────

export const Divider = ({ style }) => <View style={[styles.divider, style]} />;

// ─── SectionHeader ───────────────────────────────────────────────────────────

export const SectionHeader = ({ title, right }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionHeaderText}>{title}</Text>
    {right}
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  button: {
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  buttonGhost: {
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  buttonIcon: {
    fontSize: 16,
  },
  buttonText: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  inputWrapper: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  inputMultiline: {
    paddingTop: 12,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  inputErrorText: {
    fontSize: 12,
    color: Colors.danger,
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingHorizontal: 2,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
