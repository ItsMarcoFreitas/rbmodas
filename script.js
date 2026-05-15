/* ──────────────────────────────────────────
   FIREBASE DATABASE FUNCTIONS
────────────────────────────────────────── */

// Wait for Firebase to be ready
let firebaseReady = false;
const checkFirebaseReady = setInterval(() => {
  if (window.firebaseDB && window.firebaseModules) {
    firebaseReady = true;
    clearInterval(checkFirebaseReady);
    console.log("Firebase está pronto!");
    loadProductsFromFirebase();
  }
}, 100);

// ==================== PRODUTOS ====================

// Carregar produtos do Firebase
async function loadProductsFromFirebase() {
  try {
    const { collection, getDocs, query, orderBy } = window.firebaseModules;
    const db = window.firebaseDB;
    
    const productsRef = collection(db, 'products');
    const q = query(productsRef, orderBy('name'));
    const querySnapshot = await getDocs(q);
    
    const products = [];
    querySnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() });
    });
    
    // Atualizar a variável global PRODUCTS
    if (typeof PRODUCTS !== 'undefined') {
      PRODUCTS.length = 0;
      PRODUCTS.push(...products);
    } else {
      window.PRODUCTS = products;
    }
    
    console.log(`${products.length} produtos carregados do Firebase`);
    
    // Re-renderizar grids
    if (typeof initGrids === 'function') {
      initGrids();
    }
    
    return products;
  } catch (error) {
    console.error('Erro ao carregar produtos:', error);
    // Se não houver produtos no Firebase, usar dados de exemplo
    if (typeof PRODUCTS === 'undefined' || PRODUCTS.length === 0) {
      console.log('Usando dados de exemplo...');
      return loadSampleProducts();
    }
  }
}

// Adicionar produto ao Firebase
async function addProductToFirebase(product) {
  try {
    const { collection, addDoc } = window.firebaseModules;
    const db = window.firebaseDB;
    
    const docRef = await addDoc(collection(db, 'products'), {
      name: product.name,
      team: product.team,
      league: product.league,
      price: product.price,
      oldPrice: product.oldPrice || null,
      image: product.image,
      sizes: product.sizes || ['P', 'M', 'G', 'GG'],
      badge: product.badge || null,
      description: product.description || '',
      featured: product.featured || false,
      createdAt: new Date().toISOString()
    });
    
    console.log('Produto adicionado com ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Erro ao adicionar produto:', error);
    throw error;
  }
}

// Atualizar produto no Firebase
async function updateProductInFirebase(productId, productData) {
  try {
    const { doc, updateDoc } = window.firebaseModules;
    const db = window.firebaseDB;
    
    const productRef = doc(db, 'products', productId);
    await updateDoc(productRef, productData);
    
    console.log('Produto atualizado:', productId);
    return true;
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    throw error;
  }
}

// Deletar produto do Firebase
async function deleteProductFromFirebase(productId) {
  try {
    const { doc, deleteDoc } = window.firebaseModules;
    const db = window.firebaseDB;
    
    await deleteDoc(doc(db, 'products', productId));
    console.log('Produto deletado:', productId);
    return true;
  } catch (error) {
    console.error('Erro ao deletar produto:', error);
    throw error;
  }
}

// ==================== PEDIDOS ====================

// Criar pedido no Firebase
async function createOrder(orderData) {
  try {
    const { collection, addDoc } = window.firebaseModules;
    const db = window.firebaseDB;
    
    const docRef = await addDoc(collection(db, 'orders'), {
      customer: orderData.customer,
      items: orderData.items,
      total: orderData.total,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    console.log('Pedido criado com ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    throw error;
  }
}

// Buscar pedidos por email
async function getOrdersByEmail(email) {
  try {
    const { collection, query, where, getDocs, orderBy } = window.firebaseModules;
    const db = window.firebaseDB;
    
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('customer.email', '==', email),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    const orders = [];
    querySnapshot.forEach((doc) => {
      orders.push({ id: doc.id, ...doc.data() });
    });
    
    return orders;
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    return [];
  }
}

// ==================== CARRINHO ====================

// Salvar carrinho no localStorage (para persistência local)
function saveCartToLocalStorage(cart) {
  localStorage.setItem('rbmodas_cart', JSON.stringify(cart));
}

// Carregar carrinho do localStorage
function loadCartFromLocalStorage() {
  const saved = localStorage.getItem('rbmodas_cart');
  return saved ? JSON.parse(saved) : [];
}

// ==================== DADOS DE EXEMPLO ====================

function loadSampleProducts() {
  const sampleProducts = [
    {
      id: '1',
      name: 'Camisa Brasil 2024/25 Titular',
      team: 'Brasil',
      league: 'Seleções',
      price: 349.90,
      oldPrice: 399.90,
      image: 'camisas/brasil-2024-home.jpg',
      sizes: ['P', 'M', 'G', 'GG'],
      badge: 'new',
      description: 'Camisa oficial da Seleção Brasileira para 2024/25',
      featured: true
    },
    {
      id: '2',
      name: 'Camisa Brasil 2024/25 Reserva',
      team: 'Brasil',
      league: 'Seleções',
      price: 349.90,
      oldPrice: null,
      image: 'camisas/brasil-2024-away.jpg',
      sizes: ['P', 'M', 'G', 'GG'],
      badge: null,
      description: 'Camisa reserva da Seleção Brasileira',
      featured: true
    },
    {
      id: '3',
      name: 'Camisa Real Madrid 24/25 Titular',
      team: 'Real Madrid',
      league: 'La Liga',
      price: 429.90,
      oldPrice: 479.90,
      image: 'camisas/rmadrid-24-home.jpg',
      sizes: ['P', 'M', 'G', 'GG'],
      badge: 'hot',
      description: 'Camisa oficial do Real Madrid',
      featured: true
    },
    {
      id: '4',
      name: 'Camisa Barcelona 24/25 Titular',
      team: 'Barcelona',
      league: 'La Liga',
      price: 429.90,
      oldPrice: null,
      image: 'camisas/barcelona-24-home.jpg',
      sizes: ['P', 'M', 'G', 'GG'],
      badge: null,
      description: 'Camisa oficial do Barcelona',
      featured: true
    },
    {
      id: '5',
      name: 'Camisa Manchester United 24/25 Titular',
      team: 'Manchester United',
      league: 'Premier League',
      price: 449.90,
      oldPrice: 499.90,
      image: 'camisas/manutd-24-home.jpg',
      sizes: ['P', 'M', 'G', 'GG'],
      badge: 'sale',
      description: 'Camisa oficial do Manchester United',
      featured: false
    },
    {
      id: '6',
      name: 'Camisa Liverpool 24/25 Titular',
      team: 'Liverpool',
      league: 'Premier League',
      price: 449.90,
      oldPrice: null,
      image: 'camisas/liverpool-24-home.jpg',
      sizes: ['P', 'M', 'G', 'GG'],
      badge: null,
      description: 'Camisa oficial do Liverpool',
      featured: false
    },
    {
      id: '7',
      name: 'Camisa Argentina 2024 Titular',
      team: 'Argentina',
      league: 'Seleções',
      price: 349.90,
      oldPrice: null,
      image: 'camisas/argentina-24-home.jpg',
      sizes: ['P', 'M', 'G', 'GG'],
      badge: 'hot',
      description: 'Camisa oficial da Argentina',
      featured: true
    },
    {
      id: '8',
      name: 'Camisa Flamengo 2024 Titular',
      team: 'Flamengo',
      league: 'Brasileirão',
      price: 289.90,
      oldPrice: 329.90,
      image: 'camisas/flamengo-24-home.jpg',
      sizes: ['P', 'M', 'G', 'GG'],
      badge: 'sale',
      description: 'Camisa oficial do Flamengo',
      featured: true
    }
  ];
  
  window.PRODUCTS = sampleProducts;
  return sampleProducts;
}
