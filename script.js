/* ──────────────────────────────────────────
   FIREBASE DATABASE FUNCTIONS
────────────────────────────────────────── */

// Wait for Firebase to be ready
let firebaseReady = false;
let currentUser = null;

const checkFirebaseReady = setInterval(() => {
  if (window.firebaseDB && window.firebaseAuth && window.firebaseModules) {
    firebaseReady = true;
    clearInterval(checkFirebaseReady);
    console.log("Firebase está pronto!");
    initAuth();
    loadProductsFromFirebase();
  }
}, 100);

// ==================== AUTENTICAÇÃO ====================

function initAuth() {
  const { onAuthStateChanged } = window.firebaseModules;
  onAuthStateChanged(window.firebaseAuth, (user) => {
    currentUser = user;
    updateAuthUI(user);
    if (user && typeof cart !== 'undefined') {
      const saved = loadCartFromLocalStorage();
      if (saved.length) cart = saved;
      if (typeof updateCartUI === 'function') updateCartUI();
    }
  });
}

function updateAuthUI(user) {
  const guest = document.getElementById('authNavGuest');
  const logged = document.getElementById('authNavUser');
  const mobileLink = document.getElementById('mobileAuthLink');
  const nameEl = document.getElementById('userDisplayName');

  if (!guest || !logged) return;

  if (user) {
    guest.style.display = 'none';
    logged.style.display = 'block';
    const label = user.displayName || user.email?.split('@')[0] || 'Conta';
    if (nameEl) nameEl.textContent = label;
    if (mobileLink) {
      mobileLink.textContent = 'Minha conta';
      mobileLink.onclick = () => { toggleMenu(); toggleUserMenu(); return false; };
    }
  } else {
    guest.style.display = 'block';
    logged.style.display = 'none';
    if (mobileLink) {
      mobileLink.textContent = 'Entrar';
      mobileLink.onclick = () => { toggleMenu(); openAuthModal(); return false; };
    }
    document.getElementById('userDropdown')?.classList.remove('open');
  }
}

function openAuthModal(tab = 'login') {
  clearAuthError();
  switchAuthTab(tab);
  document.getElementById('authModal')?.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeAuthModal() {
  document.getElementById('authModal')?.classList.remove('active');
  document.body.style.overflow = '';
  clearAuthError();
}

function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach((t) => {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
  document.getElementById('authPanelLogin')?.classList.toggle('active', tab === 'login');
  document.getElementById('authPanelRegister')?.classList.toggle('active', tab === 'register');
  clearAuthError();
}

function showAuthError(msg) {
  const el = document.getElementById('authError');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
}

function clearAuthError() {
  const el = document.getElementById('authError');
  if (!el) return;
  el.textContent = '';
  el.classList.remove('show');
}

function getAuthErrorMessage(code) {
  const messages = {
    'auth/invalid-email': 'E-mail inválido.',
    'auth/user-disabled': 'Esta conta foi desativada.',
    'auth/user-not-found': 'E-mail ou senha incorretos.',
    'auth/wrong-password': 'E-mail ou senha incorretos.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
    'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres.',
    'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
    'auth/popup-closed-by-user': 'Login com Google cancelado.',
    'auth/network-request-failed': 'Erro de conexão. Verifique sua internet.',
    'auth/operation-not-allowed': 'Login por e-mail não está ativado no Firebase. Ative em Authentication → Sign-in method.',
    'auth/admin-restricted-operation': 'Cadastro desativado no Firebase Console.',
    'auth/missing-password': 'Informe uma senha.',
    'auth/internal-error': 'Erro interno do Firebase. Verifique se Authentication está ativado no console.'
  };
  return messages[code] || 'Não foi possível concluir. Tente novamente.';
}

function ensureFirebaseAuth() {
  if (!window.firebaseAuth) {
    showAuthError('Firebase ainda está carregando. Aguarde alguns segundos e tente de novo.');
    return false;
  }
  return true;
}

function setAuthLoading(loading) {
  ['loginSubmitBtn', 'registerSubmitBtn', 'googleLoginBtn'].forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) btn.disabled = loading;
  });
}

async function handleLogin(e) {
  e.preventDefault();
  clearAuthError();
  if (!ensureFirebaseAuth()) return;
  setAuthLoading(true);
  try {
    const { signInWithEmailAndPassword } = window.firebaseModules;
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    await signInWithEmailAndPassword(window.firebaseAuth, email, password);
    closeAuthModal();
    if (typeof showToast === 'function') {
      const t = document.getElementById('toast');
      if (t) { t.textContent = '✓ Login realizado!'; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2500); }
    }
  } catch (err) {
    console.error('Erro no login:', err.code, err.message);
    showAuthError(getAuthErrorMessage(err.code));
  } finally {
    setAuthLoading(false);
  }
}

async function handleRegister(e) {
  e.preventDefault();
  clearAuthError();
  if (!ensureFirebaseAuth()) return;
  setAuthLoading(true);
  try {
    const { createUserWithEmailAndPassword, updateProfile } = window.firebaseModules;
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const cred = await createUserWithEmailAndPassword(window.firebaseAuth, email, password);
    if (name) await updateProfile(cred.user, { displayName: name });
    closeAuthModal();
    const t = document.getElementById('toast');
    if (t) { t.textContent = '✓ Conta criada com sucesso!'; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2500); }
  } catch (err) {
    console.error('Erro ao criar conta:', err.code, err.message);
    showAuthError(getAuthErrorMessage(err.code));
  } finally {
    setAuthLoading(false);
  }
}

async function handleGoogleLogin() {
  clearAuthError();
  if (!ensureFirebaseAuth()) return;
  setAuthLoading(true);
  try {
    const { GoogleAuthProvider, signInWithPopup } = window.firebaseModules;
    const provider = new GoogleAuthProvider();
    await signInWithPopup(window.firebaseAuth, provider);
    closeAuthModal();
  } catch (err) {
    if (err.code !== 'auth/popup-closed-by-user') showAuthError(getAuthErrorMessage(err.code));
  } finally {
    setAuthLoading(false);
  }
}

async function handleLogout() {
  try {
    const { signOut } = window.firebaseModules;
    await signOut(window.firebaseAuth);
    document.getElementById('userDropdown')?.classList.remove('open');
  } catch (err) {
    console.error('Erro ao sair:', err);
  }
}

function toggleUserMenu() {
  document.getElementById('userDropdown')?.classList.toggle('open');
}

function requireAuthForCheckout() {
  if (!currentUser) {
    openAuthModal('login');
    const t = document.getElementById('toast');
    if (t) { t.textContent = 'Faça login para finalizar a compra'; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2500); }
    return false;
  }
  return true;
}

function prefillCheckoutFromUser() {
  if (!currentUser) return;
  const nameEl = document.getElementById('checkoutName');
  const emailEl = document.getElementById('checkoutEmail');
  if (nameEl && !nameEl.value) nameEl.value = currentUser.displayName || '';
  if (emailEl && !emailEl.value) emailEl.value = currentUser.email || '';
}

async function submitOrder() {
  if (!cart.length) {
    alert('Seu carrinho está vazio.');
    return false;
  }
  const name = document.getElementById('checkoutName')?.value.trim();
  const email = document.getElementById('checkoutEmail')?.value.trim();
  const cep = document.getElementById('checkoutCep')?.value.trim();
  const address = document.getElementById('checkoutAddress')?.value.trim();

  if (!name || !email || !cep || !address) {
    alert('Preencha todos os dados de entrega.');
    return false;
  }

  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const orderData = {
    customer: { name, email, cep, address },
    items: cart.map((c) => ({ id: c.id, name: c.name, team: c.team, size: c.size, qty: c.qty, price: c.price })),
    total,
    userId: currentUser?.uid || null
  };

  try {
    if (firebaseReady && typeof createOrder === 'function') {
      await createOrder(orderData);
    }
    alert('🎉 Pedido confirmado! Em breve entraremos em contato. Obrigado pela compra na R&B Modas!');
    cart = [];
    saveCartToLocalStorage(cart);
    if (typeof updateCartUI === 'function') updateCartUI();
    closeCheckout();
    return true;
  } catch (err) {
    console.error(err);
    alert('Erro ao salvar o pedido. Tente novamente.');
    return false;
  }
}

async function openMyOrders() {
  document.getElementById('userDropdown')?.classList.remove('open');
  if (!currentUser) {
    openAuthModal('login');
    return;
  }
  const orders = await getOrdersByEmail(currentUser.email);
  if (!orders.length) {
    alert('Você ainda não tem pedidos.');
    return;
  }
  const list = orders.map((o) => {
    const date = o.createdAt ? new Date(o.createdAt).toLocaleDateString('pt-BR') : '-';
    return `• ${date} — R$ ${Number(o.total).toFixed(2).replace('.', ',')} (${o.status || 'pendente'})`;
  }).join('\n');
  alert(`Seus pedidos:\n\n${list}`);
}

window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.switchAuthTab = switchAuthTab;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleGoogleLogin = handleGoogleLogin;
window.handleLogout = handleLogout;
window.toggleUserMenu = toggleUserMenu;
window.requireAuthForCheckout = requireAuthForCheckout;
window.prefillCheckoutFromUser = prefillCheckoutFromUser;
window.submitOrder = submitOrder;
window.openMyOrders = openMyOrders;

document.addEventListener('DOMContentLoaded', () => {
  if (typeof cart !== 'undefined') {
    const saved = loadCartFromLocalStorage();
    if (saved.length) {
      cart.length = 0;
      cart.push(...saved);
      if (typeof updateCartUI === 'function') updateCartUI();
    }
  }
});

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

    console.log(`${products.length} produtos carregados do Firebase`);

    // Só substitui o catálogo local se o Firebase tiver produtos
    if (products.length > 0) {
      if (typeof PRODUCTS !== 'undefined') {
        PRODUCTS.length = 0;
        PRODUCTS.push(...products);
      } else {
        window.PRODUCTS = products;
      }
      if (typeof initGrids === 'function') {
        initGrids(true);
      }
    } else {
      console.log('Firebase vazio — mantendo produtos locais do site.');
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
      userId: orderData.userId || null,
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

  if (typeof PRODUCTS !== 'undefined') {
    PRODUCTS.length = 0;
    PRODUCTS.push(...sampleProducts);
  } else {
    window.PRODUCTS = sampleProducts;
  }
  if (typeof initGrids === 'function') initGrids(true);
  return sampleProducts;
}
