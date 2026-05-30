import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
} from 'react-native';
import Animated, { FadeInDown, FadeInRight, Layout } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import {
  addPayment,
  addTabItem,
  decrementStock,
  deletePayment,
  getCustomerById,
  getPayments,
  getProducts,
  getTabItems,
  removeTabItem,
} from '../database/db';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { Colors, Radius, Shadow, Spacing } from '../utils/theme';
import { Badge, Button, Card, Divider, EmptyState, SectionHeader } from '../components/UI';

// ─── Add Item Modal ───────────────────────────────────────────────────────────

const AddItemModal = ({ visible, onClose, onAdd }) => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [qty, setQty] = useState('1');
  const [selected, setSelected] = useState(null);

  React.useEffect(() => {
    if (visible) {
      loadProducts();
      setSearch('');
      setQty('1');
      setSelected(null);
    }
  }, [visible]);

  const loadProducts = async () => {
    const data = await getProducts();
    setProducts(data);
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    if (!selected) return Alert.alert('Select a product first');
    const q = parseInt(qty);
    if (!q || q <= 0) return Alert.alert('Enter a valid quantity');
    if (q > selected.quantity) {
      return Alert.alert('Insufficient Stock', `Only ${selected.quantity} in stock.`);
    }
    await onAdd(selected, q);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Add Item to Tab</Text>

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="🔍  Search products..."
            placeholderTextColor={Colors.textMuted}
            style={styles.searchInput}
          />

          <ScrollView style={styles.productList} showsVerticalScrollIndicator={false}>
            {filtered.length === 0 && (
              <Text style={styles.emptyText}>No products found</Text>
            )}
            {filtered.map((p) => (
              <TouchableOpacity
                key={p.id}
                onPress={() => p.quantity > 0 && setSelected(p)}
                activeOpacity={0.8}
                style={[
                  styles.productRow,
                  selected?.id === p.id && styles.productRowSelected,
                  p.quantity === 0 && styles.productRowDisabled,
                ]}
              >
                <View style={styles.productInfo}>
                  <Text style={[styles.productName, p.quantity === 0 && { color: Colors.textMuted }]}>
                    {p.name}
                  </Text>
                  <Text style={styles.productMeta}>{formatCurrency(p.price)} · {p.quantity} in stock</Text>
                </View>
                {selected?.id === p.id && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {selected && (
            <View style={styles.qtyRow}>
              <Text style={styles.qtyLabel}>Quantity:</Text>
              <TouchableOpacity onPress={() => setQty(Math.max(1, parseInt(qty || 1) - 1).toString())} style={styles.qtyBtn}>
                <Text style={styles.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <TextInput
                value={qty}
                onChangeText={setQty}
                keyboardType="number-pad"
                style={styles.qtyInput}
              />
              <TouchableOpacity
                onPress={() => setQty(Math.min(selected.quantity, parseInt(qty || 0) + 1).toString())}
                style={styles.qtyBtn}
              >
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.modalActions}>
            <Button title="Cancel" variant="ghost" onPress={onClose} style={{ flex: 1 }} />
            <Button title="Add to Tab" onPress={handleAdd} disabled={!selected} style={{ flex: 2 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Payment Modal ────────────────────────────────────────────────────────────

const PaymentModal = ({ visible, maxAmount, onClose, onPay }) => {
  const [amount, setAmount] = useState('');

  React.useEffect(() => {
    if (visible) setAmount('');
  }, [visible]);

  const handlePay = async () => {
    const a = parseFloat(amount);
    if (!a || a <= 0) return Alert.alert('Enter a valid amount');
    if (a > maxAmount + 0.01) return Alert.alert('Amount exceeds remaining balance');
    await onPay(a);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { maxHeight: 320 }]}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Record Payment</Text>
          <Text style={styles.paymentBalance}>Remaining: {formatCurrency(maxAmount)}</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="₱ 0.00"
            placeholderTextColor={Colors.textMuted}
            keyboardType="decimal-pad"
            style={styles.paymentInput}
            autoFocus
          />
          <View style={styles.modalActions}>
            <Button title="Cancel" variant="ghost" onPress={onClose} style={{ flex: 1 }} />
            <Button title="Record Payment" onPress={handlePay} style={{ flex: 2 }} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CustomerTabScreen({ route, navigation }) {
  const { customer: initCustomer } = route.params;
  const [customer, setCustomer] = useState(initCustomer);
  const [tabItems, setTabItems] = useState([]);
  const [payments, setPayments] = useState([]);
  const [addItemVisible, setAddItemVisible] = useState(false);
  const [paymentVisible, setPaymentVisible] = useState(false);

  const totalBill = tabItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = Math.max(0, totalBill - totalPaid);
  const settled = balance === 0 && totalBill > 0;

  const load = async () => {
    const [c, items, pays] = await Promise.all([
      getCustomerById(initCustomer.id),
      getTabItems(initCustomer.id),
      getPayments(initCustomer.id),
    ]);
    setCustomer(c);
    setTabItems(items);
    setPayments(pays);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: customer?.name || 'Tab',
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('Receipt', { customerId: initCustomer.id })}
          style={{ marginRight: 4 }}
        >
          <Text style={{ fontSize: 22 }}>🧾</Text>
        </TouchableOpacity>
      ),
    });
  }, [customer]);

  const handleAddItem = async (product, quantity) => {
    await addTabItem(initCustomer.id, product.id, product.name, product.price, quantity);
    await decrementStock(product.id, quantity);
    load();
  };

  const handleRemoveItem = (item) => {
    Alert.alert('Remove Item', `Remove ${item.product_name} from this tab?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await removeTabItem(item.id, item.product_id, item.quantity);
          load();
        },
      },
    ]);
  };

  const handlePayment = async (amount) => {
    await addPayment(initCustomer.id, amount);
    load();
  };

  const handleDeletePayment = (payment) => {
    Alert.alert(
      'Undo Payment',
      `Remove payment of ${formatCurrency(payment.amount)}? The balance will be restored.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await deletePayment(payment.id);
            load();
          },
        },
      ]
    );
  };

  const handleSettle = () => {
    if (balance <= 0) return;
    Alert.alert(
      'Settle Full Balance',
      `Pay remaining ${formatCurrency(balance)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Settle',
          onPress: async () => {
            await addPayment(initCustomer.id, balance);
            load();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Balance Summary */}
        <Animated.View entering={FadeInDown.duration(300)}>
          <View style={[styles.summaryCard, settled && styles.summaryCardSettled]}>
            {settled ? (
              <View style={styles.settledBanner}>
                <Text style={styles.settledEmoji}>✅</Text>
                <Text style={styles.settledText}>Fully Paid!</Text>
              </View>
            ) : null}
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Bill</Text>
                <Text style={styles.summaryValue}>{formatCurrency(totalBill)}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Paid</Text>
                <Text style={[styles.summaryValue, { color: Colors.success }]}>{formatCurrency(totalPaid)}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Balance</Text>
                <Text style={[styles.summaryValue, { color: balance > 0 ? Colors.danger : Colors.success }]}>
                  {formatCurrency(balance)}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View entering={FadeInDown.delay(80).duration(300)} style={styles.actionsRow}>
          <Button
            title="+ Add Item"
            onPress={() => setAddItemVisible(true)}
            style={{ flex: 1 }}
          />
          {balance > 0 && (
            <>
              <Button
                title="💳 Pay"
                variant="secondary"
                onPress={() => setPaymentVisible(true)}
                style={{ flex: 1 }}
              />
              <Button
                title="Settle"
                variant="success"
                onPress={handleSettle}
                style={{ flex: 1 }}
              />
            </>
          )}
        </Animated.View>

        {/* Tab Items */}
        <Animated.View entering={FadeInDown.delay(120).duration(300)}>
          <SectionHeader title={`📋 Tab Items (${tabItems.length})`} />
          {tabItems.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>No items yet — add from inventory</Text>
            </Card>
          ) : (
            <Card style={styles.itemsCard}>
              {tabItems.map((item, index) => (
                <View key={item.id}>
                  {index > 0 && <Divider />}
                  <Animated.View
                    entering={FadeInRight.delay(index * 30)}
                    layout={Layout.springify()}
                    style={styles.tabItem}
                  >
                    <View style={styles.tabItemLeft}>
                      <Text style={styles.tabItemName}>{item.product_name}</Text>
                      <Text style={styles.tabItemMeta}>
                        {formatCurrency(item.price)} × {item.quantity}
                      </Text>
                    </View>
                    <View style={styles.tabItemRight}>
                      <Text style={styles.tabItemTotal}>{formatCurrency(item.price * item.quantity)}</Text>
                      <TouchableOpacity onPress={() => handleRemoveItem(item)} style={styles.removeBtn}>
                        <Text style={styles.removeBtnText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </Animated.View>
                </View>
              ))}
              <Divider style={{ marginVertical: 8 }} />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatCurrency(totalBill)}</Text>
              </View>
            </Card>
          )}
        </Animated.View>

        {/* Payment Log */}
        <Animated.View entering={FadeInDown.delay(200).duration(300)} style={{ marginTop: Spacing.lg }}>
          <SectionHeader title={`💰 Payment Log (${payments.length})`} />
          {payments.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>No payments recorded yet</Text>
            </Card>
          ) : (
            <Card style={styles.itemsCard}>
              {payments.map((pay, index) => (
                <View key={pay.id}>
                  {index > 0 && <Divider />}
                  <View style={styles.paymentItem}>
                    <View style={styles.paymentLeft}>
                      <Text style={styles.paymentAmount}>{formatCurrency(pay.amount)}</Text>
                      <Text style={styles.paymentDate}>{formatDateTime(pay.date)}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeletePayment(pay)}
                      style={styles.undoBtn}
                    >
                      <Text style={styles.undoBtnText}>↩ Undo</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </Card>
          )}
        </Animated.View>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      <AddItemModal
        visible={addItemVisible}
        onClose={() => setAddItemVisible(false)}
        onAdd={handleAddItem}
      />
      <PaymentModal
        visible={paymentVisible}
        maxAmount={balance}
        onClose={() => setPaymentVisible(false)}
        onPay={handlePayment}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl },

  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadow.md,
  },
  summaryCardSettled: { borderWidth: 2, borderColor: Colors.success },
  settledBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12, gap: 8 },
  settledEmoji: { fontSize: 20 },
  settledText: { fontSize: 16, fontWeight: '700', color: Colors.success },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  summaryDivider: { width: 1, height: 40, backgroundColor: Colors.border },

  actionsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },

  itemsCard: { padding: 0, overflow: 'hidden' },
  tabItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 12 },
  tabItemLeft: { flex: 1 },
  tabItemName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  tabItemMeta: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  tabItemRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  tabItemTotal: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  removeBtn: { padding: 6 },
  removeBtnText: { fontSize: 14, color: Colors.danger, fontWeight: '700' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm },
  totalLabel: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  totalValue: { fontSize: 16, fontWeight: '800', color: Colors.primary },

  paymentItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 12 },
  paymentLeft: { flex: 1 },
  paymentAmount: { fontSize: 15, fontWeight: '700', color: Colors.success },
  paymentDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  undoBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: Colors.dangerLight,
    borderRadius: Radius.full,
  },
  undoBtnText: { fontSize: 12, fontWeight: '700', color: Colors.danger },

  emptyCard: { alignItems: 'center', paddingVertical: Spacing.md },
  emptyText: { fontSize: 14, color: Colors.textMuted, fontStyle: 'italic' },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    paddingBottom: 34,
    maxHeight: '80%',
  },
  modalHandle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.md },
  modalTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.md },
  searchInput: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  productList: { maxHeight: 280 },
  productRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md, marginBottom: 4,
  },
  productRowSelected: { backgroundColor: Colors.primaryLight },
  productRowDisabled: { opacity: 0.4 },
  productInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  productMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  checkmark: { fontSize: 18, color: Colors.primary, fontWeight: '800' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.md, marginVertical: Spacing.sm },
  qtyLabel: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  qtyBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { fontSize: 20, color: Colors.primary, fontWeight: '700' },
  qtyInput: { width: 60, textAlign: 'center', fontSize: 18, fontWeight: '700', color: Colors.textPrimary, borderBottomWidth: 2, borderBottomColor: Colors.primary },
  paymentBalance: { fontSize: 15, color: Colors.textSecondary, marginBottom: Spacing.md },
  paymentInput: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    marginBottom: Spacing.md,
  },
  modalActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
});