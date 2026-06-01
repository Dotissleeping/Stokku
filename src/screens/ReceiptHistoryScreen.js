import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Share,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';
import { Colors, Radius, Shadow, Spacing } from '../utils/theme';
import { Button } from '../components/UI';

export default function ReceiptHistoryDetailScreen({ route }) {
  const { snapshot, customerName, totalBill, totalPaid, balance, date } = route.params;
  const { tabItems, payments } = snapshot;
  const viewShotRef = useRef(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Allow gallery access to save receipt.');
        return;
      }
      const uri = await viewShotRef.current.capture();
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('✅ Saved!', 'Receipt saved to your gallery.');
    } catch (e) {
      Alert.alert('Error', 'Could not save receipt.');
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    try {
      setSaving(true);
      const uri = await viewShotRef.current.capture();
      await Share.share({
        url: uri,
        title: `Receipt - ${customerName}`,
        message: `Receipt for ${customerName}\nTotal: ${formatCurrency(totalBill)}\nBalance: ${formatCurrency(balance)}`,
      });
    } catch (e) {
      if (e.message !== 'User did not share') {
        Alert.alert('Error', 'Could not share receipt.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 1.0 }} style={styles.receiptWrapper}>
          <View style={styles.receipt}>
            <View style={styles.receiptHeader}>
              <Text style={styles.receiptStoreName}>🛒 Stokku</Text>
              <Text style={styles.receiptDate}>{formatDateTime(date)}</Text>
              <View style={styles.receiptDivider} />
              <Text style={styles.receiptCustomer}>{customerName}</Text>
            </View>

            <View style={styles.receiptSection}>
              <Text style={styles.receiptSectionTitle}>ITEMS</Text>
              {tabItems.map((item, i) => (
                <View key={i} style={styles.receiptItem}>
                  <View style={styles.receiptItemLeft}>
                    <Text style={styles.receiptItemName}>{item.product_name}</Text>
                    <Text style={styles.receiptItemQty}>{formatCurrency(item.price)} × {item.quantity}</Text>
                  </View>
                  <Text style={styles.receiptItemTotal}>{formatCurrency(item.price * item.quantity)}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.dotted}>- - - - - - - - - - - - - - - - - -</Text>

            <View style={styles.receiptTotals}>
              <View style={styles.receiptTotalRow}>
                <Text style={styles.receiptTotalLabel}>Total Bill</Text>
                <Text style={styles.receiptTotalValue}>{formatCurrency(totalBill)}</Text>
              </View>
              <View style={styles.receiptTotalRow}>
                <Text style={[styles.receiptTotalLabel, { color: Colors.success }]}>Total Paid</Text>
                <Text style={[styles.receiptTotalValue, { color: Colors.success }]}>{formatCurrency(totalPaid)}</Text>
              </View>
              <View style={[styles.receiptTotalRow, styles.receiptBalanceRow]}>
                <Text style={[styles.receiptTotalLabel, { fontSize: 16, fontWeight: '800', color: balance > 0 ? Colors.danger : Colors.success }]}>
                  {balance > 0 ? 'Balance Due' : 'Fully Paid ✅'}
                </Text>
                <Text style={[styles.receiptTotalValue, { fontSize: 20, color: balance > 0 ? Colors.danger : Colors.success }]}>
                  {formatCurrency(balance)}
                </Text>
              </View>
            </View>

            {payments.length > 0 && (
              <View style={styles.receiptSection}>
                <Text style={styles.receiptSectionTitle}>PAYMENT HISTORY</Text>
                {payments.map((p, i) => (
                  <View key={i} style={styles.receiptPayRow}>
                    <Text style={styles.receiptPayDate}>{formatDate(p.date)}</Text>
                    <Text style={styles.receiptPayAmt}>{formatCurrency(p.amount)}</Text>
                  </View>
                ))}
              </View>
            )}

            <Text style={styles.dotted}>- - - - - - - - - - - - - - - - - -</Text>
            <Text style={styles.receiptFooter}>Generated by Stokku</Text>
            <Text style={styles.receiptFooterSub}>Thank you! 🙏</Text>
          </View>
        </ViewShot>

        <View style={styles.actions}>
          <Button title="💾 Save to Gallery" onPress={handleSave} loading={saving} style={styles.actionBtn} />
          <Button title="📤 Share" variant="secondary" onPress={handleShare} loading={saving} style={styles.actionBtn} />
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: Spacing.md },
  receiptWrapper: { borderRadius: Radius.xl, overflow: 'hidden', ...Shadow.lg },
  receipt: { backgroundColor: '#FFFEF5', borderRadius: Radius.xl, padding: Spacing.lg },
  receiptHeader: { alignItems: 'center', marginBottom: Spacing.md },
  receiptStoreName: { fontSize: 24, fontWeight: '900', color: Colors.textPrimary },
  receiptDate: { fontSize: 12, color: Colors.textMuted, marginTop: 4, marginBottom: 12 },
  receiptDivider: { height: 1, backgroundColor: Colors.border, width: '100%', marginBottom: 12 },
  receiptCustomer: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  receiptSection: { marginVertical: Spacing.sm },
  receiptSectionTitle: { fontSize: 10, fontWeight: '800', color: Colors.textMuted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 },
  receiptItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  receiptItemLeft: { flex: 1 },
  receiptItemName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  receiptItemQty: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  receiptItemTotal: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  dotted: { textAlign: 'center', color: Colors.border, fontSize: 13, letterSpacing: 2, marginVertical: Spacing.sm },
  receiptTotals: { marginVertical: Spacing.sm },
  receiptTotalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  receiptTotalLabel: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600' },
  receiptTotalValue: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  receiptBalanceRow: { backgroundColor: Colors.primaryLight, borderRadius: Radius.sm, paddingHorizontal: 10, paddingVertical: 8, marginTop: 4 },
  receiptPayRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  receiptPayDate: { fontSize: 13, color: Colors.textSecondary },
  receiptPayAmt: { fontSize: 13, fontWeight: '700', color: Colors.success },
  receiptFooter: { textAlign: 'center', fontSize: 12, color: Colors.textMuted, marginTop: 4, fontWeight: '600' },
  receiptFooterSub: { textAlign: 'center', fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  actions: { marginTop: Spacing.lg, gap: Spacing.sm },
  actionBtn: { width: '100%' },
});