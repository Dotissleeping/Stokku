import React, { useCallback, useEffect, useState } from 'react';
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
import { Colors, Radius, Shadow, Spacing } from '../utils/theme';
import { Badge, Card, SectionHeader } from '../components/UI';

export default function DashboardScreen({ navigation }) {
  const [stats, setStats] = useState({ totalReceivables: 0, unpaidCount: 0, lowStock: [] });
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (e) {
      console.error(e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(0).duration(400)} style={styles.header}>
        <Text style={styles.greeting}>Good day! 👋</Text>
        <Text style={styles.appName}>Stokku</Text>
        <Text style={styles.subheading}>Your business at a glance</Text>
      </Animated.View>

      {/* Receivables Hero Card */}
      <Animated.View entering={FadeInDown.delay(80).duration(400)}>
        <View style={styles.heroCard}>
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

      {/* Quick Stats */}
      <Animated.View entering={FadeInDown.delay(160).duration(400)} style={styles.statsRow}>
        <TouchableOpacity
          style={styles.statCard}
          onPress={() => navigation.navigate('Customers')}
          activeOpacity={0.85}
        >
          <Text style={styles.statEmoji}>👥</Text>
          <Text style={[styles.statValue, { color: Colors.primary }]}>{stats.unpaidCount}</Text>
          <Text style={styles.statLabel}>Unpaid Tabs</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statCard}
          onPress={() => navigation.navigate('Products')}
          activeOpacity={0.85}
        >
          <Text style={styles.statEmoji}>⚠️</Text>
          <Text style={[styles.statValue, { color: Colors.danger }]}>{stats.lowStock.length}</Text>
          <Text style={styles.statLabel}>Low Stock</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Low Stock Section */}
      {stats.lowStock.length > 0 && (
        <Animated.View entering={FadeInDown.delay(240).duration(400)}>
          <SectionHeader
            title="⚠️  Low Stock Alert"
            right={
              <TouchableOpacity onPress={() => navigation.navigate('Products')}>
                <Text style={styles.seeAll}>Manage →</Text>
              </TouchableOpacity>
            }
          />
          <Card style={styles.lowStockCard}>
            {stats.lowStock.map((item, index) => (
              <View key={item.id}>
                {index > 0 && <View style={styles.itemDivider} />}
                <View style={styles.lowStockItem}>
                  <View style={styles.lowStockLeft}>
                    <Text style={styles.lowStockName}>{item.name}</Text>
                    <Text style={styles.lowStockPrice}>{formatCurrency(item.price)} each</Text>
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
            <Text style={styles.allGoodTitle}>All stocked up!</Text>
            <Text style={styles.allGoodSub}>No low-stock items right now.</Text>
          </Card>
        </Animated.View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  header: {
    marginBottom: Spacing.lg,
    marginTop: Spacing.sm,
  },
  greeting: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  subheading: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 2,
  },
  heroCard: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadow.lg,
  },
  heroCardInner: {
    flex: 1,
  },
  heroLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  heroAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.textInverse,
    letterSpacing: -1,
    marginBottom: 12,
  },
  heroRow: {
    flexDirection: 'row',
  },
  heroPill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  heroPillText: {
    fontSize: 12,
    color: Colors.textInverse,
    fontWeight: '600',
  },
  heroEmoji: {
    fontSize: 52,
    marginLeft: Spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadow.sm,
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  seeAll: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  lowStockCard: {
    marginBottom: Spacing.md,
    padding: 0,
    overflow: 'hidden',
  },
  lowStockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  lowStockLeft: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  lowStockName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  lowStockPrice: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  itemDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  allGoodCard: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  allGoodEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  allGoodTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  allGoodSub: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
