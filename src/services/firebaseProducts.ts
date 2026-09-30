import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  query,
  where,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { Product, Category } from '../types';

const PRODUCTS_COLLECTION = 'products';
const CATEGORIES_COLLECTION = 'categories';
const DELETED_PRODUCTS_KEY = 'nexus_deleted_product_ids';

/**
 * Check if a product has been permanently deleted by admin
 */
export function isProductDeleted(productId: string): boolean {
  try {
    const raw = localStorage.getItem(DELETED_PRODUCTS_KEY);
    if (!raw) return false;
    const list: string[] = JSON.parse(raw);
    return list.includes(productId);
  } catch {
    return false;
  }
}

/**
 * Record a product ID as permanently deleted so it cannot be resurrected by fallback seeds
 */
export function recordDeletedProductId(productId: string): void {
  try {
    const raw = localStorage.getItem(DELETED_PRODUCTS_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(productId)) {
      list.push(productId);
      localStorage.setItem(DELETED_PRODUCTS_KEY, JSON.stringify(list));
    }
  } catch {}
}

/**
 * Persist or update a product document in Firestore
 */
export async function saveProductToFirestore(product: Product): Promise<void> {
  if (isProductDeleted(product.id)) {
    console.log(`[Firestore] Skipping save of deleted product: ${product.id}`);
    return;
  }
  try {
    if (!db) return;
    const prodDocRef = doc(db, PRODUCTS_COLLECTION, product.id);
    const cleanProduct: any = {};
    Object.entries(product).forEach(([k, v]) => {
      if (v !== undefined) {
        cleanProduct[k] = v;
      }
    });
    cleanProduct.associatedSellerIds = Array.isArray(product.associatedSellerIds)
      ? product.associatedSellerIds
      : [];
    cleanProduct.updatedAt = product.updatedAt || new Date().toISOString();
    cleanProduct._syncedAt = serverTimestamp();

    await setDoc(prodDocRef, cleanProduct, { merge: true });
    console.log(`[Firestore] Product "${product.name}" (${product.id}) saved successfully.`);
  } catch (error) {
    console.warn(`[Firestore] Failed to save product ${product.id} to Firestore:`, error);
  }
}

/**
 * Helper to wipe all documents in a subcollection under a product document
 */
async function wipeSubcollection(productId: string, subcollectionName: string): Promise<void> {
  if (!db) return;
  try {
    const subColRef = collection(db, PRODUCTS_COLLECTION, productId, subcollectionName);
    const subSnap = await getDocs(subColRef);
    const deletePromises = subSnap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletePromises);
    if (subSnap.size > 0) {
      console.log(`[Firestore] Wiped ${subSnap.size} items from subcollection /${PRODUCTS_COLLECTION}/${productId}/${subcollectionName}`);
    }
  } catch (err) {
    console.warn(`[Firestore] Notice wiping subcollection ${subcollectionName} for product ${productId}:`, err);
  }
}

/**
 * Permanently delete a product document and all its subcollections from Firestore
 */
export async function deleteProductFromFirestore(productId: string): Promise<void> {
  if (!productId) return;
  recordDeletedProductId(productId);

  // Prune from localStorage cache
  try {
    const raw = localStorage.getItem('nexus_products');
    if (raw) {
      const prods: Product[] = JSON.parse(raw);
      const filtered = prods.filter((p) => p.id !== productId);
      localStorage.setItem('nexus_products', JSON.stringify(filtered));
    }
    const rawCart = localStorage.getItem('nexus_cart');
    if (rawCart) {
      const cart = JSON.parse(rawCart);
      const filteredCart = Array.isArray(cart) ? cart.filter((item: any) => item?.product?.id !== productId) : [];
      localStorage.setItem('nexus_cart', JSON.stringify(filteredCart));
    }
  } catch {}

  // Broadcast deletion across open tabs
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('nexus_products_channel');
      bc.postMessage({ type: 'PRODUCT_DELETED', productId });
      setTimeout(() => bc.close(), 1000);
    }
  } catch {}

  if (!db) return;

  try {
    // 1. Wipe known subcollections under products/{productId}
    const knownSubcollections = ['reviews', 'ratings', 'variants', 'images', 'activity', 'inventory_logs'];
    for (const sub of knownSubcollections) {
      await wipeSubcollection(productId, sub);
    }

    // 2. Delete primary product document
    const prodDocRef = doc(db, PRODUCTS_COLLECTION, productId);
    await deleteDoc(prodDocRef);

    // 3. In case document ID was different from the product.id field, query and delete matching docs
    const q = query(collection(db, PRODUCTS_COLLECTION), where('id', '==', productId));
    const querySnap = await getDocs(q);
    const queryDeletes = querySnap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(queryDeletes);

    console.log(`[Firestore] Product ${productId} and all subcollections permanently wiped from backend database.`);
  } catch (error) {
    console.warn(`[Firestore] Failed to delete product ${productId} from Firestore:`, error);
  }
}

/**
 * Permanently delete or disassociate all products associated with a specific seller from Firestore
 */
export async function deleteSellerProductsFromFirestore(
  sellerId: string,
  sellerUserId?: string
): Promise<string[]> {
  const deletedProductIds: string[] = [];
  if (!sellerId) return deletedProductIds;

  try {
    // 1. Clean local storage products first
    const raw = localStorage.getItem('nexus_products');
    let localProducts: Product[] = raw ? JSON.parse(raw) : [];

    localProducts = localProducts.map((p) => {
      const cleanAssoc = (p.associatedSellerIds || []).filter(
        (id) => id !== sellerId && id !== sellerUserId
      );
      return { ...p, associatedSellerIds: cleanAssoc };
    });

    // Check products owned strictly by this seller
    const strictlyOwned = localProducts.filter(
      (p) =>
        (p.sellerId === sellerId || (sellerUserId && p.sellerId === sellerUserId)) &&
        (!p.associatedSellerIds || p.associatedSellerIds.length === 0)
    );
    strictlyOwned.forEach((p) => {
      recordDeletedProductId(p.id);
      deletedProductIds.push(p.id);
    });

    const remainingProducts = localProducts.filter((p) => !deletedProductIds.includes(p.id));
    localStorage.setItem('nexus_products', JSON.stringify(remainingProducts));
  } catch {}

  if (!db) return deletedProductIds;

  try {
    const prodsCol = collection(db, PRODUCTS_COLLECTION);
    const allProdsSnap = await getDocs(prodsCol);

    for (const docSnap of allProdsSnap.docs) {
      const data = docSnap.data() as Product;
      const isOwner =
        data.sellerId === sellerId ||
        (sellerUserId && data.sellerId === sellerUserId) ||
        (data as any).userId === sellerId;
      const associatedIds: string[] = Array.isArray(data.associatedSellerIds)
        ? data.associatedSellerIds
        : [];
      const hasSellerInAssoc =
        associatedIds.includes(sellerId) || (sellerUserId && associatedIds.includes(sellerUserId));

      if (isOwner) {
        // Remove seller from associated IDs
        const newAssoc = associatedIds.filter((id) => id !== sellerId && id !== sellerUserId);
        if (newAssoc.length === 0) {
          // Permanently delete this product document and subcollections
          await deleteProductFromFirestore(docSnap.id);
          if (data.id && data.id !== docSnap.id) {
            await deleteProductFromFirestore(data.id);
          }
          if (!deletedProductIds.includes(data.id || docSnap.id)) {
            deletedProductIds.push(data.id || docSnap.id);
          }
        } else {
          // Multi-seller product: update to remove this seller
          await setDoc(docSnap.ref, { associatedSellerIds: newAssoc }, { merge: true });
        }
      } else if (hasSellerInAssoc) {
        // Multi-seller product: disassociate this seller
        const newAssoc = associatedIds.filter((id) => id !== sellerId && id !== sellerUserId);
        await setDoc(docSnap.ref, { associatedSellerIds: newAssoc }, { merge: true });
      }
    }
  } catch (err) {
    console.warn('[Firestore] Error cleaning seller products from Firestore:', err);
  }

  return deletedProductIds;
}

/**
 * Persist or update a category document in Firestore
 */
export async function saveCategoryToFirestore(category: Category): Promise<void> {
  try {
    const catDocRef = doc(db, CATEGORIES_COLLECTION, category.id);
    await setDoc(
      catDocRef,
      {
        ...category,
        _syncedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn(`[Firestore] Failed to save category ${category.id} to Firestore:`, error);
  }
}

/**
 * Delete a category document from Firestore
 */
export async function deleteCategoryFromFirestore(categoryId: string): Promise<void> {
  try {
    const catDocRef = doc(db, CATEGORIES_COLLECTION, categoryId);
    await deleteDoc(catDocRef);
  } catch (error) {
    console.warn(`[Firestore] Failed to delete category ${categoryId} from Firestore:`, error);
  }
}

/**
 * Real-time listener for Firestore Products
 */
export function listenToFirestoreProducts(callback: (products: Product[]) => void): () => void {
  try {
    const colRef = collection(db, PRODUCTS_COLLECTION);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const loadedProducts: Product[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Product;
            loadedProducts.push({
              ...data,
              id: docSnap.id,
            });
          });
          callback(loadedProducts);
        }
      },
      (error) => {
        console.warn('[Firestore] Real-time products listener warning:', error.message);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('[Firestore] Error initializing products listener:', err);
    return () => {};
  }
}

/**
 * Real-time listener for Firestore Categories
 */
export function listenToFirestoreCategories(callback: (categories: Category[]) => void): () => void {
  try {
    const colRef = collection(db, CATEGORIES_COLLECTION);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const loadedCategories: Category[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Category;
            loadedCategories.push({
              ...data,
              id: docSnap.id,
            });
          });
          callback(loadedCategories);
        }
      },
      (error) => {
        console.warn('[Firestore] Real-time categories listener warning:', error.message);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('[Firestore] Error initializing categories listener:', err);
    return () => {};
  }
}

/**
 * Seed initial products and categories into Firestore if the collections are empty,
 * ensuring immediate real-time persistence in the connected Firebase project.
 */
export async function seedInitialFirestoreCatalog(
  initialProducts: Product[],
  initialCategories: Category[]
): Promise<void> {
  try {
    if (!db) return;
    const prodsSnap = await getDocs(collection(db, PRODUCTS_COLLECTION));
    const existingDocIds = new Set(prodsSnap.docs.map((d) => d.id));
    
    // Seed any product not yet present in Firestore (unless permanently deleted)
    const toSeed = initialProducts.filter(
      (prod) => !existingDocIds.has(prod.id) && !isProductDeleted(prod.id)
    );

    if (toSeed.length > 0) {
      console.log(`[Firestore] Seeding ${toSeed.length} new catalog products in fast batches...`);
      // Firestore batches support up to 500 operations per batch
      const BATCH_SIZE = 400;
      for (let i = 0; i < toSeed.length; i += BATCH_SIZE) {
        const chunk = toSeed.slice(i, i + BATCH_SIZE);
        const batch = writeBatch(db);
        for (const prod of chunk) {
          const prodDocRef = doc(db, PRODUCTS_COLLECTION, prod.id);
          const cleanProduct: any = {};
          Object.entries(prod).forEach(([k, v]) => {
            if (v !== undefined) {
              cleanProduct[k] = v;
            }
          });
          cleanProduct.associatedSellerIds = Array.isArray(prod.associatedSellerIds)
            ? prod.associatedSellerIds
            : [];
          cleanProduct.updatedAt = prod.updatedAt || new Date().toISOString();
          cleanProduct._syncedAt = serverTimestamp();
          batch.set(prodDocRef, cleanProduct, { merge: true });
        }
        await batch.commit();
      }
      console.log(`[Firestore] Successfully batch seeded ${toSeed.length} products to database!`);
    }

    const catsSnap = await getDocs(collection(db, CATEGORIES_COLLECTION));
    const existingCatIds = new Set(catsSnap.docs.map((d) => d.id));
    const catsToSeed = initialCategories.filter((cat) => !existingCatIds.has(cat.id));
    if (catsToSeed.length > 0) {
      const catBatch = writeBatch(db);
      for (const cat of catsToSeed) {
        const catDocRef = doc(db, CATEGORIES_COLLECTION, cat.id);
        catBatch.set(catDocRef, cat, { merge: true });
      }
      await catBatch.commit();
      console.log(`[Firestore] Successfully batch seeded ${catsToSeed.length} categories!`);
    }
  } catch (error) {
    console.warn('[Firestore] Seed catalog notice (offline or network fallback):', error);
  }
}
