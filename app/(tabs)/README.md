# 📁 app/(tabs) — Routes principales (onglets)

Ce groupe contient les écrans principaux de l'application, accessibles via la **barre d'onglets**.  
Un **bouton panier flottant (FAB)** est présent sur tous les onglets et ouvre `CartModal`.

---

## Architecture

```
app/(tabs)/
├── _layout.tsx          → TabLayout (3 onglets visibles + routes cachées + FAB panier)
├── index.tsx            → Onglet "Products" (liste par catégorie)
├── favorites.tsx        → Onglet "Favorites"
├── compte.tsx           → Onglet "Account" (profil + signout)
├── explore.tsx          → (caché, href: null)
├── product/
│   └── [id].tsx         → Détail produit (route cachée)
└── category/
    └── [id].tsx         → Liste par catégorie (route cachée)
```

> Les routes `product/[id]`, `category/[id]` et `explore` sont **cachées** de la tab bar (`href: null`).

---

## Routes visibles

### 1. `/` (index) — Liste des produits

**Fichier :** `index.tsx`  
**Composant :** `HomeScreen`  
**Onglet :** Products (icône `house.fill`)  
**Accès :** Public

#### Description

Affiche les produits regroupés **par catégorie** dans une `SectionList`.  
Chaque section dispose d'un bouton "View all →" qui navigue vers la liste complète de la catégorie.

#### Hook de données

`useProductsByCategory()` — regroupe les produits actifs par catégorie depuis Supabase.

#### Requête Supabase (interne au hook)

```ts
// Chargement des catégories
const { data: categories } = await supabase
  .from('category')
  .select('id, name')
  .order('name');

// Chargement des produits actifs (paginés, PAGE_SIZE = 10)
const { data: products } = await supabase
  .from('product')
  .select('*')
  .eq('is_active', true)
  .range(page * 10, page * 10 + 9);
```

#### Structure de données retournée

```ts
type Section = {
  category_id: string;
  category_name: string;
  data: Product[];
};

type Product = {
  id: string;
  name: string;
  price: number;
  description: string | null;
  image_url: string | null;
  category_id: string | null;
  is_active: boolean;
};
```

#### Exemple de section

```ts
[
  {
    category_id: "cat-abc123",
    category_name: "T-Shirts",
    data: [
      { id: "prod-001", name: "T-Shirt Blanc", price: 29.99, is_active: true, ... },
      { id: "prod-002", name: "T-Shirt Noir",  price: 34.99, is_active: true, ... },
    ]
  }
]
```

#### Navigation sortante

| Action                        | Destination                              |
|-------------------------------|------------------------------------------|
| Appui sur un `ProductCard`    | `/(tabs)/product/[id]`                   |
| Appui "View all →"            | `/(tabs)/category/[id]` + params `name`  |

#### États de l'écran

| État       | Affichage                                  |
|------------|--------------------------------------------|
| `loading`  | `ActivityIndicator` centré                 |
| `error`    | Message d'erreur + texte Supabase          |
| Vide       | `"No products available."`                |
| Normal     | `SectionList` avec `ProductCard`           |

#### Erreurs possibles

| Cause                         | Comportement                              |
|-------------------------------|-------------------------------------------|
| Erreur réseau / Supabase       | `error` affiché dans l'UI                |
| Aucun produit actif            | `ListEmptyComponent` visible             |
| Catégories vides               | Aucune section affichée                  |

---

### 2. `/favorites` — Favoris

**Fichier :** `favorites.tsx`  
**Composant :** `FavoritesScreen`  
**Onglet :** Favorites (icône `heart` / `heart.fill`)  
**Accès :** Authentifié (redirige vers `/login` si non connecté)

#### Description

Affiche la liste des produits mis en favori par l'utilisateur connecté.  
La liste est **rechargée à chaque focus** de l'onglet via `useFocusEffect`.  
La suppression utilise des **mises à jour optimistes** (UI immédiate + rollback si erreur).

#### Hooks de données

- `useAuth()` — pour récupérer `user.id`
- `useFavorites(userId)` — gère la liste des IDs favoris (table `favorite`)

#### Requêtes Supabase

**1. Fetch des IDs favoris** (dans `useFavorites`) :

```ts
const { data } = await supabase
  .from('favorite')
  .select('product_id')
  .eq('user_id', "uuid-utilisateur");
// → [{ product_id: "prod-001" }, { product_id: "prod-003" }]
```

**2. Fetch des produits favoris** (dans le composant) :

```ts
const { data } = await supabase
  .from('product')
  .select('*')
  .in('id', ["prod-001", "prod-003"]);
```

#### Exemple de réponse produits

```ts
[
  {
    id: "prod-001",
    name: "T-Shirt Blanc",
    price: 29.99,
    image_url: "https://...",
    category_id: "cat-abc123",
    is_active: true,
    description: null
  },
  {
    id: "prod-003",
    name: "Jean Slim",
    price: 59.99,
    image_url: "https://...",
    category_id: "cat-def456",
    is_active: true,
    description: "Coupe slim, stretch"
  }
]
```

#### Supprimer un favori

```ts
// Appel via useFavorites.removeFavorite(productId)
const { error } = await supabase
  .from('favorite')
  .delete()
  .eq('user_id', "uuid-utilisateur")
  .eq('product_id', "prod-001");
```

#### Ajouter un favori

```ts
// Appel via useFavorites.addFavorite(productId) — depuis ProductDetailScreen
const { error } = await supabase
  .from('favorite')
  .insert({ user_id: "uuid-utilisateur", product_id: "prod-005" });
```

#### États de l'écran

| État                        | Affichage                                                    |
|-----------------------------|--------------------------------------------------------------|
| `authLoading`               | `ActivityIndicator`                                          |
| Non connecté (`!user`)      | Message + bouton "Sign In" → `/login`                        |
| `favLoading` ou `productsLoading` | `ActivityIndicator`                                  |
| Aucun favori                | `"No favorites yet"`                                         |
| Normal                      | `FlatList` de `FavoriteCard` avec bouton "Remove"            |

#### Erreurs possibles

| Code Supabase | Cause                                    | Comportement                                 |
|---------------|------------------------------------------|----------------------------------------------|
| `23505`       | Doublon en base (favori déjà ajouté)     | Ignoré silencieusement (état local correct)  |
| Autre erreur  | Erreur d'insert/delete réseau            | Rollback de la mise à jour optimiste         |
| Erreur fetch  | Produits introuvables                    | Log console, `products` reste vide           |

---

### 3. `/compte` — Compte & Déconnexion

**Fichier :** `compte.tsx`  
**Composant :** `CompteScreen`  
**Onglet :** Account (icône `person.fill`)  
**Accès :** Public (affichage adaptatif selon l'état de connexion)

#### Description

Écran de profil utilisateur. Affiche les informations du compte si connecté, ou propose de se connecter / s'inscrire.  
**C'est ici que le signout est déclenché.**

#### Comportement selon l'état d'auth

| État               | Affichage                                                    |
|--------------------|--------------------------------------------------------------|
| `loading`          | `ActivityIndicator`                                          |
| Connecté (`user`)  | Email · Date d'inscription · Bouton "Se déconnecter"         |
| Non connecté       | Texte d'invite · Bouton "Se connecter" · Bouton "Créer un compte" |

#### Exemple de données utilisateur affichées

```ts
// user vient de useAuth() → Supabase User
{
  email: "utilisateur@exemple.com",
  created_at: "2025-01-15T10:30:00.000Z"
  // → affiché : "Membre depuis 15/01/2025"
}
```

#### Déconnexion

```ts
const { signOut } = useAuth();
// Déclenché par Pressable "Se déconnecter"
await supabase.auth.signOut();
// → onAuthStateChange (SIGNED_OUT) → user = null, session = null
// → AsyncStorage nettoyé via clearSession()
```

#### Navigation sortante

| Action                        | Destination |
|-------------------------------|-------------|
| Non connecté → "Se connecter" | `/login`    |
| Non connecté → "Créer un compte" | `/signup` |

#### Erreurs possibles

| Cause                  | Comportement                                          |
|------------------------|-------------------------------------------------------|
| Erreur signOut réseau  | Silencieuse (non affichée à l'utilisateur)           |
| Session déjà expirée   | `signOut()` réussit quand même côté client           |

---

## Routes cachées (sans onglet)

### `/product/[id]` — Détail produit

**Fichier :** `product/[id].tsx`  
**Composant :** `ProductDetailScreen`  
**Paramètre :** `id` (UUID du produit)  
**Accès :** Public (certaines actions nécessitent d'être connecté)

#### Requêtes Supabase

```ts
// 1. Produit
const { data: product } = await supabase
  .from('product')
  .select('*')
  .eq('id', id)
  .single();

// 2. Variantes
const { data: variants } = await supabase
  .from('product_variant')
  .select('*')
  .eq('product_id', id);
```

#### Exemple de réponse variantes

```ts
[
  { id: "var-001", product_id: "prod-001", size: "M",  color: "Blanc", stock: 12 },
  { id: "var-002", product_id: "prod-001", size: "L",  color: "Blanc", stock: 5  },
  { id: "var-003", product_id: "prod-001", size: "XL", color: "Blanc", stock: 0  },
]
```

#### Actions utilisateur

| Action               | Auth requise | Comportement si non connecté          |
|----------------------|--------------|---------------------------------------|
| Ajouter au panier    | ✅ Oui       | Alert → bouton "Sign In"             |
| Ajouter aux favoris  | ✅ Oui       | Alert "Please sign in to add favorites" |
| Voir le produit      | ❌ Non       | Toujours accessible                  |

#### États de l'écran

| État          | Affichage                          |
|---------------|------------------------------------|
| `loading`     | `ActivityIndicator`                |
| `notFound`    | "Product not found" + bouton back  |
| Normal        | Image · Nom · Prix · Variantes · Quantité · Panier · Favori |

#### Erreurs possibles

| Cause                         | Comportement                              |
|-------------------------------|-------------------------------------------|
| ID invalide / produit absent  | `notFound = true` → écran "not found"    |
| Erreur fetch variantes         | Log console, `variants` reste vide       |

---

## Contextes & Hooks utilisés

| Hook / Contexte    | Fichier                   | Route(s) concernée(s)               |
|--------------------|---------------------------|--------------------------------------|
| `useAuth()`        | `hooks/useAuth.ts`        | favorites, compte, product/[id]      |
| `useFavorites()`   | `hooks/useFavorites.ts`   | favorites, product/[id]              |
| `useCart()`        | `hooks/useCart.ts`        | product/[id], CartModal (FAB)        |
| `useProductsByCategory()` | `hooks/useProductsByCategory.ts` | index (Products)          |
| `useProducts()`    | `hooks/useProducts.ts`    | category/[id]                        |
| `CartContext`      | `context/CartContext.tsx`  | Panier global (persisté AsyncStorage)|
| `AuthContext`      | `context/AuthContext.tsx`  | Session globale (persistée AsyncStorage)|

---

## Schéma Supabase (tables utilisées)

| Table             | Colonnes clés                                              |
|-------------------|------------------------------------------------------------|
| `product`         | `id`, `name`, `price`, `description`, `image_url`, `category_id`, `is_active` |
| `product_variant` | `id`, `product_id`, `size`, `color`, `stock`               |
| `category`        | `id`, `name`                                               |
| `favorite`        | `user_id`, `product_id` *(clé composite unique)*           |

---

## 💳 PAYMENT (LOCAL MOCK)

### Checkout Flow (Mock)
Utilisé par: `checkout.tsx`

**Description:** Simule un paiement (local dev only)

**Flow:**
1. User remplit formulaire (fullName, email, address)
2. User clique "Pay €XX"
3. App crée une ordre en BDD directement
4. App redirige vers order-confirmation
5. Commande confirmée, panier vidé

**Note:** Ceci est un mock local. En production, intégrer Stripe Checkout.
