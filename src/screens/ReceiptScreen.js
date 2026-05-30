import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Platform,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import { getCustomerById, getPayments, getTabItems } from '../database/db';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Colors, Radius, Shadow, Spacing } from '../utils/theme';
import { Button } from '../components/UI';

export default function ReceiptScreen({ route }) {
  const { customerId } = route.params;
  const [customer, setCustomer] = useState(null);
  const [tabItems, setTabItems] = useState([]);
  const [payments, setPayments] = useState([]);
  const [saving, setSaving] = useState(false);
  const viewShotRef = useRef(null);

  const totalBill = tabItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = Math.max(0, totalBill - totalPaid);

  const load = async () => {
    const [c, items, pays] = await Promise.all([
      getCustomerById(customerId),
      getTabItems(customerId),
      getPayments(customerId),
    ]);
    setCustomer(c);
    setTabItems(items);
    setPayments(pays);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const handleSaveToGallery = async () => {
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
      console.error(e);
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
        title: `Receipt - ${customer?.name}`,
        message: `Receipt for ${customer?.name}\nTotal: ${formatCurrency(totalBill)}\nBalance: ${formatCurrency(balance)}`,
      });
    } catch (e) {
      if (e.message !== 'User did not share') {
        Alert.alert('Error', 'Could not share receipt.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (!customer) return null;

  const today = formatDate(new Date().toISOString());
  const settled = balance === 0 && totalBill > 0;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Receipt Card (captured) */}
        <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 1.0 }} style={styles.receiptWrapper}>
          <View style={styles.receipt}>
            {/* Header */}
            <View style={styles.receiptHeader}>
              <Text style={styles.receiptStoreName}>🛒 Stokku</Text>
              <Text style={styles.receiptDate}>{today}</Text>
              <View style={styles.receiptDivider} />
              <Text style={styles.receiptCustomer}>{customer.name}</Text>
              {customer.phone ? <Text style={styles.receiptPhone}>📞 {customer.phone}</Text> : null}
            </View>

            {/* Items */}
            <View style={styles.receiptSection}>
              <Text style={styles.receiptSectionTitle}>ITEMS</Text>
              {tabItems.map((item) => (
                <View key={item.id} style={styles.receiptItem}>
                  <View style={styles.receiptItemLeft}>
                    <Text style={styles.receiptItemName}>{item.product_name}</Text>
                    <Text style={styles.receiptItemQty}>
                      {formatCurrency(item.price)} × {item.quantity}
                    </Text>
                  </View>
                  <Text style={styles.receiptItemTotal}>{formatCurrency(item.price * item.quantity)}</Text>
                </View>
              ))}
            </View>

            {/* Dotted separator */}
            <Text style={styles.dotted}>- - - - - - - - - - - - - - - - - -</Text>

            {/* Totals */}
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

            {/* Payment History */}
            {payments.length > 0 && (
              <View style={styles.receiptSection}>
                <Text style={styles.receiptSectionTitle}>PAYMENT HISTORY</Text>
                {payments.map((p) => (
                  <View key={p.id} style={styles.receiptPayRow}>
                    <Text style={styles.receiptPayDate}>{formatDate(p.date)}</Text>
                    <Text style={styles.receiptPayAmt}>{formatCurrency(p.amount)}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Footer */}
            <Text style={styles.dotted}>- - - - - - - - - - - - - - - - - -</Text>
            <Text style={styles.receiptFooter}>Generated by Stokku</Text>
            <Text style={styles.receiptFooterSub}>Thank you! 🙏</Text>
          </View>
        </ViewShot>

        {/* Actions */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.actions}>
          <Button
            title="💾 Save to Gallery"
            onPress={handleSaveToGallery}
            loading={saving}
            style={styles.actionBtn}
          />
          <Button
            title="📤 Share Receipt"
            variant="secondary"
            onPress={handleShare}
            loading={saving}
            style={styles.actionBtn}
          />
        </Animated.View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.md },

  receiptWrapper: { borderRadius: Radius.xl, overflow: 'hidden', ...Shadow.lg },
  receipt: {
    backgroundColor: '#FFFEF5',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
  },

  receiptHeader: { alignItems: 'center', marginBottom: Spacing.md },
  receiptStoreName: { fontSize: 24, fontWeight: '900', color: Colors.textPrimary, letterSpacing: -0.5 },
  receiptDate: { fontSize: 12, color: Colors.textMuted, marginTop: 4, marginBottom: 12 },
  receiptDivider: { height: 1, backgroundColor: Colors.border, width: '100%', marginBottom: 12 },
  receiptCustomer: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  receiptPhone: { fontSize: 13, color: Colors.textSecondary, marginTop: 3 },

  receiptSection: { marginVertical: Spacing.sm },
  receiptSectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
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
  receiptBalanceRow: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 4,
  },

  receiptPayRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  receiptPayDate: { fontSize: 13, color: Colors.textSecondary },
  receiptPayAmt: { fontSize: 13, fontWeight: '700', color: Colors.success },

  receiptFooter: { textAlign: 'center', fontSize: 12, color: Colors.textMuted, marginTop: 4, fontWeight: '600' },
  receiptFooterSub: { textAlign: 'center', fontSize: 12, color: Colors.textMuted, marginTop: 2 },

  actions: { marginTop: Spacing.lg, gap: Spacing.sm },
  actionBtn: { width: '100%' },
});
