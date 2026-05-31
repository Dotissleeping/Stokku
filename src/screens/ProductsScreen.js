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
  Image,
} from 'react-native';
import Animated, { FadeInDown, FadeInRight, Layout } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { addProduct, deleteProduct, getProducts, updateProduct } from '../database/db';
import { formatCurrency } from '../utils/formatters';
import { Colors, Radius, Shadow, Spacing } from '../utils/theme';
import { Badge, Button, Card, EmptyState, Input } from '../components/UI';

const LOW_STOCK = 5;

const copyToLocal = async (uri) => {
  try {
    const filename = uri.split('/').pop() || `img_${Date.now()}.jpg`;
    const dest = FileSystem.documentDirectory + filename;
    await FileSystem.copyAsync({ from: uri, to: dest });
    return dest;
  } catch (e) {
    console.warn('File copy failed, using original URI', e);
    return uri;
  }
};

const ProductFormModal = ({ visible, product, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [errors, setErrors] = useState({});
  const [cameraPermission, requestCameraPermission] = ImagePicker.useCameraPermissions();

  React.useEffect(() => {
    if (visible) {
      setName(product?.name || '');
      setPrice(product?.price?.toString() || '');
      setQuantity(product?.quantity?.toString() || '');
      setImageUri(product?.image_uri || null);
      setErrors({});
    }
  }, [visible, product]);

  const pickFromFiles = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const localUri = await copyToLocal(result.assets[0].uri);
      setImageUri(localUri);
    }
  };

  const takePhoto = async () => {
    if (!cameraPermission?.granted) {
      const { granted } = await requestCameraPermission();
      if (!granted) {
        Alert.alert('Permission needed', 'Allow camera access in your phone settings.');
        return;
      }
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const localUri = await copyToLocal(result.assets[0].uri);
      setImageUri(localUri);
    }
  };

  const handleImagePress = () => {
    Alert.alert('Product Image', 'Choose an option', [
      { text: '📁 Browse Files', onPress: pickFromFiles },
      { text: '📷 Take Photo', onPress: takePhoto },
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
    await onSave(name.trim(), parseFloat(price), parseInt(quantity), imageUri);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{product ? 'Edit Product' : 'New Product'}</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            <TouchableOpacity onPress={handleImagePress} style={styles.imagePicker} activeOpacity={0.8}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="camera-outline" size={32} color={Colors.textMuted} />
                  <Text style={styles.imagePlaceholderText}>Add Photo</Text>
                </View>
              )}
              <View style={styles.imageEditBadge}>
                <Ionicons name="pencil" size={12} color={Colors.textInverse} />
              </View>
            </TouchableOpacity>

            <Input
              label="Product Name"
              value={name}
              onChangeText={setName}
              placeholder="e.g. Coca-Cola 1L"
              error={errors.name}
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
          {item.image_uri ? (
            <Image source={{ uri: item.image_uri }} style={styles.productImage} />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Ionicons name="cube-outline" size={24} color={Colors.textMuted} />
            </View>
          )}
          <View style={styles.productLeft}>
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.productPrice}>{formatCurrency(item.price)}</Text>
          </View>
          <Badge
            label={isOut ? 'Out' : `${item.quantity} pcs`}
            color={isOut ? Colors.danger : isLow ? Colors.warning : Colors.success}
            bg={isOut ? Colors.dangerLight : isLow ? Colors.warningLight : Colors.successLight}
          />
        </View>

        {isLow && (
          <View style={styles.lowStockBanner}>
            <Ionicons
              name={isOut ? 'close-circle-outline' : 'warning-outline'}
              size={13}
              color={isOut ? Colors.danger : Colors.warning}
            />
            <Text style={[styles.lowStockText, { color: isOut ? Colors.danger : Colors.warning }]}>
              {isOut ? 'Out of stock' : `Low stock — only ${item.quantity} left`}
            </Text>
          </View>
        )}

        <View style={styles.productActions}>
          <TouchableOpacity onPress={() => onEdit(item)} style={styles.actionBtn}>
            <Ionicons name="pencil-outline" size={15} color={Colors.primary} />
            <Text style={styles.actionBtnText}>Edit</Text>
          </TouchableOpacity>
          <View style={styles.actionDivider} />
          <TouchableOpacity onPress={() => onDelete(item)} style={styles.actionBtn}>
            <Ionicons name="trash-outline" size={15} color={Colors.danger} />
            <Text style={[styles.actionBtnText, { color: Colors.danger }]}>Delete</Text>
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

  const handleSave = async (name, price, quantity, imageUri) => {
    if (editingProduct) {
      await updateProduct(editingProduct.id, name, price, quantity, imageUri);
    } else {
      await addProduct(name, price, quantity, imageUri);
    }
    load();
  };

  const handleDelete = (item) => {
    Alert.alert(
      'Delete Product',
      `Remove "${item.name}" from inventory?`,
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
          products.length > 0 ? (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.listHeader}>
              <Text style={styles.countText}>{products.length} product{products.length !== 1 ? 's' : ''}</Text>
            </Animated.View>
          ) : null
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
          <Ionicons name="add" size={20} color={Colors.textInverse} />
          <Text style={styles.fabText}>Add Product</Text>
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
  productRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  productImage: { width: 56, height: 56, borderRadius: Radius.md, backgroundColor: Colors.surfaceAlt },
  productImagePlaceholder: {
    width: 56, height: 56, borderRadius: Radius.md,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  productLeft: { flex: 1 },
  productName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 3 },
  productPrice: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  lowStockBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.warningLight,
    borderRadius: Radius.sm,
    paddingHorizontal: 10, paddingVertical: 5,
    marginTop: 8,
  },
  lowStockText: { fontSize: 12, fontWeight: '600' },
  productActions: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: Spacing.sm, paddingTop: Spacing.sm,
    borderTopWidth: 1, borderTopColor: Colors.borderLight,
  },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 4 },
  actionDivider: { width: 1, height: 20, backgroundColor: Colors.borderLight },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  fab: { position: 'absolute', bottom: Spacing.lg, left: Spacing.md, right: Spacing.md },
  fabButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
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
    maxHeight: '90%',
  },
  modalHandle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.md },
  modalTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.lg },
  modalActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  imagePicker: { alignSelf: 'center', marginBottom: Spacing.lg, position: 'relative' },
  imagePreview: { width: 100, height: 100, borderRadius: Radius.lg },
  imagePlaceholder: {
    width: 100, height: 100, borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  imagePlaceholderText: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  imageEditBadge: {
    position: 'absolute', bottom: -4, right: -4,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.surface,
  },
});