import React, { useCallback, useState } from 'react';
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
} from 'react-native';
import Animated, { FadeInDown, FadeInRight, Layout } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import { addProduct, deleteProduct, getProducts, updateProduct } from '../database/db';
import { formatCurrency } from '../utils/formatters';
import { Colors, Radius, Shadow, Spacing } from '../utils/theme';
import { Badge, Button, Card, EmptyState, Input } from '../components/UI';

const LOW_STOCK = 5;

const ProductFormModal = ({ visible, product, onClose, onSave }) => {
  const [name, setName] = useState(product?.name || '');
  const [price, setPrice] = useState(product?.price?.toString() || '');
  const [quantity, setQuantity] = useState(product?.quantity?.toString() || '');
  const [errors, setErrors] = useState({});

  React.useEffect(() => {
    if (visible) {
      setName(product?.name || '');
      setPrice(product?.price?.toString() || '');
      setQuantity(product?.quantity?.toString() || '');
      setErrors({});
    }
  }, [visible, product]);

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
    await onSave(name.trim(), parseFloat(price), parseInt(quantity));
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{product ? 'Edit Product' : 'New Product'}</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Input
              label="Product Name"
              value={name}
              onChangeText={setName}
              placeholder="e.g. Coca-Cola 1L"
              error={errors.name}
              autoFocus
            />
            <Input
              label="Price (₱)"
              value={price}
              onChangeText={setPrice}
              placeholder="0.00"
              keyboardType="decimal-pad"
              error={errors.price}
            />
            <Input
              label="Stock Quantity"
              value={quantity}
              onChangeText={setQuantity}
              placeholder="0"
              keyboardType="number-pad"
              error={errors.quantity}
            />
          </ScrollView>

          <View style={styles.modalActions}>
            <Button title="Cancel" variant="ghost" onPress={onClose} style={{ flex: 1 }} />
            <Button title={product ? 'Save Changes' : 'Add Product'} onPress={handleSave} style={{ flex: 2 }} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const ProductItem = ({ item, onEdit, onDelete, index }) => {
  const isLow = item.quantity <= LOW_STOCK;
  const isOut = item.quantity === 0;

  return (
    <Animated.View entering={FadeInRight.delay(index * 40).duration(300)} layout={Layout.springify()}>
      <Card style={styles.productCard}>
        <View style={styles.productRow}>
          <View style={styles.productLeft}>
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.productPrice}>{formatCurrency(item.price)}</Text>
          </View>
          <View style={styles.productRight}>
            <Badge
              label={isOut ? 'Out' : `${item.quantity} pcs`}
              color={isOut ? Colors.danger : isLow ? Colors.warning : Colors.success}
              bg={isOut ? Colors.dangerLight : isLow ? Colors.warningLight : Colors.successLight}
            />
          </View>
        </View>
        {isLow && (
          <View style={styles.lowStockBanner}>
            <Text style={styles.lowStockText}>
              {isOut ? '❌ Out of stock' : `⚠️  Low stock — only ${item.quantity} left`}
            </Text>
          </View>
        )}
        <View style={styles.productActions}>
          <TouchableOpacity onPress={() => onEdit(item)} style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>✏️  Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(item)} style={[styles.actionBtn, styles.deleteBtn]}>
            <Text style={[styles.actionBtnText, { color: Colors.danger }]}>🗑  Delete</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </Animated.View>
  );
};

export default function ProductsScreen() {
  const [products, setProducts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const load = async () => {
    const data = await getProducts();
    setProducts(data);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const handleAdd = () => {
    setEditingProduct(null);
    setModalVisible(true);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setModalVisible(true);
  };

  const handleSave = async (name, price, quantity) => {
    if (editingProduct) {
      await updateProduct(editingProduct.id, name, price, quantity);
    } else {
      await addProduct(name, price, quantity);
    }
    load();
  };

  const handleDelete = (item) => {
    Alert.alert(
      'Delete Product',
      `Remove "${item.name}" from inventory? This won't affect existing tab items.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteProduct(item.id);
            load();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => (
          <ProductItem item={item} onEdit={handleEdit} onDelete={handleDelete} index={index} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Animated.View entering={FadeInDown.duration(300)} style={styles.listHeader}>
            <Text style={styles.countText}>{products.length} product{products.length !== 1 ? 's' : ''}</Text>
          </Animated.View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="📦"
            title="No products yet"
            subtitle="Add your first product to start tracking inventory."
          />
        }
      />

      <Animated.View entering={FadeInDown.delay(200)} style={styles.fab}>
        <TouchableOpacity style={styles.fabButton} onPress={handleAdd} activeOpacity={0.85}>
          <Text style={styles.fabText}>+ Add Product</Text>
        </TouchableOpacity>
      </Animated.View>

      <ProductFormModal
        visible={modalVisible}
        product={editingProduct}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  listContent: { padding: Spacing.md, paddingBottom: 100 },
  listHeader: { marginBottom: Spacing.sm },
  countText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  productCard: { marginBottom: Spacing.sm },
  productRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  productLeft: { flex: 1, marginRight: Spacing.sm },
  productName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 3 },
  productPrice: { fontSize: 15, color: Colors.primary, fontWeight: '600' },
  productRight: { alignItems: 'flex-end' },
  lowStockBanner: {
    backgroundColor: Colors.warningLight,
    borderRadius: Radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 8,
  },
  lowStockText: { fontSize: 12, color: Colors.warning, fontWeight: '600' },
  productActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  actionBtn: { flex: 1, alignItems: 'center', paddingVertical: 6 },
  deleteBtn: {},
  actionBtnText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  fab: { position: 'absolute', bottom: Spacing.lg, left: Spacing.md, right: Spacing.md },
  fabButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    ...Shadow.lg,
  },
  fabText: { color: Colors.textInverse, fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    paddingBottom: 34,
    maxHeight: '85%',
  },
  modalHandle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.md },
  modalTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.lg },
  modalActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
});
