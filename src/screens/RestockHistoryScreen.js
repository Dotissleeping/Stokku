import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import { getRestocks } from '../database/db';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { DarkColors, LightColors, Radius, Shadow, Spacing } from '../utils/theme';
import { useTheme } from '../utils/ThemeContext';
import { Card, EmptyState } from '../components/UI';

export default function RestockHistoryScreen() {
  const { isDark } = useTheme();
  const Colors = isDark ? DarkColors : LightColors;
  const [restocks, setRestocks] = useState([]);
  const [totalCost, setTotalCost] = useState(0);

  const load = async () => {
    const data = await getRestocks();
    setRestocks(data);
    setTotalCost(data.reduce((sum, r) => sum + r.cost, 0));
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <FlatList
        data={restocks}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          restocks.length > 0 ? (
            <View style={[styles.summaryCard, { backgroundColor: Colors.surface }]}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: Colors.textMuted }]}>Total Restocks</Text>
                <Text style={[styles.summaryValue, { color: Colors.textPrimary }]}>{restocks.length}</Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: Colors.border }]} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: Colors.textMuted }]}>Total Spent</Text>
                <Text style={[styles.summaryValue, { color: Colors.danger }]}>{formatCurrency(totalCost)}</Text>
              </View>
            </View>
          ) : null
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInRight.delay(index * 40).duration(300)}>
            <Card style={styles.restockCard}>
              <View style={styles.restockRow}>
                <View style={styles.restockLeft}>
                  <Text style={[styles.productName, { color: Colors.textPrimary }]}>{item.product_name}</Text>
                  <Text style={[styles.restockDate, { color: Colors.textSecondary }]}>{formatDateTime(item.date)}</Text>
                </View>
                <View style={styles.restockRight}>
                  <Text style={[styles.restockQty, { color: Colors.success }]}>+{item.quantity_added} pcs</Text>
                  <Text style={[styles.restockCost, { color: Colors.danger }]}>{formatCurrency(item.cost)}</Text>
                </View>
              </View>
            </Card>
          </Animated.View>
        )}
        ListEmptyComponent={
          <EmptyState icon="📦" title="No restocks yet" subtitle="Use the Restock button on a product to log your first restock." />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  summaryCard: { borderRadius: Radius.xl, padding: Spacing.md, marginBottom: Spacing.md, flexDirection: 'row', alignItems: 'center', ...Shadow.md },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  summaryValue: { fontSize: 22, fontWeight: '800' },
  summaryDivider: { width: 1, height: 40 },
  restockCard: { marginBottom: Spacing.sm },
  restockRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  restockLeft: { flex: 1 },
  productName: { fontSize: 15, fontWeight: '700' },
  restockDate: { fontSize: 12, marginTop: 3 },
  restockRight: { alignItems: 'flex-end' },
  restockQty: { fontSize: 14, fontWeight: '700' },
  restockCost: { fontSize: 13, fontWeight: '600', marginTop: 2 },
});