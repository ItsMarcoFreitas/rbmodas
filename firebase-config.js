// Firebase Configuration
// Substitua com suas credenciais do Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyDayvsEn1X8D-cNJStBZexMfnBvHxBHfjA",
  authDomain: "rbmodas-a9c06.firebaseapp.com",
  projectId: "rbmodas-a9c06",
  storageBucket: "rbmodas-a9c06.firebasestorage.app",
  messagingSenderId: "751270327994",
  appId: "1:751270327994:web:43b92da320abffca5c3483"
};

// Initialize Firebase
let db;
try {
  const app = window.firebaseModules.initializeApp(firebaseConfig);
  db = window.firebaseModules.getFirestore(app);
  console.log("Firebase inicializado com sucesso!");
} catch (error) {
  console.error("Erro ao inicializar Firebase:", error);
}

// Exportar para uso global
window.firebaseDB = db;
window.firebaseConfig = firebaseConfig;
