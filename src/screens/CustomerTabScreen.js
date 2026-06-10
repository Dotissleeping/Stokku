import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  Modal, KeyboardAvoidingView, Platform, ScrollView, TextInput,
} from 'react-native';
import Animated, { FadeInDown, FadeInRight, Layout } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  addPayment, addTabItem, decrementStock, deletePayment,
  getCustomerById, getPayments, getProducts, getTabItems,
  removeTabItem, saveReceiptSnapshot, voidTabItem,
} from '../database/db';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { DarkColors, LightColors, Radius, Shadow, Spacing } from '../utils/theme';
import { useTheme } from '../utils/ThemeContext';
import { Button, Card, Divider, SectionHeader } from '../components/UI';

// ─── Add Item Modal ───────────────────────────────────────────────────────────

const AddItemModal = ({ visible, onClose, onAdd }) => {
  const { isDark } = useTheme();
  const Colors = isDark ? DarkColors : LightColors;
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [qty, setQty] = useState('1');
  const [selected, setSelected] = useState(null);

  React.useEffect(() => {
    if (visible) { loadProducts(); setSearch(''); setQty('1'); setSelected(null); }
  }, [visible]);

  const loadProducts = async () => { const data = await getProducts(); setProducts(data); };
  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  const handleAdd = async () => {
    if (!selected) return Alert.alert('Select a product first');
    const q = parseInt(qty);
    if (!q || q <= 0) return Alert.alert('Enter a valid quantity');
    if (q > selected.quantity) return Alert.alert('Insufficient Stock', `Only ${selected.quantity} in stock.`);
    await onAdd(selected, q);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: Colors.surface }]}>
          <View style={[styles.modalHandle, { backgroundColor: Colors.border }]} />
          <Text style={[styles.modalTitle, { color: Colors.textPrimary }]}>Add Item to Tab</Text>
          <TextInput
            value={search} onChangeText={setSearch}
            placeholder="Search products..."
            placeholderTextColor={Colors.textMuted}
            style={[styles.searchInput, { backgroundColor: Colors.surfaceAlt, color: Colors.textPrimary, borderColor: Colors.border }]}
          />
          <ScrollView style={styles.productList} showsVerticalScrollIndicator={false}>
            {filtered.length === 0 && <Text style={[styles.emptyText, { color: Colors.textMuted }]}>No products found</Text>}
            {filtered.map((p) => (
              <TouchableOpacity
                key={p.id} onPress={() => p.quantity > 0 && setSelected(p)} activeOpacity={0.8}
                style={[styles.productRow, selected?.id === p.id && { backgroundColor: Colors.primaryLight }, p.quantity === 0 && styles.productRowDisabled]}
              >
                <View style={styles.productInfo}>
                  <Text style={[styles.productName, { color: p.quantity === 0 ? Colors.textMuted : Colors.textPrimary }]}>{p.name}</Text>
                  <Text style={[styles.productMeta, { color: Colors.textSecondary }]}>{formatCurrency(p.price)} · {p.quantity} in stock</Text>
                </View>
                {selected?.id === p.id && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
          {selected && (
            <View style={styles.qtyRow}>
              <Text style={[styles.qtyLabel, { color: Colors.textPrimary }]}>Quantity:</Text>
              <TouchableOpacity onPress={() => setQty(Math.max(1, parseInt(qty || 1) - 1).toString())} style={[styles.qtyBtn, { backgroundColor: Colors.primaryLight }]}>
                <Text style={[styles.qtyBtnText, { color: Colors.primary }]}>−</Text>
              </TouchableOpacity>
              <TextInput value={qty} onChangeText={setQty} keyboardType="number-pad" style={[styles.qtyInput, { color: Colors.textPrimary, borderBottomColor: Colors.primary }]} />
              <TouchableOpacity onPress={() => setQty(Math.min(selected.quantity, parseInt(qty || 0) + 1).toString())} style={[styles.qtyBtn, { backgroundColor: Colors.primaryLight }]}>
                <Text style={[styles.qtyBtnText, { color: Colors.primary }]}>+</Text>
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
  const { isDark } = useTheme();
  const Colors = isDark ? DarkColors : LightColors;
  const [amount, setAmount] = useState('');

  React.useEffect(() => { if (visible) setAmount(''); }, [visible]);

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
        <View style={[styles.modalSheet, { backgroundColor: Colors.surface, maxHeight: 320 }]}>
          <View style={[styles.modalHandle, { backgroundColor: Colors.border }]} />
          <Text style={[styles.modalTitle, { color: Colors.textPrimary }]}>Record Payment</Text>
          <Text style={[styles.paymentBalance, { color: Colors.textSecondary }]}>Remaining: {formatCurrency(maxAmount)}</Text>
          <TextInput
            value={amount} onChangeText={setAmount} placeholder="₱ 0.00"
            placeholderTextColor={Colors.textMuted} keyboardType="decimal-pad" autoFocus
            style={[styles.paymentInput, { backgroundColor: Colors.surfaceAlt, color: Colors.textPrimary, borderColor: Colors.primary }]}
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

// ─── Void Modal ───────────────────────────────────────────────────────────────

const VoidModal = ({ visible, item, onClose, onVoid }) => {
  const { isDark } = useTheme();
  const Colors = isDark ? DarkColors : LightColors;
  const [qty, setQty] = useState('1');

  React.useEffect(() => { if (visible) setQty('1'); }, [visible]);

  const handleVoid = async () => {
    const q = parseInt(qty);
    if (!q || q <= 0) return Alert.alert('Enter a valid quantity');
    if (q > item.quantity) return Alert.alert('Too many', `Only ${item.quantity} in tab.`);
    await onVoid(item, q);
    onClose();
  };

  if (!item) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: Colors.surface, maxHeight: '60%' }]}>
          <View style={[styles.modalHandle, { backgroundColor: Colors.border }]} />
          <View style={styles.voidHeader}>
            <Ionicons name="ban-outline" size={24} color={Colors.warning} />
            <Text style={[styles.modalTitle, { color: Colors.textPrimary, marginBottom: 0, marginLeft: 8 }]}>Void Item</Text>
          </View>
          <Text style={[styles.voidProductName, { color: Colors.textSecondary }]}>{item.product_name}</Text>
          <Text style={[styles.voidSubtitle, { color: Colors.textMuted }]}>
            {item.quantity} in tab · {formatCurrency(item.price)} each
          </Text>
          <Text style={[styles.voidNote, { color: Colors.textMuted }]}>
            Voided items will be returned to inventory stock.
          </Text>
          <View style={styles.qtyRow}>
            <Text style={[styles.qtyLabel, { color: Colors.textPrimary }]}>Void Qty:</Text>
            <TouchableOpacity onPress={() => setQty(Math.max(1, parseInt(qty || 1) - 1).toString())} style={[styles.qtyBtn, { backgroundColor: Colors.warningLight }]}>
              <Text style={[styles.qtyBtnText, { color: Colors.warning }]}>−</Text>
            </TouchableOpacity>
            <TextInput value={qty} onChangeText={setQty} keyboardType="number-pad" style={[styles.qtyInput, { color: Colors.textPrimary, borderBottomColor: Colors.warning }]} />
            <TouchableOpacity onPress={() => setQty(Math.min(item.quantity, parseInt(qty || 0) + 1).toString())} style={[styles.qtyBtn, { backgroundColor: Colors.warningLight }]}>
              <Text style={[styles.qtyBtnText, { color: Colors.warning }]}>+</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalActions}>
            <Button title="Cancel" variant="ghost" onPress={onClose} style={{ flex: 1 }} />
            <Button title="Void Item" variant="danger" onPress={handleVoid} style={{ flex: 2 }} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CustomerTabScreen({ route, navigation }) {
  const { isDark } = useTheme();
  const Colors = isDark ? DarkColors : LightColors;
  const { customer: initCustomer } = route.params;
  const [customer, setCustomer] = useState(initCustomer);
  const [tabItems, setTabItems] = useState([]);
  const [payments, setPayments] = useState([]);
  const [addItemVisible, setAddItemVisible] = useState(false);
  const [paymentVisible, setPaymentVisible] = useState(false);
  const [voidModalVisible, setVoidModalVisible] = useState(false);
  const [voidingItem, setVoidingItem] = useState(null);

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
    setCustomer(c); setTabItems(items); setPayments(pays);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: customer?.name || 'Tab',
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate('Receipt', { customerId: initCustomer.id })} style={{ marginRight: 4 }}>
          <Ionicons name="receipt-outline" size={22} color={Colors.primary} />
        </TouchableOpacity>
      ),
    });
  }, [customer, Colors]);

  const handleAddItem = async (product, quantity) => {
    await addTabItem(initCustomer.id, product.id, product.name, product.price, quantity);
    await decrementStock(product.id, quantity);
    load();
  };

  const handleRemoveItem = (item) => {
    Alert.alert('Remove Item', `Remove all ${item.product_name} from this tab?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove All', style: 'destructive', onPress: async () => { await removeTabItem(item.id, item.product_id, item.quantity); load(); } },
    ]);
  };

  const handleVoidItem = async (item, qty) => {
    await voidTabItem(item.id, item.product_id, qty);
    load();
  };

  const handlePayment = async (amount) => {
    await addPayment(initCustomer.id, amount);
    const items = await getTabItems(initCustomer.id);
    const pays = await getPayments(initCustomer.id);
    const bill = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const paid = pays.reduce((sum, p) => sum + p.amount, 0);
    await saveReceiptSnapshot(initCustomer.id, customer?.name || initCustomer.name, items, pays, bill, paid, Math.max(0, bill - paid));
    load();
  };

  const handleDeletePayment = (payment) => {
    Alert.alert('Undo Payment', `Remove payment of ${formatCurrency(payment.amount)}? The balance will be restored.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => { await deletePayment(payment.id); load(); } },
    ]);
  };

  const handleSettle = () => {
    if (balance <= 0) return;
    Alert.alert('Settle Full Balance', `Pay remaining ${formatCurrency(balance)}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Settle',
        onPress: async () => {
          await addPayment(initCustomer.id, balance);
          const items = await getTabItems(initCustomer.id);
          const pays = await getPayments(initCustomer.id);
          const bill = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
          const paid = pays.reduce((sum, p) => sum + p.amount, 0);
          await saveReceiptSnapshot(initCustomer.id, customer?.name || initCustomer.name, items, pays, bill, paid, 0);
          load();
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Balance Summary */}
        <Animated.View entering={FadeInDown.duration(300)}>
          <View style={[styles.summaryCard, { backgroundColor: Colors.surface }, settled && { borderWidth: 2, borderColor: Colors.success }]}>
            {settled && (
              <View style={styles.settledBanner}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                <Text style={[styles.settledText, { color: Colors.success }]}>Fully Paid!</Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: Colors.textMuted }]}>Total Bill</Text>
                <Text style={[styles.summaryValue, { color: Colors.textPrimary }]}>{formatCurrency(totalBill)}</Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: Colors.border }]} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: Colors.textMuted }]}>Total Paid</Text>
                <Text style={[styles.summaryValue, { color: Colors.success }]}>{formatCurrency(totalPaid)}</Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: Colors.border }]} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: Colors.textMuted }]}>Balance</Text>
                <Text style={[styles.summaryValue, { color: balance > 0 ? Colors.danger : Colors.success }]}>{formatCurrency(balance)}</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View entering={FadeInDown.delay(80).duration(300)} style={styles.actionsRow}>
          <Button title="Add Item" onPress={() => setAddItemVisible(true)} style={{ flex: 1 }} />
          {balance > 0 && (
            <>
              <Button title="Pay" variant="secondary" onPress={() => setPaymentVisible(true)} style={{ flex: 1 }} />
              <Button title="Settle" variant="success" onPress={handleSettle} style={{ flex: 1 }} />
            </>
          )}
        </Animated.View>

        {/* Tab Items */}
        <Animated.View entering={FadeInDown.delay(120).duration(300)}>
          <SectionHeader title={`Tab Items (${tabItems.length})`} />
          {tabItems.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={[styles.emptyText, { color: Colors.textMuted }]}>No items yet — add from inventory</Text>
            </Card>
          ) : (
            <Card style={styles.itemsCard}>
              {tabItems.map((item, index) => (
                <View key={item.id}>
                  {index > 0 && <Divider />}
                  <Animated.View entering={FadeInRight.delay(index * 30)} layout={Layout.springify()} style={styles.tabItem}>
                    <View style={styles.tabItemLeft}>
                      <Text style={[styles.tabItemName, { color: Colors.textPrimary }]}>{item.product_name}</Text>
                      <Text style={[styles.tabItemMeta, { color: Colors.textSecondary }]}>{formatCurrency(item.price)} × {item.quantity}</Text>
                    </View>
                    <View style={styles.tabItemRight}>
                      <Text style={[styles.tabItemTotal, { color: Colors.textPrimary }]}>{formatCurrency(item.price * item.quantity)}</Text>
                      <TouchableOpacity
                        onPress={() => { setVoidingItem(item); setVoidModalVisible(true); }}
                        style={[styles.voidBtn, { backgroundColor: Colors.warningLight }]}
                      >
                        <Ionicons name="ban-outline" size={14} color={Colors.warning} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleRemoveItem(item)} style={styles.removeBtn}>
                        <Ionicons name="close" size={16} color={Colors.danger} />
                      </TouchableOpacity>
                    </View>
                  </Animated.View>
                </View>
              ))}
              <Divider style={{ marginVertical: 8 }} />
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: Colors.textPrimary }]}>Total</Text>
                <Text style={[styles.totalValue, { color: Colors.primary }]}>{formatCurrency(totalBill)}</Text>
              </View>
            </Card>
          )}
        </Animated.View>

        {/* Payment Log */}
        <Animated.View entering={FadeInDown.delay(200).duration(300)} style={{ marginTop: Spacing.lg }}>
          <SectionHeader title={`Payment Log (${payments.length})`} />
          {payments.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={[styles.emptyText, { color: Colors.textMuted }]}>No payments recorded yet</Text>
            </Card>
          ) : (
            <Card style={styles.itemsCard}>
              {payments.map((pay, index) => (
                <View key={pay.id}>
                  {index > 0 && <Divider />}
                  <View style={styles.paymentItem}>
                    <View style={styles.paymentLeft}>
                      <Text style={[styles.paymentAmount, { color: Colors.success }]}>{formatCurrency(pay.amount)}</Text>
                      <Text style={[styles.paymentDate, { color: Colors.textSecondary }]}>{formatDateTime(pay.date)}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDeletePayment(pay)} style={[styles.undoBtn, { backgroundColor: Colors.dangerLight }]}>
                      <Text style={[styles.undoBtnText, { color: Colors.danger }]}>Undo</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </Card>
          )}
        </Animated.View>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      <AddItemModal visible={addItemVisible} onClose={() => setAddItemVisible(false)} onAdd={handleAddItem} />
      <PaymentModal visible={paymentVisible} maxAmount={balance} onClose={() => setPaymentVisible(false)} onPay={handlePayment} />
      <VoidModal visible={voidModalVisible} item={voidingItem} onClose={() => { setVoidModalVisible(false); setVoidingItem(null); }} onVoid={handleVoidItem} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  summaryCard: { borderRadius: Radius.xl, padding: Spacing.md, marginBottom: Spacing.md, ...Shadow.md },
  settledBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12, gap: 8 },
  settledText: { fontSize: 16, fontWeight: '700' },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: '800' },
  summaryDivider: { width: 1, height: 40 },
  actionsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  itemsCard: { padding: 0, overflow: 'hidden' },
  tabItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 12 },
  tabItemLeft: { flex: 1 },
  tabItemName: { fontSize: 15, fontWeight: '600' },
  tabItemMeta: { fontSize: 13, marginTop: 2 },
  tabItemRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tabItemTotal: { fontSize: 15, fontWeight: '700' },
  voidBtn: { padding: 6, borderRadius: Radius.sm },
  removeBtn: { padding: 6 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm },
  totalLabel: { fontSize: 15, fontWeight: '700' },
  totalValue: { fontSize: 16, fontWeight: '800' },
  paymentItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 12 },
  paymentLeft: { flex: 1 },
  paymentAmount: { fontSize: 15, fontWeight: '700' },
  paymentDate: { fontSize: 12, marginTop: 2 },
  undoBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full },
  undoBtnText: { fontSize: 12, fontWeight: '700' },
  emptyCard: { alignItems: 'center', paddingVertical: Spacing.md },
  emptyText: { fontSize: 14, fontStyle: 'italic' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: { borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.lg, paddingBottom: 34, maxHeight: '80%' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.md },
  modalTitle: { fontSize: 22, fontWeight: '800', marginBottom: Spacing.md },
  searchInput: { borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 10, fontSize: 14, marginBottom: Spacing.sm, borderWidth: 1 },
  productList: { maxHeight: 280 },
  productRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: Spacing.sm, borderRadius: Radius.md, marginBottom: 4 },
  productRowDisabled: { opacity: 0.4 },
  productInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: '600' },
  productMeta: { fontSize: 12, marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.md, marginVertical: Spacing.sm },
  qtyLabel: { fontSize: 15, fontWeight: '600' },
  qtyBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { fontSize: 20, fontWeight: '700' },
  qtyInput: { width: 60, textAlign: 'center', fontSize: 18, fontWeight: '700', borderBottomWidth: 2 },
  paymentBalance: { fontSize: 15, marginBottom: Spacing.md },
  paymentInput: { borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 14, fontSize: 22, fontWeight: '700', textAlign: 'center', borderWidth: 2, marginBottom: Spacing.md },
  modalActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  voidHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  voidProductName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  voidSubtitle: { fontSize: 13, marginBottom: 4 },
  voidNote: { fontSize: 12, fontStyle: 'italic', marginBottom: Spacing.md },
});