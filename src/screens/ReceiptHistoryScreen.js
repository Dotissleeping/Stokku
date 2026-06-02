import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import { deleteReceiptSnapshot, getReceiptSnapshots } from '../database/db';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { DarkColors, LightColors, Radius, Spacing } from '../utils/theme';
import { useTheme } from '../utils/ThemeContext';
import { Card, EmptyState } from '../components/UI';

export default function ReceiptHistoryScreen({ navigation }) {
  const { isDark } = useTheme();
  const Colors = isDark ? DarkColors : LightColors;
  const [snapshots, setSnapshots] = useState([]);

  const load = async () => { const data = await getReceiptSnapshots(); setSnapshots(data); };
  useFocusEffect(useCallback(() => { load(); }, []));

  const handleDelete = (item) => {
    Alert.alert('Delete Receipt', 'Remove this receipt from history?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteReceiptSnapshot(item.id); load(); } },
    ]);
  };

  const handleView = (item) => {
    const snapshot = JSON.parse(item.snapshot);
    navigation.navigate('ReceiptHistoryDetail', {
      snapshot, customerName: item.customer_name,
      totalBill: item.total_bill, totalPaid: item.total_paid,
      balance: item.balance, date: item.date,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <FlatList
        data={snapshots}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInRight.delay(index * 40).duration(300)}>
            <Card style={styles.card}>
              <TouchableOpacity onPress={() => handleView(item)} activeOpacity={0.8}>
                <View style={styles.cardRow}>
                  <View style={styles.cardLeft}>
                    <Text style={[styles.customerName, { color: Colors.textPrimary }]}>{item.customer_name}</Text>
                    <Text style={[styles.date, { color: Colors.textSecondary }]}>{formatDateTime(item.date)}</Text>
                  </View>
                  <View style={styles.cardRight}>
                    <Text style={[styles.totalBill, { color: Colors.primary }]}>{formatCurrency(item.total_bill)}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: item.balance <= 0 ? Colors.successLight : Colors.warningLight }]}>
                      <Text style={[styles.statusText, { color: item.balance <= 0 ? Colors.success : Colors.warning }]}>
                        {item.balance <= 0 ? 'Settled' : `${formatCurrency(item.balance)} left`}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
              <View style={[styles.cardActions, { borderTopColor: Colors.borderLight }]}>
                <TouchableOpacity onPress={() => handleView(item)} style={styles.actionBtn}>
                  <Text style={[styles.actionBtnText, { color: Colors.primary }]}>👁 View</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
                  <Text style={[styles.actionBtnText, { color: Colors.danger }]}>🗑 Delete</Text>
                </TouchableOpacity>
              </View>
            </Card>
          </Animated.View>
        )}
        ListEmptyComponent={
          <EmptyState icon="🧾" title="No receipt history yet" subtitle="Receipts are saved automatically when you record a payment." />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  card: { marginBottom: Spacing.sm },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLeft: { flex: 1 },
  customerName: { fontSize: 16, fontWeight: '700' },
  date: { fontSize: 12, marginTop: 3 },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  totalBill: { fontSize: 16, fontWeight: '800' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  statusText: { fontSize: 11, fontWeight: '700' },
  cardActions: { flexDirection: 'row', borderTopWidth: 1, marginTop: Spacing.sm, paddingTop: Spacing.sm },
  actionBtn: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  actionBtnText: { fontSize: 13, fontWeight: '600' },
});