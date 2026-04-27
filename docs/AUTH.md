# Authentication Routes

Documentation des routes d'authentification utilisées par `login.tsx` et `signup.tsx`.

> Ces routes sont exposées directement par **Supabase Auth** — elles n'ont pas besoin d'être implémentées manuellement.  
> Le client Supabase (`@/services/supabaseClient`) les appelle en interne via `supabase.auth.signIn()` etc.

---

## Flux d'authentification

```
login.tsx                    AuthContext.tsx               Supabase Auth API
    │                              │                              │
    ├─ handleLogin()               │                              │
    │   └─ signIn(email, pass) ───►│                              │
    │                              ├─ auth.signInWithPassword() ─►│
    │                              │◄─────────────── { user, session } ─┤
    │                              ├─ setUser(user)               │
    │                              ├─ saveSession(session)        │
    │◄───────────────── { error: null } ──────────────────────────┤
    └─ router.replace('/(tabs)')   │                              │
```

---

## Routes

### POST /auth/v1/token?grant_type=password

**Utilisé par:** `login.tsx` → `signIn(email, password)` dans `AuthContext`

**Méthode SDK:**

```ts
supabase.auth.signInWithPassword({ email, password });
```

**Request (interne Supabase):**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**

```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "dGhpcyB...",
  "expires_in": 3600,
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

**Erreurs:**
| Code | Message Supabase | Affiché dans l'app |
|------|------------------|--------------------|
| 400 | `Invalid login credentials` | Affiché dans `<Text>{error}</Text>` |
| 422 | `Email not confirmed` | Affiché dans `<Text>{error}</Text>` |

**Validation côté client** (avant l'appel API):

```ts
if (!email.trim())         → "L'email est requis."
if (!isValidEmail(email))  → "Format d'email invalide."
if (password.length < 6)   → "Le mot de passe doit contenir au moins 6 caractères."
```

---

### POST /auth/v1/signup

**Utilisé par:** `signup.tsx` → `signUp(email, password)` dans `AuthContext`

**Méthode SDK:**

```ts
supabase.auth.signUp({ email, password });
```

**Request (interne Supabase):**

```json
{
  "email": "newuser@example.com",
  "password": "password123"
}
```

**Response (200) — email de confirmation désactivé:**

```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "dGhpcyB...",
  "user": {
    "id": "uuid",
    "email": "newuser@example.com",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

**Response (200) — email de confirmation activé:**

```json
{
  "user": {
    "id": "uuid",
    "email": "newuser@example.com",
    "email_confirmed_at": null
  },
  "session": null
}
```

> Quand `session` est `null`, l'app affiche l'écran "Vérifiez votre email" (`emailSent = true`).

**Erreurs:**
| Code | Message Supabase | Affiché dans l'app |
|------|------------------|--------------------|
| 422 | `User already registered` | Affiché dans `<Text>{error}</Text>` |
| 422 | `Password should be at least 6 characters` | Affiché dans `<Text>{error}</Text>` |

**Validation côté client** (avant l'appel API):

```ts
if (!email.trim())                  → "L'email est requis."
if (!isValidEmail(email))           → "Format d'email invalide."
if (password.length < 6)            → "Le mot de passe doit contenir au moins 6 caractères."
if (password !== confirmPassword)   → "Les mots de passe ne correspondent pas."
```

---

### POST /auth/v1/logout

**Utilisé par:** `compte.tsx` → bouton "Se déconnecter" → `signOut()` dans `AuthContext`

**Méthode SDK:**

```ts
supabase.auth.signOut();
```

**Request:** _(token Bearer dans le header, pas de body)_

**Response (204):** _(no content)_

**Effet dans l'app:**

```ts
// AuthContext.tsx — onAuthStateChange
// SIGNED_OUT → clearSession() → setUser(null) → setSession(null)
// → _layout.tsx : user = null, reste sur les tabs (app publique)
```

---

## Persistance de session

La session est persistée automatiquement dans `AsyncStorage` via `utils/storage.ts`.

```
Clé: '@leico:auth_session'

Au démarrage (AuthContext useEffect):
  1. getStoredSession()  → restaure la session instantanément (pas de flash)
  2. refreshSession()    → valide le token en arrière-plan
  3. setLoading(false)   → affiche l'app

onAuthStateChange:
  SIGNED_IN  → saveSession(session)
  SIGNED_OUT → clearSession()
```

---

## Fichiers concernés

| Fichier                      | Rôle                                               |
| ---------------------------- | -------------------------------------------------- |
| `app/(auth)/login.tsx`       | UI login + validation client                       |
| `app/(auth)/signup.tsx`      | UI signup + validation client + écran confirmation |
| `context/AuthContext.tsx`    | Appels Supabase Auth + gestion état global         |
| `hooks/useAuth.ts`           | Accès au contexte depuis les composants            |
| `utils/storage.ts`           | Persistance session AsyncStorage                   |
| `services/supabaseClient.ts` | Instance Supabase configurée                       |
