import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { exportBackup, importBackup } from '../utils/backup';
import { Colors, Radius, Shadow, Spacing } from '../utils/theme';
import { Card } from '../components/UI';

const SettingRow = ({ icon, title, subtitle, onPress, color = Colors.primary, loading }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.8} disabled={loading}>
    <View style={styles.settingRow}>
      <View style={[styles.settingIcon, { backgroundColor: color + '20' }]}>
        {loading ? (
          <ActivityIndicator size="small" color={color} />
        ) : (
          <Ionicons name={icon} size={22} color={color} />
        )}
      </View>
      <View style={styles.settingText}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
    </View>
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleExport = async () => {
    Alert.alert(
      'Export Backup',
      'This will export all your products, customers, tabs and payments to a JSON file you can save anywhere.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: async () => {
            setExporting(true);
            const result = await exportBackup();
            setExporting(false);
            if (!result.success) {
              Alert.alert('Export Failed', result.error || 'Something went wrong.');
            }
          },
        },
      ]
    );
  };

  const handleImport = async () => {
    Alert.alert(
      'Import Backup',
      '⚠️ This will REPLACE all current data with the backup. This cannot be undone. Are you sure?',
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
              Alert.alert('✅ Import Successful', 'Your data has been restored from backup.');
            } else {
              Alert.alert('Import Failed', result.error || 'Invalid or corrupted backup file.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Backup Section */}
      <Animated.View entering={FadeInDown.delay(0).duration(300)}>
        <Text style={styles.sectionLabel}>DATA BACKUP</Text>
        <Card style={styles.card}>
          <SettingRow
            icon="cloud-upload-outline"
            title="Export Backup"
            subtitle="Save all data to a JSON file"
            onPress={handleExport}
            color={Colors.primary}
            loading={exporting}
          />
          <View style={styles.rowDivider} />
          <SettingRow
            icon="cloud-download-outline"
            title="Import Backup"
            subtitle="Restore data from a backup file"
            onPress={handleImport}
            color={Colors.success}
            loading={importing}
          />
        </Card>
      </Animated.View>

      {/* Warning */}
      <Animated.View entering={FadeInDown.delay(100).duration(300)}>
        <View style={styles.warningBox}>
          <Ionicons name="warning-outline" size={18} color={Colors.warning} />
          <Text style={styles.warningText}>
            Stokku stores all data locally on your device. If you uninstall the app without a backup, all data will be permanently lost. Export your backup regularly!
          </Text>
        </View>
      </Animated.View>

      {/* App Info */}
      <Animated.View entering={FadeInDown.delay(200).duration(300)}>
        <Text style={styles.sectionLabel}>ABOUT</Text>
        <Card style={styles.card}>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>App</Text>
            <Text style={styles.aboutValue}>Stokku</Text>
          </View>
          <View style={styles.rowDivider} />
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Version</Text>
            <Text style={styles.aboutValue}>1.0.0 Beta</Text>
          </View>
          <View style={styles.rowDivider} />
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Storage</Text>
            <Text style={styles.aboutValue}>Local SQLite</Text>
          </View>
        </Card>
      </Animated.View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
    paddingHorizontal: 2,
  },
  card: { padding: 0, overflow: 'hidden', marginBottom: Spacing.sm },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    gap: Spacing.sm,
  },
  settingIcon: {
    width: 40, height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingText: { flex: 1 },
  settingTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  settingSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  rowDivider: { height: 1, backgroundColor: Colors.borderLight, marginLeft: Spacing.md + 40 + Spacing.sm },
  warningBox: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.warningLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    alignItems: 'flex-start',
  },
  warningText: { flex: 1, fontSize: 13, color: Colors.warning, fontWeight: '500', lineHeight: 18 },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  aboutLabel: { fontSize: 14, color: Colors.textSecondary },
  aboutValue: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
});