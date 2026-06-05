  import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Alert, Modal, KeyboardAvoidingView, Platform, TextInput,
  ScrollView, Image,
} from 'react-native';
import Animated, { FadeInDown, FadeInRight, Layout } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { addCustomer, deleteCustomer, getCustomers, updateCustomer } from '../database/db';
import { formatCurrency, getBalance, isSettled } from '../utils/formatters';
import { DarkColors, LightColors, Radius, Shadow, Spacing } from '../utils/theme';
import { useTheme } from '../utils/ThemeContext';
import { Button, Card, EmptyState, Input } from '../components/UI';

const copyToLocal = async (uri) => {
  try {
    const filename = `customer_${Date.now()}.jpg`;
    const dest = FileSystem.documentDirectory + filename;
    await FileSystem.copyAsync({ from: uri, to: dest });
    return dest;
  } catch (e) {
    return uri;
  }
};

const CustomerFormModal = ({ visible, customer, onClose, onSave }) => {
  const { isDark } = useTheme();
  const Colors = isDark ? DarkColors : LightColors;
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [errors, setErrors] = useState({});
  const [cameraPermission, requestCameraPermission] = ImagePicker.useCameraPermissions();

  React.useEffect(() => {
    if (visible) {
      setName(customer?.name || '');
      setPhone(customer?.phone || '');
      setNote(customer?.note || '');
      setImageUri(customer?.image_uri || null);
      setErrors({});
    }
  }, [visible, customer]);

  const pickFromFiles = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8, copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets?.length > 0) {
      const localUri = await copyToLocal(result.assets[0].uri);
      setImageUri(localUri);
    }
  };

  const takePhoto = async () => {
    if (!cameraPermission?.granted) {
      const { granted } = await requestCameraPermission();
      if (!granted) { Alert.alert('Permission needed', 'Allow camera access in your phone settings.'); return; }
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8, copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets?.length > 0) {
      const localUri = await copyToLocal(result.assets[0].uri);
      setImageUri(localUri);
    }
  };

  const handleImagePress = () => {
    Alert.alert('Profile Photo', 'Choose an option', [
      { text: 'Browse Files', onPress: pickFromFiles },
      { text: 'Take Photo', onPress: takePhoto },
      imageUri ? { text: 'Remove Photo', style: 'destructive', onPress: () => setImageUri(null) } : null,
      { text: 'Cancel', style: 'cancel' },
    ].filter(Boolean));
  };

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'Customer name is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    await onSave(name.trim(), phone.trim(), note.trim(), imageUri);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: Colors.surface }]}>
          <View style={[styles.modalHandle, { backgroundColor: Colors.border }]} />
          <Text style={[styles.modalTitle, { color: Colors.textPrimary }]}>{customer ? 'Edit Customer' : 'New Customer'}</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Profile Photo Picker */}
            <TouchableOpacity onPress={handleImagePress} style={styles.avatarPicker} activeOpacity={0.8}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.avatarPreview} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: Colors.primaryLight }]}>
                  <Ionicons name="person-outline" size={36} color={Colors.primary} />
                </View>
              )}
              <View style={[styles.avatarEditBadge, { backgroundColor: Colors.primary }]}>
                <Ionicons name="pencil" size={12} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

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
          {item.image_uri ? (
            <Image source={{ uri: item.image_uri }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: Colors.primaryLight }]}>
              <Text style={[styles.avatarText, { color: Colors.primary }]}>{item.name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.customerInfo}>
            <View style={styles.customerNameRow}>
              <Text style={[styles.customerName, { color: Colors.textPrimary }]}>{item.name}</Text>
              {settled && <Ionicons name="checkmark-circle" size={16} color={Colors.success} />}
            </View>
            {item.phone ? (
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={12} color={Colors.textSecondary} />
                <Text style={[styles.customerPhone, { color: Colors.textSecondary }]}>{item.phone}</Text>
              </View>
            ) : null}
            {item.note ? (
              <View style={styles.infoRow}>
                <Ionicons name="document-text-outline" size={12} color={Colors.textMuted} />
                <Text style={[styles.customerNote, { color: Colors.textMuted }]} numberOfLines={1}>{item.note}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.balanceArea}>
            {hasTab ? (
              <>
                <Text style={[styles.balanceAmount, { color: balance > 0 ? Colors.danger : Colors.success }]}>{formatCurrency(balance)}</Text>
                <Text style={[styles.balanceLabel, { color: Colors.textMuted }]}>{balance > 0 ? 'balance' : 'paid'}</Text>
              </>
            ) : (
              <Text style={[styles.noTab, { color: Colors.textMuted }]}>no tab</Text>
            )}
          </View>
        </View>
        <View style={[styles.customerActions, { borderTopColor: Colors.borderLight }]}>
          <TouchableOpacity onPress={() => onEdit(item)} style={styles.actionBtn}>
            <Ionicons name="pencil-outline" size={14} color={Colors.textSecondary} />
            <Text style={[styles.actionBtnText, { color: Colors.textSecondary }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onPress} style={styles.actionBtn}>
            <Ionicons name="list-outline" size={14} color={Colors.primary} />
            <Text style={[styles.actionBtnText, { color: Colors.primary }]}>View Tab</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(item)} style={styles.actionBtn}>
            <Ionicons name="trash-outline" size={14} color={Colors.danger} />
            <Text style={[styles.actionBtnText, { color: Colors.danger }]}>Delete</Text>
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

  const load = async () => { const data = await getCustomers(); setCustomers(data); };
  useFocusEffect(useCallback(() => { load(); }, []));

  const filtered = customers.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  const handleSave = async (name, phone, note, imageUri) => {
    if (editingCustomer) {
      await updateCustomer(editingCustomer.id, name, phone, note, imageUri);
    } else {
      await addCustomer(name, phone, note, imageUri);
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
        <View style={[styles.searchContainer, { backgroundColor: Colors.surface }]}>
          <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search customers..."
            placeholderTextColor={Colors.textMuted}
            style={[styles.searchInput, { color: Colors.textPrimary }]}
          />
        </View>
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
            <TouchableOpacity onPress={() => navigation.navigate('ReceiptHistory')} style={styles.historyBtn}>
              <Ionicons name="receipt-outline" size={14} color={Colors.primary} />
              <Text style={[styles.historyLink, { color: Colors.primary }]}>Receipt History</Text>
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
        <TouchableOpacity
          style={[styles.fabButton, { backgroundColor: Colors.primary }]}
          onPress={() => { setEditingCustomer(null); setModalVisible(true); }}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.fabText}>Add Customer</Text>
        </TouchableOpacity>
      </Animated.View>

      <CustomerFormModal
        visible={modalVisible}
        customer={editingCustomer}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchWrapper: { padding: Spacing.md, paddingBottom: Spacing.sm },
  searchContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingVertical: 12, gap: 8, ...Shadow.sm },
  searchInput: { flex: 1, fontSize: 15 },
  listContent: { paddingHorizontal: Spacing.md, paddingBottom: 100 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  countText: { fontSize: 13, fontWeight: '600' },
  historyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  historyLink: { fontSize: 13, fontWeight: '600' },
  customerCard: { marginBottom: Spacing.sm, padding: Spacing.md },
  customerRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.sm },
  avatarImage: { width: 48, height: 48, borderRadius: 24, marginRight: Spacing.sm },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm },
  avatarText: { fontSize: 18, fontWeight: '800' },
  customerInfo: { flex: 1 },
  customerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  customerName: { fontSize: 16, fontWeight: '700' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  customerPhone: { fontSize: 12 },
  customerNote: { fontSize: 12, fontStyle: 'italic', flex: 1 },
  balanceArea: { alignItems: 'flex-end' },
  balanceAmount: { fontSize: 16, fontWeight: '800' },
  balanceLabel: { fontSize: 11, marginTop: 1 },
  noTab: { fontSize: 12, fontStyle: 'italic' },
  customerActions: { flexDirection: 'row', borderTopWidth: 1, paddingTop: Spacing.sm },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 4 },
  actionBtnText: { fontSize: 12, fontWeight: '600' },
  fab: { position: 'absolute', bottom: Spacing.lg, left: Spacing.md, right: Spacing.md },
  fabButton: { borderRadius: Radius.lg, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, ...Shadow.lg },
  fabText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: { borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.lg, paddingBottom: 34, maxHeight: '90%' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.md },
  modalTitle: { fontSize: 22, fontWeight: '800', marginBottom: Spacing.lg },
  modalActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  avatarPicker: { alignSelf: 'center', marginBottom: Spacing.lg, position: 'relative' },
  avatarPreview: { width: 90, height: 90, borderRadius: 45 },
  avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center' },
  avatarEditBadge: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
});