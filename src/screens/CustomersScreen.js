import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Alert, Modal, KeyboardAvoidingView, Platform, TextInput, ScrollView,
} from 'react-native';
import Animated, { FadeInDown, FadeInRight, Layout } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import { addCustomer, deleteCustomer, getCustomers, updateCustomer } from '../database/db';
import { formatCurrency, getBalance, isSettled } from '../utils/formatters';
import { DarkColors, LightColors, Radius, Shadow, Spacing } from '../utils/theme';
import { useTheme } from '../utils/ThemeContext';
import { Button, Card, EmptyState, Input } from '../components/UI';

const CustomerFormModal = ({ visible, customer, onClose, onSave }) => {
  const { isDark } = useTheme();
  const Colors = isDark ? DarkColors : LightColors;
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState({});

  React.useEffect(() => {
    if (visible) {
      setName(customer?.name || '');
      setPhone(customer?.phone || '');
      setNote(customer?.note || '');
      setErrors({});
    }
  }, [visible, customer]);

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'Customer name is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    await onSave(name.trim(), phone.trim(), note.trim());
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: Colors.surface }]}>
          <View style={[styles.modalHandle, { backgroundColor: Colors.border }]} />
          <Text style={[styles.modalTitle, { color: Colors.textPrimary }]}>{customer ? 'Edit Customer' : 'New Customer'}</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Input label="Customer Name" value={name} onChangeText={setName} placeholder="e.g. Juan Dela Cruz" error={errors.name} autoFocus />
            <Input label="Phone Number (optional)" value={phone} onChangeText={setPhone} placeholder="09XX XXX XXXX" keyboardType="phone-pad" />
            <Input label="Notes (optional)" value={note} onChangeText={setNote} placeholder="Any notes..." multiline numberOfLines={3} />
          </ScrollView>
          <View style={styles.modalActions}>
            <Button title="Cancel" variant="ghost" onPress={onClose} style={{ flex: 1 }} />
            <Button title={customer ? 'Save Changes' : 'Add Customer'} onPress={handleSave} style={{ flex: 2 }} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const CustomerItem = ({ item, onPress, onEdit, onDelete, index }) => {
  const { isDark } = useTheme();
  const Colors = isDark ? DarkColors : LightColors;
  const balance = getBalance(item);
  const settled = isSettled(item);
  const hasTab = (parseFloat(item.total_bill) || 0) > 0;

  return (
    <Animated.View entering={FadeInRight.delay(index * 40).duration(300)} layout={Layout.springify()}>
      <Card onPress={onPress} style={styles.customerCard}>
        <View style={styles.customerRow}>
          <View style={[styles.avatar, { backgroundColor: Colors.primaryLight }]}>
            <Text style={[styles.avatarText, { color: Colors.primary }]}>{item.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.customerInfo}>
            <View style={styles.customerNameRow}>
              <Text style={[styles.customerName, { color: Colors.textPrimary }]}>{item.name}</Text>
              {settled && <Text style={styles.settledBadge}>✅</Text>}
            </View>
            {item.phone ? <Text style={[styles.customerPhone, { color: Colors.textSecondary }]}>📞 {item.phone}</Text> : null}
            {item.note ? <Text style={[styles.customerNote, { color: Colors.textMuted }]} numberOfLines={1}>📝 {item.note}</Text> : null}
          </View>
          <View style={styles.balanceArea}>
            {hasTab ? (
              <>
                <Text style={[styles.balanceAmount, { color: balance > 0 ? Colors.danger : Colors.success }]}>{formatCurrency(balance)}</Text>
                <Text style={[styles.balanceLabel, { color: Colors.textMuted }]}>{balance > 0 ? 'balance' : 'paid ✓'}</Text>
              </>
            ) : (
              <Text style={[styles.noTab, { color: Colors.textMuted }]}>no tab</Text>
            )}
          </View>
        </View>
        <View style={[styles.customerActions, { borderTopColor: Colors.borderLight }]}>
          <TouchableOpacity onPress={() => onEdit(item)} style={styles.actionBtn}>
            <Text style={[styles.actionBtnText, { color: Colors.textSecondary }]}>✏️  Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onPress} style={styles.actionBtn}>
            <Text style={[styles.actionBtnText, { color: Colors.primary }]}>📋 View Tab</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(item)} style={styles.actionBtn}>
            <Text style={[styles.actionBtnText, { color: Colors.danger }]}>🗑  Delete</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </Animated.View>
  );
};

export default function CustomersScreen({ navigation }) {
  const { isDark } = useTheme();
  const Colors = isDark ? DarkColors : LightColors;
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const load = async () => {
    const data = await getCustomers();
    setCustomers(data);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const filtered = customers.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  const handleSave = async (name, phone, note) => {
    if (editingCustomer) {
      await updateCustomer(editingCustomer.id, name, phone, note);
    } else {
      await addCustomer(name, phone, note);
    }
    load();
  };

  const handleDelete = (item) => {
    Alert.alert('Delete Customer', `Remove "${item.name}"? This will also delete their tab and payment history.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteCustomer(item.id); load(); } },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <Animated.View entering={FadeInDown.duration(300)} style={styles.searchWrapper}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="🔍  Search customers..."
          placeholderTextColor={Colors.textMuted}
          style={[styles.searchInput, { backgroundColor: Colors.surface, color: Colors.textPrimary }]}
        />
      </Animated.View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => (
          <CustomerItem
            item={item} index={index}
            onPress={() => navigation.navigate('CustomerTab', { customer: item })}
            onEdit={(c) => { setEditingCustomer(c); setModalVisible(true); }}
            onDelete={handleDelete}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={[styles.countText, { color: Colors.textSecondary }]}>
              {filtered.length} customer{filtered.length !== 1 ? 's' : ''}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('ReceiptHistory')}>
              <Text style={[styles.historyLink, { color: Colors.primary }]}>🧾 Receipt History →</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="👥"
            title={search ? 'No results found' : 'No customers yet'}
            subtitle={search ? `No customer named "${search}"` : 'Add your first customer to start a tab.'}
          />
        }
      />

      <Animated.View entering={FadeInDown.delay(200)} style={styles.fab}>
        <TouchableOpacity style={[styles.fabButton, { backgroundColor: Colors.primary }]} onPress={() => { setEditingCustomer(null); setModalVisible(true); }} activeOpacity={0.85}>
          <Text style={styles.fabText}>+ Add Customer</Text>
        </TouchableOpacity>
      </Animated.View>

      <CustomerFormModal visible={modalVisible} customer={editingCustomer} onClose={() => setModalVisible(false)} onSave={handleSave} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchWrapper: { padding: Spacing.md, paddingBottom: Spacing.sm },
  searchInput: { borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingVertical: 12, fontSize: 15, ...Shadow.sm },
  listContent: { paddingHorizontal: Spacing.md, paddingBottom: 100 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  countText: { fontSize: 13, fontWeight: '600' },
  historyLink: { fontSize: 13, fontWeight: '600' },
  customerCard: { marginBottom: Spacing.sm, padding: Spacing.md },
  customerRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.sm },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm },
  avatarText: { fontSize: 18, fontWeight: '800' },
  customerInfo: { flex: 1 },
  customerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  customerName: { fontSize: 16, fontWeight: '700' },
  settledBadge: { fontSize: 14 },
  customerPhone: { fontSize: 12, marginTop: 2 },
  customerNote: { fontSize: 12, marginTop: 2, fontStyle: 'italic' },
  balanceArea: { alignItems: 'flex-end' },
  balanceAmount: { fontSize: 16, fontWeight: '800' },
  balanceLabel: { fontSize: 11, marginTop: 1 },
  noTab: { fontSize: 12, fontStyle: 'italic' },
  customerActions: { flexDirection: 'row', borderTopWidth: 1, paddingTop: Spacing.sm },
  actionBtn: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  actionBtnText: { fontSize: 12, fontWeight: '600' },
  fab: { position: 'absolute', bottom: Spacing.lg, left: Spacing.md, right: Spacing.md },
  fabButton: { borderRadius: Radius.lg, paddingVertical: 16, alignItems: 'center', ...Shadow.lg },
  fabText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: { borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.lg, paddingBottom: 34, maxHeight: '85%' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.md },
  modalTitle: { fontSize: 22, fontWeight: '800', marginBottom: Spacing.lg },
  modalActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
});