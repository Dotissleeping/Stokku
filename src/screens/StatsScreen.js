import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import { getDb } from '../database/db';
import { formatCurrency } from '../utils/formatters';
import { Colors, Radius, Shadow, Spacing } from '../utils/theme';
import { Card, SectionHeader } from '../components/UI';

const PERIODS = ['Day', 'Month', 'Year'];

const getSalesData = async (period) => {
  const database = await getDb();

  let groupFormat, label;
  if (period === 'Day') {
    groupFormat = "%Y-%m-%d";
    label = "Daily Sales";
  } else if (period === 'Month') {
    groupFormat = "%Y-%m";
    label = "Monthly Sales";
  } else {
    groupFormat = "%Y";
    label = "Yearly Sales";
  }

  const sales = await database.getAllAsync(`
    SELECT 
      strftime('${groupFormat}', date) as period,
      SUM(amount) as total,
      COUNT(*) as count
    FROM payments
    GROUP BY period
    ORDER BY period DESC
    LIMIT 12
  `);

  const topProducts = await database.getAllAsync(`
    SELECT 
      product_name,
      SUM(quantity) as total_qty,
      SUM(price * quantity) as total_value
    FROM tab_items
    GROUP BY product_name
    ORDER BY total_qty DESC
    LIMIT 5
  `);

  const totalRevenue = await database.getFirstAsync(
    'SELECT COALESCE(SUM(amount), 0) as total FROM payments'
  );

  const totalTransactions = await database.getFirstAsync(
    'SELECT COUNT(*) as count FROM payments'
  );

  const totalCustomers = await database.getFirstAsync(
    'SELECT COUNT(*) as count FROM customers'
  );

  return {
    sales,
    topProducts,
    totalRevenue: totalRevenue?.total || 0,
    totalTransactions: totalTransactions?.count || 0,
    totalCustomers: totalCustomers?.count || 0,
    label,
  };
};

const formatPeriodLabel = (period, type) => {
  if (!period) return '';
  if (type === 'Day') {
    const d = new Date(period);
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  if (type === 'Month') {
    const [year, month] = period.split('-');
    const d = new Date(parseInt(year), parseInt(month) - 1);
    return d.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
  }
  return period;
};

export default function StatsScreen() {
  const [activePeriod, setActivePeriod] = useState('Month');
  const [data, setData] = useState(null);

  const load = async () => {
    const result = await getSalesData(activePeriod);
    setData(result);
  };

  useFocusEffect(useCallback(() => { load(); }, [activePeriod]));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Period Selector */}
      <Animated.View entering={FadeInDown.delay(0).duration(300)} style={styles.periodRow}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p}
            onPress={() => setActivePeriod(p)}
            style={[styles.periodBtn, activePeriod === p && styles.periodBtnActive]}
            activeOpacity={0.8}
          >
            <Text style={[styles.periodBtnText, activePeriod === p && styles.periodBtnTextActive]}>
              {p}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>

      {/* Overview Cards */}
      <Animated.View entering={FadeInDown.delay(80).duration(300)} style={styles.overviewRow}>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewLabel}>Total Revenue</Text>
          <Text style={[styles.overviewValue, { color: Colors.success }]}>
            {formatCurrency(data?.totalRevenue || 0)}
          </Text>
        </View>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewLabel}>Transactions</Text>
          <Text style={[styles.overviewValue, { color: Colors.primary }]}>
            {data?.totalTransactions || 0}
          </Text>
        </View>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewLabel}>Customers</Text>
          <Text style={[styles.overviewValue, { color: Colors.accent }]}>
            {data?.totalCustomers || 0}
          </Text>
        </View>
      </Animated.View>

      {/* Sales Breakdown */}
      <Animated.View entering={FadeInDown.delay(160).duration(300)}>
        <SectionHeader title={`📅 ${data?.label || ''}`} />
        {data?.sales?.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No sales data yet</Text>
          </Card>
        ) : (
          <Card style={styles.tableCard}>
            {data?.sales?.map((row, index) => (
              <View key={index}>
                {index > 0 && <View style={styles.rowDivider} />}
                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>
                    {formatPeriodLabel(row.period, activePeriod)}
                  </Text>
                  <View style={styles.tableRight}>
                    <Text style={styles.tableCount}>{row.count} payments</Text>
                    <Text style={styles.tableValue}>{formatCurrency(row.total)}</Text>
                  </View>
                </View>
              </View>
            ))}
          </Card>
        )}
      </Animated.View>

      {/* Top Products */}
      <Animated.View entering={FadeInDown.delay(240).duration(300)} style={{ marginTop: Spacing.lg }}>
        <SectionHeader title="🏆 Top Products" />
        {data?.topProducts?.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No product sales yet</Text>
          </Card>
        ) : (
          <Card style={styles.tableCard}>
            {data?.topProducts?.map((product, index) => (
              <View key={index}>
                {index > 0 && <View style={styles.rowDivider} />}
                <View style={styles.tableRow}>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.productName} numberOfLines={1}>
                    {product.product_name}
                  </Text>
                  <View style={styles.tableRight}>
                    <Text style={styles.tableCount}>{product.total_qty} sold</Text>
                    <Text style={styles.tableValue}>{formatCurrency(product.total_value)}</Text>
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
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md },

  periodRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 4,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  periodBtn: {
    flex: 1, paddingVertical: 10,
    alignItems: 'center', borderRadius: Radius.md,
  },
  periodBtnActive: { backgroundColor: Colors.primary },
  periodBtnText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  periodBtnTextActive: { color: Colors.textInverse },

  overviewRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  overviewCard: {
    flex: 1, backgroundColor: Colors.surface,
    borderRadius: Radius.lg, padding: Spacing.sm,
    alignItems: 'center', paddingVertical: 14,
    ...Shadow.sm,
  },
  overviewLabel: {
    fontSize: 10, fontWeight: '700',
    color: Colors.textMuted, textTransform: 'uppercase',
    letterSpacing: 0.5, marginBottom: 6, textAlign: 'center',
  },
  overviewValue: { fontSize: 18, fontWeight: '800' },

  tableCard: { padding: 0, overflow: 'hidden' },
  tableRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    gap: Spacing.sm,
  },
  tableLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  tableRight: { alignItems: 'flex-end' },
  tableCount: { fontSize: 11, color: Colors.textMuted, marginBottom: 2 },
  tableValue: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  rowDivider: { height: 1, backgroundColor: Colors.borderLight },

  rankBadge: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  rankText: { fontSize: 12, fontWeight: '800', color: Colors.primary },
  productName: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.textPrimary },

  emptyCard: { alignItems: 'center', paddingVertical: Spacing.md },
  emptyText: { fontSize: 14, color: Colors.textMuted, fontStyle: 'italic' },
});