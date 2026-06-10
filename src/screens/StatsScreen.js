import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import { getDb } from '../database/db';
import { formatCurrency } from '../utils/formatters';
import { DarkColors, LightColors, Radius, Shadow, Spacing } from '../utils/theme';
import { useTheme } from '../utils/ThemeContext';
import { Card, SectionHeader } from '../components/UI';

const PERIODS = ['Day', 'Month', 'Year'];

const getSalesData = async (period) => {
  const database = await getDb();
  let groupFormat, label;
  if (period === 'Day') { groupFormat = "%Y-%m-%d"; label = "Daily Sales"; }
  else if (period === 'Month') { groupFormat = "%Y-%m"; label = "Monthly Sales"; }
  else { groupFormat = "%Y"; label = "Yearly Sales"; }

  const sales = await database.getAllAsync(`
    SELECT strftime('${groupFormat}', date) as period, SUM(amount) as total, COUNT(*) as count
    FROM payments GROUP BY period ORDER BY period DESC LIMIT 12
  `);
  const topProducts = await database.getAllAsync(`
    SELECT product_name, SUM(quantity) as total_qty, SUM(price * quantity) as total_value
    FROM tab_items GROUP BY product_name ORDER BY total_qty DESC LIMIT 5
  `);
  const totalRevenue = await database.getFirstAsync('SELECT COALESCE(SUM(amount), 0) as total FROM payments');
  const totalTransactions = await database.getFirstAsync('SELECT COUNT(*) as count FROM payments');
  const totalCustomers = await database.getFirstAsync('SELECT COUNT(*) as count FROM customers');
  return { sales, topProducts, totalRevenue: totalRevenue?.total || 0, totalTransactions: totalTransactions?.count || 0, totalCustomers: totalCustomers?.count || 0, label };
};

const formatPeriodLabel = (period, type) => {
  if (!period) return '';
  if (type === 'Day') { const d = new Date(period); return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }); }
  if (type === 'Month') { const [year, month] = period.split('-'); const d = new Date(parseInt(year), parseInt(month) - 1); return d.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' }); }
  return period;
};

export default function StatsScreen() {
  const { isDark } = useTheme();
  const Colors = isDark ? DarkColors : LightColors;
  const [activePeriod, setActivePeriod] = useState('Month');
  const [data, setData] = useState(null);

  const load = async () => { const result = await getSalesData(activePeriod); setData(result); };
  useFocusEffect(useCallback(() => { load(); }, [activePeriod]));

  return (
    <ScrollView style={[styles.container, { backgroundColor: Colors.background }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Animated.View entering={FadeInDown.delay(0).duration(300)} style={[styles.periodRow, { backgroundColor: Colors.surface }]}>
        {PERIODS.map((p) => (
          <TouchableOpacity key={p} onPress={() => setActivePeriod(p)} style={[styles.periodBtn, activePeriod === p && { backgroundColor: Colors.primary }]} activeOpacity={0.8}>
            <Text style={[styles.periodBtnText, { color: activePeriod === p ? Colors.textInverse : Colors.textSecondary }]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).duration(300)} style={styles.overviewRow}>
        {[
          { label: 'Total Revenue', value: formatCurrency(data?.totalRevenue || 0), color: Colors.success },
          { label: 'Transactions', value: data?.totalTransactions || 0, color: Colors.primary },
          { label: 'Customers', value: data?.totalCustomers || 0, color: Colors.accent },
        ].map((item) => (
          <View key={item.label} style={[styles.overviewCard, { backgroundColor: Colors.surface }]}>
            <Text style={[styles.overviewLabel, { color: Colors.textMuted }]}>{item.label}</Text>
            <Text style={[styles.overviewValue, { color: item.color }]}>{item.value}</Text>
          </View>
        ))}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(160).duration(300)}>
        <SectionHeader title={data?.label || ''} />
        {!data?.sales?.length ? (
          <Card style={styles.emptyCard}><Text style={[styles.emptyText, { color: Colors.textMuted }]}>No sales data yet</Text></Card>
        ) : (
          <Card style={styles.tableCard}>
            {data.sales.map((row, index) => (
              <View key={index}>
                {index > 0 && <View style={[styles.rowDivider, { backgroundColor: Colors.borderLight }]} />}
                <View style={styles.tableRow}>
                  <Text style={[styles.tableLabel, { color: Colors.textPrimary }]}>{formatPeriodLabel(row.period, activePeriod)}</Text>
                  <View style={styles.tableRight}>
                    <Text style={[styles.tableCount, { color: Colors.textMuted }]}>{row.count} payments</Text>
                    <Text style={[styles.tableValue, { color: Colors.primary }]}>{formatCurrency(row.total)}</Text>
                  </View>
                </View>
              </View>
            ))}
          </Card>
        )}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(240).duration(300)} style={{ marginTop: Spacing.lg }}>
        <SectionHeader title=" Top Products" />
        {!data?.topProducts?.length ? (
          <Card style={styles.emptyCard}><Text style={[styles.emptyText, { color: Colors.textMuted }]}>No product sales yet</Text></Card>
        ) : (
          <Card style={styles.tableCard}>
            {data.topProducts.map((product, index) => (
              <View key={index}>
                {index > 0 && <View style={[styles.rowDivider, { backgroundColor: Colors.borderLight }]} />}
                <View style={styles.tableRow}>
                  <View style={[styles.rankBadge, { backgroundColor: Colors.primaryLight }]}>
                    <Text style={[styles.rankText, { color: Colors.primary }]}>{index + 1}</Text>
                  </View>
                  <Text style={[styles.productName, { color: Colors.textPrimary }]} numberOfLines={1}>{product.product_name}</Text>
                  <View style={styles.tableRight}>
                    <Text style={[styles.tableCount, { color: Colors.textMuted }]}>{product.total_qty} sold</Text>
                    <Text style={[styles.tableValue, { color: Colors.primary }]}>{formatCurrency(product.total_value)}</Text>
                  </View>
                </View>
              </View>
            ))}
          </Card>
        )}
      </Animated.View>
      <View style={{ height: Spacing.xxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.md },
  periodRow: { flexDirection: 'row', borderRadius: Radius.lg, padding: 4, marginBottom: Spacing.md, ...Shadow.sm },
  periodBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: Radius.md },
  periodBtnText: { fontSize: 14, fontWeight: '600' },
  overviewRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  overviewCard: { flex: 1, borderRadius: Radius.lg, padding: Spacing.sm, alignItems: 'center', paddingVertical: 14, ...Shadow.sm },
  overviewLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, textAlign: 'center' },
  overviewValue: { fontSize: 18, fontWeight: '800' },
  tableCard: { padding: 0, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 12, gap: Spacing.sm },
  tableLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
  tableRight: { alignItems: 'flex-end' },
  tableCount: { fontSize: 11, marginBottom: 2 },
  tableValue: { fontSize: 14, fontWeight: '700' },
  rowDivider: { height: 1 },
  rankBadge: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 12, fontWeight: '800' },
  productName: { flex: 1, fontSize: 14, fontWeight: '600' },
  emptyCard: { alignItems: 'center', paddingVertical: Spacing.md },
  emptyText: { fontSize: 14, fontStyle: 'italic' },
});