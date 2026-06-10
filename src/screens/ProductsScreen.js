import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Alert, Modal, KeyboardAvoidingView, Platform,
  ScrollView, Image,
} from 'react-native';
import Animated, { FadeInDown, FadeInRight, Layout } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { addProduct, addRestock, deleteProduct, getDb, getProducts, updateProduct } from '../database/db';
import { formatCurrency } from '../utils/formatters';
import { DarkColors, LightColors, Radius, Shadow, Spacing } from '../utils/theme';
import { useTheme } from '../utils/ThemeContext';
import { Badge, Button, Card, EmptyState, Input } from '../components/UI';

const LOW_STOCK = 5;

const copyToLocal = async (uri) => {
  try {
    const filename = uri.split('/').pop() || `img_${Date.now()}.jpg`;
    const dest = FileSystem.documentDirectory + filename;
    await FileSystem.copyAsync({ from: uri, to: dest });
    return dest;
  } catch (e) {
    return uri;
  }
};

// ─── Restock Modal ────────────────────────────────────────────────────────────

const RestockModal = ({ visible, product, onClose, onRestock }) => {
  const { isDark } = useTheme();
  const Colors = isDark ? DarkColors : LightColors;
  const [qty, setQty] = useState('');
  const [cost, setCost] = useState('');

  React.useEffect(() => {
    if (visible) { setQty(''); setCost(''); }
  }, [visible]);

  const handleRestock = async () => {
    const q = parseInt(qty);
    const c = parseFloat(cost);
    if (!q || q <= 0) return Alert.alert('Enter a valid quantity');
    if (isNaN(c) || c < 0) return Alert.alert('Enter a valid cost');
    await onRestock(q, c);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: Colors.surface, maxHeight: '75%' }]}>
          <View style={[styles.modalHandle, { backgroundColor: Colors.border }]} />
          <Text style={[styles.modalTitle, { color: Colors.textPrimary }]}>Restock</Text>
          {product && <Text style={[styles.restockProductName, { color: Colors.textSecondary }]}>{product.name}</Text>}
          <Input label="Quantity Added" value={qty} onChangeText={setQty} placeholder="0" keyboardType="number-pad" />
          <Input label="Total Cost Paid (₱)" value={cost} onChangeText={setCost} placeholder="0.00" keyboardType="decimal-pad" />
          <View style={styles.modalActions}>
            <Button title="Cancel" variant="ghost" onPress={onClose} style={{ flex: 1 }} />
            <Button title="Log Restock" onPress={handleRestock} style={{ flex: 2 }} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Product Form Modal ───────────────────────────────────────────────────────

const ProductFormModal = ({ visible, product, onClose, onSave }) => {
  const { isDark } = useTheme();
  const Colors = isDark ? DarkColors : LightColors;
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [initialCost, setInitialCost] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [errors, setErrors] = useState({});
  const [cameraPermission, requestCameraPermission] = ImagePicker.useCameraPermissions();

  React.useEffect(() => {
    if (visible) {
      setName(product?.name || '');
      setPrice(product?.price?.toString() || '');
      setQuantity(product?.quantity?.toString() || '');
      setInitialCost('');
      setImageUri(product?.image_uri || null);
      setErrors({});
    }
  }, [visible, product]);

  const pickFromFiles = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsEditing: false, quality: 0.8, copyToCacheDirectory: true,
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
      mediaTypes: ['images'], allowsEditing: false, quality: 0.8, copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets?.length > 0) {
      const localUri = await copyToLocal(result.assets[0].uri);
      setImageUri(localUri);
    }
  };

  const handleImagePress = () => {
    Alert.alert('Product Image', 'Choose an option', [
      { text: 'Browse Files', onPress: pickFromFiles },
      { text: 'Take Photo', onPress: takePhoto },
      imageUri ? { text: 'Remove Image', style: 'destructive', onPress: () => setImageUri(null) } : null,
      { text: 'Cancel', style: 'cancel' },
    ].filter(Boolean));
  };

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'Product name is required';
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) < 0) e.price = 'Enter a valid price';
    if (!quantity || isNaN(parseInt(quantity)) || parseInt(quantity) < 0) e.quantity = 'Enter a valid quantity';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    await onSave(name.trim(), parseFloat(price), parseInt(quantity), imageUri, parseFloat(initialCost) || 0);
    onClose();
  };

  const isEditing = !!product;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: Colors.surface }]}>
          <View style={[styles.modalHandle, { backgroundColor: Colors.border }]} />
          <Text style={[styles.modalTitle, { color: Colors.textPrimary }]}>{isEditing ? 'Edit Product' : 'New Product'}</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            <TouchableOpacity onPress={handleImagePress} style={styles.imagePicker} activeOpacity={0.8}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              ) : (
                <View style={[styles.imagePlaceholder, { backgroundColor: Colors.surfaceAlt, borderColor: Colors.border }]}>
                  <Ionicons name="camera-outline" size={32} color={Colors.textMuted} />
                  <Text style={[styles.imagePlaceholderText, { color: Colors.textMuted }]}>Add Photo</Text>
                </View>
              )}
              <View style={[styles.imageEditBadge, { backgroundColor: Colors.primary }]}>
                <Ionicons name="pencil" size={12} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            <Input label="Product Name" value={name} onChangeText={setName} placeholder="e.g. Coca-Cola 1L" error={errors.name} />
            <Input label="Price per Unit (₱)" value={price} onChangeText={setPrice} placeholder="0.00" keyboardType="decimal-pad" error={errors.price} />
            <Input label="Stock Quantity" value={quantity} onChangeText={setQuantity} placeholder="0" keyboardType="number-pad" error={errors.quantity} />
            {!isEditing && (
              <Input
                label="Cost per Unit (₱) — optional"
                value={initialCost}
                onChangeText={setInitialCost}
                placeholder="0.00 — cost price per piece"
                keyboardType="decimal-pad"
              />
            )}
          </ScrollView>
          <View style={styles.modalActions}>
            <Button title="Cancel" variant="ghost" onPress={onClose} style={{ flex: 1 }} />
            <Button title={isEditing ? 'Save Changes' : 'Add Product'} onPress={handleSave} style={{ flex: 2 }} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Product Item ─────────────────────────────────────────────────────────────

const ProductItem = ({ item, onEdit, onDelete, onRestock, index }) => {
  const { isDark } = useTheme();
  const Colors = isDark ? DarkColors : LightColors;
  const isLow = item.quantity <= LOW_STOCK;
  const isOut = item.quantity === 0;

  return (
    <Animated.View entering={FadeInRight.delay(index * 40).duration(300)} layout={Layout.springify()}>
      <Card style={styles.productCard}>
        <View style={styles.productRow}>
          {item.image_uri ? (
            <Image source={{ uri: item.image_uri }} style={[styles.productImage, { backgroundColor: Colors.surfaceAlt }]} />
          ) : (
            <View style={[styles.productImagePlaceholder, { backgroundColor: Colors.surfaceAlt }]}>
              <Ionicons name="cube-outline" size={24} color={Colors.textMuted} />
            </View>
          )}
          <View style={styles.productLeft}>
            <Text style={[styles.productName, { color: Colors.textPrimary }]}>{item.name}</Text>
            <Text style={[styles.productPrice, { color: Colors.primary }]}>{formatCurrency(item.price)}</Text>
          </View>
          <Badge
            label={isOut ? 'Out' : `${item.quantity} pcs`}
            color={isOut ? Colors.danger : isLow ? Colors.warning : Colors.success}
            bg={isOut ? Colors.dangerLight : isLow ? Colors.warningLight : Colors.successLight}
          />
        </View>

        {isLow && (
          <View style={[styles.lowStockBanner, { backgroundColor: Colors.warningLight }]}>
            <Ionicons name={isOut ? 'close-circle-outline' : 'warning-outline'} size={13} color={isOut ? Colors.danger : Colors.warning} />
            <Text style={[styles.lowStockText, { color: isOut ? Colors.danger : Colors.warning }]}>
              {isOut ? 'Out of stock' : `Low stock — only ${item.quantity} left`}
            </Text>
          </View>
        )}

        <View style={[styles.productActions, { borderTopColor: Colors.borderLight }]}>
          <TouchableOpacity onPress={() => onRestock(item)} style={styles.actionBtn}>
            <Ionicons name="add-circle-outline" size={15} color={Colors.success} />
            <Text style={[styles.actionBtnText, { color: Colors.success }]}>Restock</Text>
          </TouchableOpacity>
          <View style={[styles.actionDivider, { backgroundColor: Colors.borderLight }]} />
          <TouchableOpacity onPress={() => onEdit(item)} style={styles.actionBtn}>
            <Ionicons name="pencil-outline" size={15} color={Colors.primary} />
            <Text style={[styles.actionBtnText, { color: Colors.primary }]}>Edit</Text>
          </TouchableOpacity>
          <View style={[styles.actionDivider, { backgroundColor: Colors.borderLight }]} />
          <TouchableOpacity onPress={() => onDelete(item)} style={styles.actionBtn}>
            <Ionicons name="trash-outline" size={15} color={Colors.danger} />
            <Text style={[styles.actionBtnText, { color: Colors.danger }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </Animated.View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ProductsScreen({ navigation }) {
  const { isDark } = useTheme();
  const Colors = isDark ? DarkColors : LightColors;
  const [products, setProducts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [restockModalVisible, setRestockModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [restockingProduct, setRestockingProduct] = useState(null);

  const load = async () => { const data = await getProducts(); setProducts(data); };
  useFocusEffect(useCallback(() => { load(); }, []));

  const handleRestockSave = async (qty, cost) => {
    if (!restockingProduct) return;
    await addRestock(restockingProduct.id, restockingProduct.name, qty, cost);
    load();
  };

  const handleSave = async (name, price, quantity, imageUri, initialCost) => {
    if (editingProduct) {
      await updateProduct(editingProduct.id, name, price, quantity, imageUri);
    } else {
      const productId = await addProduct(name, price, quantity, imageUri);
      // Log initial stock cost directly without incrementing stock again
      if (initialCost > 0 && quantity > 0) {
        const database = await getDb();
        await database.runAsync(
          'INSERT INTO restocks (product_id, product_name, quantity_added, cost) VALUES (?, ?, ?, ?)',
          [productId, name, quantity, initialCost * quantity]
        );
      }
    }
    load();
  };

  const handleDelete = (item) => {
    Alert.alert('Delete Product', `Remove "${item.name}" from inventory?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteProduct(item.id); load(); } },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => (
          <ProductItem
            item={item} index={index}
            onEdit={(p) => { setEditingProduct(p); setModalVisible(true); }}
            onDelete={handleDelete}
            onRestock={(p) => { setRestockingProduct(p); setRestockModalVisible(true); }}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          products.length > 0 ? (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.listHeader}>
              <Text style={[styles.countText, { color: Colors.textSecondary }]}>
                {products.length} product{products.length !== 1 ? 's' : ''}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('RestockHistory')}>
                <Text style={[styles.historyLink, { color: Colors.primary }]}>Restock History →</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState icon="📦" title="No products yet" subtitle="Add your first product to start tracking inventory." />
        }
      />

      <Animated.View entering={FadeInDown.delay(200)} style={styles.fab}>
        <TouchableOpacity
          style={[styles.fabButton, { backgroundColor: Colors.primary }]}
          onPress={() => { setEditingProduct(null); setModalVisible(true); }}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.fabText}>Add Product</Text>
        </TouchableOpacity>
      </Animated.View>

      <ProductFormModal visible={modalVisible} product={editingProduct} onClose={() => setModalVisible(false)} onSave={handleSave} />
      <RestockModal visible={restockModalVisible} product={restockingProduct} onClose={() => setRestockModalVisible(false)} onRestock={handleRestockSave} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: Spacing.md, paddingBottom: 100 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  countText: { fontSize: 13, fontWeight: '600' },
  historyLink: { fontSize: 13, fontWeight: '600' },
  productCard: { marginBottom: Spacing.sm },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  productImage: { width: 56, height: 56, borderRadius: Radius.md },
  productImagePlaceholder: { width: 56, height: 56, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  productLeft: { flex: 1 },
  productName: { fontSize: 15, fontWeight: '700', marginBottom: 3 },
  productPrice: { fontSize: 14, fontWeight: '600' },
  lowStockBanner: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: Radius.sm, paddingHorizontal: 10, paddingVertical: 5, marginTop: 8 },
  lowStockText: { fontSize: 12, fontWeight: '600' },
  productActions: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 4 },
  actionDivider: { width: 1, height: 20 },
  actionBtnText: { fontSize: 13, fontWeight: '600' },
  fab: { position: 'absolute', bottom: Spacing.lg, left: Spacing.md, right: Spacing.md },
  fabButton: { borderRadius: Radius.lg, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, ...Shadow.lg },
  fabText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: { borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.lg, paddingBottom: 34, maxHeight: '90%' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.md },
  modalTitle: { fontSize: 22, fontWeight: '800', marginBottom: Spacing.lg },
  modalActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  restockProductName: { fontSize: 15, marginBottom: Spacing.md, fontWeight: '600' },
  imagePicker: { alignSelf: 'center', marginBottom: Spacing.lg, position: 'relative' },
  imagePreview: { width: 100, height: 100, borderRadius: Radius.lg },
  imagePlaceholder: { width: 100, height: 100, borderRadius: Radius.lg, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 6 },
  imagePlaceholderText: { fontSize: 12, fontWeight: '600' },
  imageEditBadge: { position: 'absolute', bottom: -4, right: -4, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
});