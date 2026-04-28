# Diagrammes de séquence — Leico

Diagrammes des principaux flux de l'application, en notation **Mermaid**
(rendu natif sur GitHub).

---

## 1. Inscription

```mermaid
sequenceDiagram
    autonumber
    actor U as Utilisateur
    participant App as App (signup.tsx)
    participant Ctx as AuthContext
    participant SB as Supabase Auth
    participant DB as Supabase DB

    U->>App: Saisit email + password
    App->>Ctx: signUp(email, password)
    Ctx->>SB: POST /auth/v1/signup
    SB->>DB: INSERT auth.users
    SB-->>Ctx: { user, session }
    Ctx->>Ctx: saveSession() → AsyncStorage
    Ctx-->>App: { error: null }
    App->>App: router.replace('/(tabs)')
```

---

## 2. Connexion

```mermaid
sequenceDiagram
    autonumber
    actor U as Utilisateur
    participant App as App (login.tsx)
    participant Ctx as AuthContext
    participant SB as Supabase Auth

    U->>App: Saisit email + password
    App->>Ctx: signIn(email, password)
    Ctx->>SB: POST /auth/v1/token?grant_type=password
    alt Identifiants valides
        SB-->>Ctx: { access_token, refresh_token, user }
        Ctx->>Ctx: saveSession()
        Ctx-->>App: { error: null }
        App->>App: router.replace('/(tabs)')
    else Identifiants invalides
        SB-->>Ctx: 401 Unauthorized
        Ctx-->>App: { error }
        App->>U: Affiche message d'erreur
    end
```

---

## 3. Liste produits + filtre catégorie

```mermaid
sequenceDiagram
    autonumber
    actor U as Utilisateur
    participant App as App (tabs/index.tsx)
    participant Hook as useProducts
    participant SB as Supabase REST
    participant DB as PostgreSQL

    U->>App: Ouvre l'accueil
    App->>Hook: useProducts(categoryId?)
    Hook->>SB: GET /rest/v1/product?is_active=eq.true&limit=10
    SB->>DB: SELECT * FROM product WHERE is_active = true
    Note over DB: RLS : lecture publique
    DB-->>SB: 10 produits
    SB-->>Hook: 200 OK
    Hook-->>App: products[]
    App->>U: Affiche grille produits

    U->>App: Scroll en bas
    App->>Hook: loadMore()
    Hook->>SB: GET /rest/v1/product?...&offset=10
    SB-->>Hook: 10 produits suivants
    Hook-->>App: append products
```

---

## 4. Ajout / suppression d'un favori

```mermaid
sequenceDiagram
    autonumber
    actor U as Utilisateur
    participant App as App (ProductCard)
    participant Hook as useFavorites
    participant SB as Supabase REST
    participant DB as PostgreSQL

    U->>App: Tap ❤
    App->>Hook: addFavorite(productId)
    Hook->>Hook: setState (optimiste)
    Hook->>SB: POST /rest/v1/favorite { user_id, product_id }
    SB->>DB: INSERT INTO favorite
    Note over DB: RLS : auth.uid() = user_id
    alt Succès
        DB-->>SB: 201 Created
        SB-->>Hook: OK
    else Conflit (déjà favori)
        DB-->>SB: 409 (UNIQUE violation)
        SB-->>Hook: 23505
        Hook->>Hook: warn (état déjà cohérent)
    else Erreur autre
        DB-->>SB: erreur
        SB-->>Hook: error
        Hook->>Hook: rollback setState
    end
```

---

## 5. Checkout simulé (paiement mocké)

```mermaid
sequenceDiagram
    autonumber
    actor U as Utilisateur
    participant App as App (checkout.tsx)
    participant Hook as useMockCheckout
    participant SB as Supabase REST
    participant DB as PostgreSQL

    U->>App: Saisit nom, email, adresse + valide
    App->>Hook: processPayment(...)
    Hook->>Hook: Vérif user connecté + panier non vide

    rect rgb(255, 245, 200)
        Note over Hook,DB: ⚠ Paiement simulé : pas de PSP
    end

    Hook->>SB: POST /rest/v1/order { user_id, total, addr, status: 'paid' }
    SB->>DB: INSERT INTO "order"
    DB-->>SB: order
    SB-->>Hook: { id }

    Hook->>SB: POST /rest/v1/order_item [...lignes]
    SB->>DB: INSERT INTO order_item
    DB-->>SB: 201
    SB-->>Hook: OK

    Hook->>Hook: clearCart()
    Hook->>App: router.push('/order-confirmation')
    App->>U: Page de confirmation
```

---

## 6. Affichage de l'historique des commandes

```mermaid
sequenceDiagram
    autonumber
    actor U as Utilisateur
    participant App as App (compte.tsx)
    participant Hook as useOrders
    participant SB as Supabase REST
    participant DB as PostgreSQL

    U->>App: Ouvre la page compte
    App->>Hook: useOrders()
    Hook->>SB: GET /rest/v1/order?user_id=eq.<uid>&order=created_at.desc
    SB->>DB: SELECT * FROM "order" WHERE user_id = auth.uid()
    Note over DB: RLS : own rows only
    DB-->>SB: commandes
    SB-->>Hook: 200 OK
    Hook-->>App: orders[]
    App->>U: Affiche la liste
```
