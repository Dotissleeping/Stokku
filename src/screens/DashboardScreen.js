import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import { getDashboardStats } from '../database/db';
import { formatCurrency } from '../utils/formatters';
import { DarkColors, LightColors, Radius, Shadow, Spacing } from '../utils/theme';
import { useTheme } from '../utils/ThemeContext';
import { Badge, Card, SectionHeader } from '../components/UI';

export default function DashboardScreen({ navigation }) {
  const { isDark } = useTheme();
  const Colors = isDark ? DarkColors : LightColors;

  const [stats, setStats] = useState({
    totalReceivables: 0,
    unpaidCount: 0,
    lowStock: [],
    totalRestockCost: 0,
    totalCollected: 0,
    estimatedProfit: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (e) { console.error(e); }
  };

  useFocusEffect(useCallback(() => { loadStats(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: Colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.delay(0).duration(400)} style={styles.header}>
        <Text style={[styles.greeting, { color: Colors.textSecondary }]}>Good day! 👋</Text>
        <Text style={[styles.appName, { color: Colors.textPrimary }]}>Stokku</Text>
        <Text style={[styles.subheading, { color: Colors.textMuted }]}>Your business at a glance</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).duration(400)}>
        <View style={[styles.heroCard, { backgroundColor: Colors.primary }]}>
          <View style={styles.heroCardInner}>
            <Text style={styles.heroLabel}>Total Receivables</Text>
            <Text style={styles.heroAmount}>{formatCurrency(stats.totalReceivables)}</Text>
            <View style={styles.heroRow}>
              <View style={styles.heroPill}>
                <Text style={styles.heroPillText}>
                  {stats.unpaidCount} {stats.unpaidCount === 1 ? 'customer' : 'customers'} with balance
                </Text>
              </View>
            </View>
          </View>
          <Text style={styles.heroEmoji}>💰</Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120).duration(400)}>
        <View style={styles.profitRow}>
          <View style={[styles.profitCard, { backgroundColor: Colors.successLight }]}>
            <Text style={[styles.profitLabel, { color: Colors.textSecondary }]}>Collected</Text>
            <Text style={[styles.profitValue, { color: Colors.success }]}>{formatCurrency(stats.totalCollected)}</Text>
          </View>
          <View style={[styles.profitCard, { backgroundColor: Colors.dangerLight }]}>
            <Text style={[styles.profitLabel, { color: Colors.textSecondary }]}>Restock Cost</Text>
            <Text style={[styles.profitValue, { color: Colors.danger }]}>{formatCurrency(stats.totalRestockCost)}</Text>
          </View>
          <View style={[styles.profitCard, { backgroundColor: stats.estimatedProfit >= 0 ? Colors.primaryLight : Colors.dangerLight }]}>
            <Text style={[styles.profitLabel, { color: Colors.textSecondary }]}>Est. Profit</Text>
            <Text style={[styles.profitValue, { color: stats.estimatedProfit >= 0 ? Colors.primary : Colors.danger }]}>
              {formatCurrency(stats.estimatedProfit)}
            </Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(160).duration(400)} style={styles.statsRow}>
        <TouchableOpacity style={[styles.statCard, { backgroundColor: Colors.surface }]} onPress={() => navigation.navigate('Customers')} activeOpacity={0.85}>
          <Text style={styles.statEmoji}>👥</Text>
          <Text style={[styles.statValue, { color: Colors.primary }]}>{stats.unpaidCount}</Text>
          <Text style={[styles.statLabel, { color: Colors.textSecondary }]}>Unpaid Tabs</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.statCard, { backgroundColor: Colors.surface }]} onPress={() => navigation.navigate('Products')} activeOpacity={0.85}>
          <Text style={styles.statEmoji}>⚠️</Text>
          <Text style={[styles.statValue, { color: Colors.danger }]}>{stats.lowStock.length}</Text>
          <Text style={[styles.statLabel, { color: Colors.textSecondary }]}>Low Stock</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.statCard, { backgroundColor: Colors.surface }]} onPress={() => navigation.navigate('Stats')} activeOpacity={0.85}>
          <Text style={styles.statEmoji}>📊</Text>
          <Text style={[styles.statValue, { color: Colors.success }]}>Stats</Text>
          <Text style={[styles.statLabel, { color: Colors.textSecondary }]}>View Sales</Text>
        </TouchableOpacity>
      </Animated.View>

      {stats.lowStock.length > 0 && (
        <Animated.View entering={FadeInDown.delay(240).duration(400)}>
          <SectionHeader
            title="⚠️  Low Stock Alert"
            right={
              <TouchableOpacity onPress={() => navigation.navigate('Products')}>
                <Text style={[styles.seeAll, { color: Colors.primary }]}>Manage →</Text>
              </TouchableOpacity>
            }
          />
          <Card style={styles.lowStockCard}>
            {stats.lowStock.map((item, index) => (
              <View key={item.id}>
                {index > 0 && <View style={[styles.itemDivider, { backgroundColor: Colors.borderLight }]} />}
                <View style={styles.lowStockItem}>
                  <View style={styles.lowStockLeft}>
                    <Text style={[styles.lowStockName, { color: Colors.textPrimary }]}>{item.name}</Text>
                    <Text style={[styles.lowStockPrice, { color: Colors.textSecondary }]}>{formatCurrency(item.price)} each</Text>
                  </View>
                  <Badge
                    label={item.quantity === 0 ? 'Out of Stock' : `${item.quantity} left`}
                    color={item.quantity === 0 ? Colors.danger : Colors.warning}
                    bg={item.quantity === 0 ? Colors.dangerLight : Colors.warningLight}
                  />
                </View>
              </View>
            ))}
          </Card>
        </Animated.View>
      )}

      {stats.lowStock.length === 0 && (
        <Animated.View entering={FadeInDown.delay(240).duration(400)}>
          <Card style={styles.allGoodCard}>
            <Text style={styles.allGoodEmoji}>✅</Text>
            <Text style={[styles.allGoodTitle, { color: Colors.textPrimary }]}>All stocked up!</Text>
            <Text style={[styles.allGoodSub, { color: Colors.textSecondary }]}>No low-stock items right now.</Text>
          </Card>
        </Animated.View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  header: { marginBottom: Spacing.lg, marginTop: Spacing.sm },
  greeting: { fontSize: 14, marginBottom: 2 },
  appName: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  subheading: { fontSize: 14, marginTop: 2 },
  heroCard: { borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.md, flexDirection: 'row', alignItems: 'center', ...Shadow.lg },
  heroCardInner: { flex: 1 },
  heroLabel: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 },
  heroAmount: { fontSize: 36, fontWeight: '800', color: '#FFFFFF', letterSpacing: -1, marginBottom: 12 },
  heroRow: { flexDirection: 'row' },
  heroPill: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: Radius.full },
  heroPillText: { fontSize: 12, color: '#FFFFFF', fontWeight: '600' },
  heroEmoji: { fontSize: 52, marginLeft: Spacing.sm },
  profitRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  profitCard: { flex: 1, borderRadius: Radius.lg, padding: Spacing.sm, alignItems: 'center', paddingVertical: 12 },
  profitLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  profitValue: { fontSize: 14, fontWeight: '800' },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  statCard: { flex: 1, borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center', ...Shadow.sm },
  statEmoji: { fontSize: 24, marginBottom: 6 },
  statValue: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  seeAll: { fontSize: 13, fontWeight: '600' },
  lowStockCard: { marginBottom: Spacing.md, padding: 0, overflow: 'hidden' },
  lowStockItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: 12 },
  lowStockLeft: { flex: 1, marginRight: Spacing.sm },
  lowStockName: { fontSize: 15, fontWeight: '600' },
  lowStockPrice: { fontSize: 12, marginTop: 2 },
  itemDivider: { height: 1 },
  allGoodCard: { alignItems: 'center', paddingVertical: Spacing.lg },
  allGoodEmoji: { fontSize: 36, marginBottom: 8 },
  allGoodTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  allGoodSub: { fontSize: 13 },
});