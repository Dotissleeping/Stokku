import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ScrollView, ActivityIndicator, Switch,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { exportBackup, importBackup } from '../utils/backup';
import { useTheme } from '../utils/ThemeContext';
import { DarkColors, LightColors, Radius, Spacing } from '../utils/theme';
import { Card } from '../components/UI';

const SettingRow = ({ icon, title, subtitle, onPress, color, loading, right }) => {
  const { isDark } = useTheme();
  const Colors = isDark ? DarkColors : LightColors;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} disabled={loading}>
      <View style={styles.settingRow}>
        <View style={[styles.settingIcon, { backgroundColor: (color || Colors.primary) + '20' }]}>
          {loading ? (
            <ActivityIndicator size="small" color={color || Colors.primary} />
          ) : (
            <Ionicons name={icon} size={22} color={color || Colors.primary} />
          )}
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, { color: Colors.textPrimary }]}>{title}</Text>
          {subtitle && <Text style={[styles.settingSubtitle, { color: Colors.textSecondary }]}>{subtitle}</Text>}
        </View>
        {right || <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />}
      </View>
    </TouchableOpacity>
  );
};

export default function SettingsScreen() {
  const { isDark, toggleDark } = useTheme();
  const Colors = isDark ? DarkColors : LightColors;
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleExport = async () => {
    Alert.alert(
      'Export Backup',
      'This will export all your data to a JSON file.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: async () => {
            setExporting(true);
            const result = await exportBackup();
            setExporting(false);
            if (!result.success) Alert.alert('Export Failed', result.error || 'Something went wrong.');
          },
        },
      ]
    );
  };

  const handleImport = async () => {
    Alert.alert(
      'Import Backup',
      'This will REPLACE all current data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          style: 'destructive',
          onPress: async () => {
            setImporting(true);
            const result = await importBackup();
            setImporting(false);
            if (result.canceled) return;
            if (result.success) {
              Alert.alert('Import Successful', 'Your data has been restored.');
            } else {
              Alert.alert('Import Failed', result.error || 'Invalid backup file.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: Colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Appearance */}
      <Animated.View entering={FadeInDown.delay(0).duration(300)}>
        <Text style={[styles.sectionLabel, { color: Colors.textMuted }]}>APPEARANCE</Text>
        <View style={[styles.card, { backgroundColor: Colors.surface }]}>
          <View style={styles.settingRow}>
            <View style={[styles.settingIcon, { backgroundColor: Colors.primary + '20' }]}>
              <Ionicons name={isDark ? 'moon' : 'sunny-outline'} size={22} color={Colors.primary} />
            </View>
            <View style={styles.settingText}>
              <Text style={[styles.settingTitle, { color: Colors.textPrimary }]}>Dark Mode</Text>
              <Text style={[styles.settingSubtitle, { color: Colors.textSecondary }]}>
                {isDark ? 'Dark theme enabled' : 'Light theme enabled'}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleDark}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.textInverse}
            />
          </View>
        </View>
      </Animated.View>

      {/* Backup */}
      <Animated.View entering={FadeInDown.delay(80).duration(300)}>
        <Text style={[styles.sectionLabel, { color: Colors.textMuted }]}>DATA BACKUP</Text>
        <View style={[styles.card, { backgroundColor: Colors.surface }]}>
          <SettingRow
            icon="cloud-upload-outline"
            title="Export Backup"
            subtitle="Save all data to a JSON file"
            onPress={handleExport}
            color={Colors.primary}
            loading={exporting}
          />
          <View style={[styles.rowDivider, { backgroundColor: Colors.borderLight }]} />
          <SettingRow
            icon="cloud-download-outline"
            title="Import Backup"
            subtitle="Restore data from a backup file"
            onPress={handleImport}
            color={Colors.success}
            loading={importing}
          />
        </View>
      </Animated.View>

      {/* Warning */}
      <Animated.View entering={FadeInDown.delay(160).duration(300)}>
        <View style={[styles.warningBox, { backgroundColor: Colors.warningLight }]}>
          <Ionicons name="warning-outline" size={18} color={Colors.warning} />
          <Text style={[styles.warningText, { color: Colors.warning }]}>
            All data is stored locally. Export regularly to prevent data loss if you uninstall the app.
          </Text>
        </View>
      </Animated.View>

      {/* About */}
      <Animated.View entering={FadeInDown.delay(240).duration(300)}>
        <Text style={[styles.sectionLabel, { color: Colors.textMuted }]}>ABOUT</Text>
        <View style={[styles.card, { backgroundColor: Colors.surface }]}>
          {[
            { label: 'App', value: 'Stokku' },
            { label: 'Version', value: '1.0.0 Beta' },
            { label: 'Storage', value: 'Local SQLite' },
          ].map((item, index, arr) => (
            <View key={item.label}>
              <View style={styles.aboutRow}>
                <Text style={[styles.aboutLabel, { color: Colors.textSecondary }]}>{item.label}</Text>
                <Text style={[styles.aboutValue, { color: Colors.textPrimary }]}>{item.value}</Text>
              </View>
              {index < arr.length - 1 && <View style={[styles.rowDivider, { backgroundColor: Colors.borderLight }]} />}
            </View>
          ))}
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1,
    textTransform: 'uppercase', marginBottom: Spacing.sm,
    marginTop: Spacing.md, paddingHorizontal: 2,
  },
  card: { borderRadius: Radius.lg, overflow: 'hidden', marginBottom: Spacing.sm, elevation: 2 },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 14, gap: Spacing.sm },
  settingIcon: { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  settingText: { flex: 1 },
  settingTitle: { fontSize: 15, fontWeight: '600' },
  settingSubtitle: { fontSize: 12, marginTop: 2 },
  rowDivider: { height: 1, marginLeft: Spacing.md + 40 + Spacing.sm },
  warningBox: { flexDirection: 'row', gap: Spacing.sm, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.lg, alignItems: 'flex-start' },
  warningText: { flex: 1, fontSize: 13, fontWeight: '500', lineHeight: 18 },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 14 },
  aboutLabel: { fontSize: 14 },
  aboutValue: { fontSize: 14, fontWeight: '600' },
});