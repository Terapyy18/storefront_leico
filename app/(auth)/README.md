# 📁 app/(auth) — Routes d'authentification

Ce groupe gère l'ensemble du flux d'authentification utilisateur via **Supabase Auth**.  
Les écrans sont affichés en mode **modal** (stack presentation) par-dessus les onglets principaux.

---

## Architecture

```
app/(auth)/
├── _layout.tsx   → Stack modal (login + signup)
├── login.tsx     → Connexion (signin)
└── signup.tsx    → Inscription (signup)
```

> Le **signout** n'est pas une route dédiée — il est déclenché depuis `app/(tabs)/compte.tsx` via le hook `useAuth`.

---

## Routes

### 1. `/login` — Connexion

**Fichier :** `login.tsx`  
**Composant :** `LoginScreen`  
**Présentation :** Modal stack  
**Accès :** Public (non authentifié)

#### Description

Permet à un utilisateur existant de se connecter avec son email et son mot de passe.  
Appelle `supabase.auth.signInWithPassword()` via le hook `useAuth`.

#### Validations côté client

| Champ      | Règle                         |
| ---------- | ----------------------------- |
| `email`    | Requis · Format `x@x.x`       |
| `password` | Requis · Minimum 6 caractères |

#### Flux de succès

```
Utilisateur soumet le formulaire
  → signIn(email, password)
    → supabase.auth.signInWithPassword()
      ✅ Succès → router.back() ou router.replace('/')
```

#### Exemple de requête Supabase

```ts
const { error } = await supabase.auth.signInWithPassword({
  email: 'utilisateur@exemple.com',
  password: 'monmotdepasse',
});
```

#### Réponse succès

```ts
{
  data: {
    user: {
      id: "uuid-utilisateur",
      email: "utilisateur@exemple.com",
      created_at: "2025-01-15T10:30:00Z",
    },
    session: {
      access_token: "eyJhbGciOiJIUz...",
      refresh_token: "...",
      expires_in: 3600,
    }
  },
  error: null
}
```

#### Erreurs possibles

| Code / Message Supabase               | Cause                              | Affichage utilisateur                                    |
| ------------------------------------- | ---------------------------------- | -------------------------------------------------------- |
| `Invalid login credentials`           | Email ou mot de passe incorrect    | Message d'erreur Supabase affiché tel quel               |
| `Email not confirmed`                 | Compte créé mais email non vérifié | Message d'erreur Supabase affiché tel quel               |
| _(validation locale)_ champ vide      | Email absent                       | `"L'email est requis."`                                  |
| _(validation locale)_ format invalide | Email mal formé                    | `"Format d'email invalide."`                             |
| _(validation locale)_ trop court      | Mot de passe < 6 caractères        | `"Le mot de passe doit contenir au moins 6 caractères."` |

---

### 2. `/signup` — Inscription

**Fichier :** `signup.tsx`  
**Composant :** `SignupScreen`  
**Présentation :** Modal stack  
**Accès :** Public (non authentifié)

#### Description

Crée un nouveau compte utilisateur via Supabase.  
Après l'inscription, **Supabase envoie un email de confirmation** : l'utilisateur doit cliquer sur le lien avant de pouvoir se connecter.

#### Validations côté client

| Champ             | Règle                            |
| ----------------- | -------------------------------- |
| `email`           | Requis · Format `x@x.x`          |
| `password`        | Requis · Minimum 6 caractères    |
| `confirmPassword` | Doit être identique à `password` |

#### Flux de succès

```
Utilisateur soumet le formulaire
  → signUp(email, password)
    → supabase.auth.signUp()
      ✅ Succès → Écran de confirmation "Vérifiez votre email"
                  → Bouton "Aller à la connexion" → router.push('/login')
```

#### Exemple de requête Supabase

```ts
const { error } = await supabase.auth.signUp({
  email: 'nouveau@exemple.com',
  password: 'monmotdepasse',
});
```

#### Réponse succès

```ts
{
  data: {
    user: {
      id: "uuid-nouveau-utilisateur",
      email: "nouveau@exemple.com",
      email_confirmed_at: null,   // null tant que l'email n'est pas vérifié
      created_at: "2025-04-21T12:00:00Z",
    },
    session: null   // null car confirmation email requise
  },
  error: null
}
```

#### Erreurs possibles

| Code / Message Supabase                    | Cause                                         | Affichage utilisateur                                    |
| ------------------------------------------ | --------------------------------------------- | -------------------------------------------------------- |
| `User already registered`                  | Email déjà utilisé                            | Message d'erreur Supabase affiché tel quel               |
| `Password should be at least 6 characters` | Mot de passe trop court (validation Supabase) | Message d'erreur Supabase affiché tel quel               |
| _(validation locale)_ champ vide           | Email absent                                  | `"L'email est requis."`                                  |
| _(validation locale)_ format invalide      | Email mal formé                               | `"Format d'email invalide."`                             |
| _(validation locale)_ trop court           | Mot de passe < 6 caractères                   | `"Le mot de passe doit contenir au moins 6 caractères."` |
| _(validation locale)_ ne correspondent pas | Les deux mots de passe diffèrent              | `"Les mots de passe ne correspondent pas."`              |

---

### 3. Signout — Déconnexion

**Aucune route dédiée.**  
La déconnexion est gérée depuis `app/(tabs)/compte.tsx` via le bouton "Se déconnecter".

**Composant :** `CompteScreen`  
**Accès :** Authentifié uniquement (le bouton n'est affiché que si `user !== null`)

#### Description

Appelle `supabase.auth.signOut()` puis efface la session persistée en `AsyncStorage` (via `clearSession` dans `AuthContext`).

#### Exemple d'appel

```ts
const { signOut } = useAuth();
// ...
<Pressable onPress={signOut}>Se déconnecter</Pressable>
```

#### Comportement après déconnexion

```
signOut()
  → supabase.auth.signOut()
  → onAuthStateChange déclenché (event: 'SIGNED_OUT')
    → AuthContext : user = null, session = null
    → clearSession() → AsyncStorage nettoyé
      ✅ L'interface bascule sur l'état "non connecté"
```

#### Erreurs possibles

| Cause                  | Comportement                                                      |
| ---------------------- | ----------------------------------------------------------------- |
| Erreur réseau Supabase | L'erreur est silencieuse (non affichée à l'utilisateur)           |
| Session déjà expirée   | `signOut()` réussit quand même côté client (session locale vidée) |

---

## Hooks & Contexte utilisés

| Hook / Contexte                | Fichier                      | Rôle                                             |
| ------------------------------ | ---------------------------- | ------------------------------------------------ |
| `useAuth()`                    | `hooks/useAuth.ts`           | Expose `signIn`, `signUp`, `signOut`, `user`     |
| `AuthContext` / `AuthProvider` | `context/AuthContext.tsx`    | State global de session (user, session, loading) |
| `supabase`                     | `services/supabaseClient.ts` | Client Supabase (Auth + storage platform-aware)  |

---

## Navigation

```
/login  ←→  /signup        (liens croisés dans chaque écran)
/login       → / ou back   (après connexion réussie)
/signup      → /login      (après envoi de l'email de confirmation)
compte.tsx   → /login      (si non connecté)
compte.tsx   → signOut()   (si connecté)
```
