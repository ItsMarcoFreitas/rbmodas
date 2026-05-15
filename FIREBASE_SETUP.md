# Configuração do Firebase para R&B Modas

Este guia explica como configurar o Firebase como banco de dados para o projeto R&B Modas.

## 1. Criar Projeto no Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Adicionar projeto"
3. Dê um nome ao projeto (ex: `rbmodas`)
4. Siga as configurações padrão
5. Clique em "Criar projeto"

## 2. Configurar Firestore Database

1. No console do Firebase, selecione seu projeto
2. No menu lateral, clique em "Firestore Database"
3. Clique em "Criar banco de dados"
4. Escolha o local mais próximo (ex: `southamerica-east1`)
5. Selecione "Iniciar em modo de teste" (para desenvolvimento)
6. Clique em "Ativar"

## 3. Obter Credenciais do Firebase

1. No console do Firebase, clique no ícone de engrenagem ⚙️ próximo a "Visão geral do projeto"
2. Selecione "Configurações do projeto"
3. Role até a seção "Seus apps"
4. Clique no ícone `</>` (Web)
5. Registre o app com o nome "rbmodas"
6. **NÃO habilite o Firebase Hosting** (já temos o site)
7. Clique em "Registrar app"
8. Copie o objeto `firebaseConfig` que aparece

## 4. Configurar o Arquivo firebase-config.js

1. Abra o arquivo `firebase-config.js` na raiz do projeto
2. Substitua os valores placeholder pelas suas credenciais reais:

```javascript
const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID"
};
```

Exemplo real (substitua com seus dados):
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDx-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "rbmodas.firebaseapp.com",
  projectId: "rbmodas",
  storageBucket: "rbmodas.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

## 5. Configurar Regras de Segurança do Firestore

Para desenvolvimento, use estas regras (no console do Firebase > Firestore > Regras):

**Opção 1 - Regras de teste (recomendada para desenvolvimento):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**Opção 2 - Regras alternativas (se a opção 1 não funcionar):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /products/{document=**} {
      allow read, write: if true;
    }
    match /orders/{document=**} {
      allow read, write: if true;
    }
  }
}
```

**Opção 3 - Regras básicas por coleção:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /products/{productId} {
      allow read: if true;
      allow write: if true;
    }
    match /orders/{orderId} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

**Como publicar as regras:**
1. No console do Firebase, vá para Firestore Database > Regras
2. Apague as regras existentes
3. Copie e cole uma das opções acima
4. Clique em "Publicar"
5. Aguarde a confirmação "Regras publicadas com sucesso"

**⚠️ IMPORTANTE:** Estas regras permitem leitura/escrita pública. Para produção, configure regras adequadas de segurança.

## 6. Estrutura do Banco de Dados

O Firestore terá as seguintes coleções:

### `products` (Produtos)
Cada documento contém:
- `name`: string (nome do produto)
- `team`: string (nome do time)
- `league`: string (liga/competição)
- `price`: number (preço atual)
- `oldPrice`: number (preço antigo, opcional)
- `image`: string (caminho da imagem)
- `sizes`: array (tamanhos disponíveis)
- `badge`: string (new, sale, hot, ou null)
- `description`: string (descrição do produto)
- `featured`: boolean (se é produto em destaque)
- `createdAt`: string (data de criação ISO)

### `orders` (Pedidos)
Cada documento contém:
- `customer`: object (dados do cliente)
  - `name`: string
  - `email`: string
  - `phone`: string
  - `address`: string
- `items`: array (itens do pedido)
- `total`: number (valor total)
- `status`: string (pending, confirmed, shipped, delivered)
- `createdAt`: string (data do pedido)
- `updatedAt`: string (última atualização)

## 7. Adicionar Produtos de Exemplo

Você pode adicionar produtos manualmente pelo console do Firebase ou usar a função JavaScript:

```javascript
// No console do navegador
addProductToFirebase({
  name: 'Camisa Brasil 2024/25 Titular',
  team: 'Brasil',
  league: 'Seleções',
  price: 349.90,
  oldPrice: 399.90,
  image: 'camisas/brasil-2024-home.jpg',
  sizes: ['P', 'M', 'G', 'GG'],
  badge: 'new',
  description: 'Camisa oficial da Seleção Brasileira',
  featured: true
});
```

## 8. Testar a Configuração

1. Abra o `index.html` no navegador
2. Abra o console do navegador (F12)
3. Você deve ver: "Firebase inicializado com sucesso!" e "X produtos carregados do Firebase"

## 9. Solução de Problemas

### Erro: "Firebase não está pronto"
- Verifique se o arquivo `firebase-config.js` está sendo carregado
- Verifique se as credenciais estão corretas
- Verifique se o Firestore está habilitado no console

### Erro: "Missing or insufficient permissions"
- Verifique as regras do Firestore
- Para desenvolvimento, use as regras de teste acima

### Produtos não aparecem
- Verifique se há documentos na coleção `products`
- Use a função `loadSampleProducts()` para carregar dados de exemplo

## 10. Próximos Passos

Para produção:
- Configure regras de segurança adequadas
- Configure autenticação do Firebase
- Configure índices compostos se necessário
- Configure Firebase Hosting para deploy
- Adicione Analytics para monitoramento

## Suporte

Para mais informações:
- [Documentação do Firebase](https://firebase.google.com/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
