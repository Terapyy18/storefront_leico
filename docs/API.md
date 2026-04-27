# leico API Documentation

## Base URL

```
https://your-project.supabase.co/functions/v1
```

## Authentication

Utilise le Bearer token Supabase dans le header:

```
Authorization: Bearer {access_token}
```

---

## 🔐 AUTH ENDPOINTS

### POST /auth-signup

Crée un nouvel utilisateur

**Request:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

**Response (200):**

```json
{
  "user": { "id": "uuid", "email": "user@example.com" },
  "session": { "access_token": "...", "refresh_token": "..." }
}
```

**Errors:**

- `400` Email already exists
- `400` Password too weak
- `400` Passwords don't match

---

### POST /auth-signin

Login utilisateur

**Request:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**

```json
{
  "user": { "id": "uuid", "email": "user@example.com" },
  "session": { "access_token": "...", "refresh_token": "..." }
}
```

**Errors:**

- `401` Invalid credentials

---

### POST /auth-signout

Logout utilisateur

**Request:**

```json
{
  "refresh_token": "..."
}
```

**Response (200):**

```json
{ "message": "Signed out successfully" }
```

---

## 📦 PRODUCTS ENDPOINTS

### GET /products

Liste les produits (avec pagination)

**Query params:**

| Param   | Type   | Default | Description               |
| ------- | ------ | ------- | ------------------------- |
| `page`  | number | `0`     | Page courante (0-indexed) |
| `limit` | number | `10`    | Nombre d'items par page   |

**Response (200):**

```json
{
  "products": [
    {
      "id": "uuid",
      "name": "Roman Chess",
      "price": 49.99,
      "description": "...",
      "image_url": "...",
      "category_id": "uuid",
      "is_active": true
    }
  ],
  "totalPages": 5,
  "currentPage": 0
}
```

---

### GET /products-by-category

Liste les produits groupés par catégorie (1 seule requête JOIN)

**Response (200):**

```json
{
  "sections": [
    {
      "category_id": "uuid",
      "category_name": "Roman Chess",
      "products": [
        {
          "id": "uuid",
          "name": "Roman Chess Set",
          "price": 49.99,
          "description": "...",
          "image_url": "...",
          "category_id": "uuid",
          "is_active": true
        }
      ]
    }
  ]
}
```

---

### GET /products/:id

Détail d'un produit + ses variantes

**Response (200):**

```json
{
  "product": {
    "id": "uuid",
    "name": "Roman Chess Set",
    "price": 49.99,
    "description": "...",
    "image_url": "...",
    "category_id": "uuid",
    "is_active": true
  },
  "variants": [
    {
      "id": "uuid",
      "product_id": "uuid",
      "size": "M",
      "color": "Black",
      "stock": 10,
      "sku": "RCS-M-BLK"
    }
  ]
}
```

**Errors:**

- `404` Product not found

---

## ❤️ FAVORITES ENDPOINTS

### POST /favorites-add

Ajoute un produit aux favoris

**Auth required:** ✅ YES

**Request:**

```json
{
  "product_id": "uuid"
}
```

**Response (200):**

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "product_id": "uuid",
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Errors:**

- `401` Unauthorized
- `400` Product already favorited

---

### GET /favorites-list

Liste les favoris de l'utilisateur connecté

**Auth required:** ✅ YES

**Response (200):**

```json
{
  "favorites": [
    {
      "id": "uuid",
      "product_id": "uuid",
      "product": {
        "id": "uuid",
        "name": "...",
        "price": 49.99,
        "image_url": "...",
        "is_active": true
      }
    }
  ]
}
```

**Errors:**

- `401` Unauthorized

---

### DELETE /favorites-remove/:id

Supprime un favori

**Auth required:** ✅ YES

**Route param:**

- `id` : uuid du favori (pas du produit)

**Response (200):**

```json
{ "message": "Favorite removed" }
```

**Errors:**

- `401` Unauthorized
- `404` Favorite not found

---

## 🛒 CART (local — AsyncStorage)

> Le panier est géré **côté client uniquement** via `AsyncStorage`.  
> Aucun endpoint serveur n'est requis pour les opérations panier.  
> Les items du panier sont envoyés au moment du checkout.

| Opération         | Méthode                           |
| ----------------- | --------------------------------- |
| Ajouter un item   | `addItem(CartItem)`               |
| Supprimer un item | `removeItem(variant_id)`          |
| Modifier la qté   | `updateQuantity(variant_id, qty)` |
| Vider le panier   | `clearCart()`                     |

---

## 💳 PAYMENT ENDPOINTS (À IMPLÉMENTER)

### POST /create-payment-intent

Crée une Payment Intent Stripe

**Auth required:** ✅ YES

**Request:**

```json
{
  "amount": 4999,
  "currency": "eur"
}
```

**Response (200):**

```json
{
  "clientSecret": "pi_xxx_secret_xxx"
}
```

**Errors:**

- `401` Unauthorized
- `400` Invalid amount
- `500` Stripe error

---

### POST /create-order

Crée une commande après paiement confirmé

**Auth required:** ✅ YES

**Request:**

```json
{
  "items": [{ "variant_id": "uuid", "quantity": 2, "unit_price": 49.99 }],
  "shipping_address": "12 rue de la Paix, Paris",
  "total_amount": 99.98
}
```

**Response (200):**

```json
{
  "order": {
    "id": "uuid",
    "user_id": "uuid",
    "status": "pending",
    "total_amount": 99.98,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

**Errors:**

- `401` Unauthorized
- `400` Insufficient stock

---

## 📋 Database Schema

```sql
category        (id, name, slug, parent_id)
product         (id, name, description, price, image_url, category_id, is_active, created_at)
product_variant (id, product_id, size, color, stock, sku)
favorite        (id, user_id, product_id, created_at)
order           (id, user_id, total_amount, shipping_address, status, created_at)
order_item      (id, order_id, variant_id, quantity, unit_price)
```

---

## 🔒 RLS Policies (Row Level Security)

| Table             | SELECT        | INSERT                 | DELETE                 |
| ----------------- | ------------- | ---------------------- | ---------------------- |
| `product`         | Public        | Admin only             | Admin only             |
| `product_variant` | Public        | Admin only             | Admin only             |
| `category`        | Public        | Admin only             | Admin only             |
| `favorite`        | Own rows only | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `order`           | Own rows only | `auth.uid() = user_id` | —                      |
| `order_item`      | Via order     | Via order              | —                      |

---

## Error Codes Standard

| Code | Signification                   |
| ---- | ------------------------------- |
| 400  | Bad Request (données invalides) |
| 401  | Unauthorized (token manquant)   |
| 403  | Forbidden (token invalide)      |
| 404  | Not Found                       |
| 500  | Internal Server Error           |
