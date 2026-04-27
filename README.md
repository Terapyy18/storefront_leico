# Leico — Mini marketplace de vêtements

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=Terapyy18_leico&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=Terapyy18_leico)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=Terapyy18_leico&metric=coverage)](https://sonarcloud.io/summary/new_code?id=Terapyy18_leico)

Application mobile et web d'un mini-marketplace de vêtements.
Un seul codebase pour **iOS, Android et Web** grâce à Expo + React Native Web, avec **Supabase** comme backend unifié.

> 🎓 Projet scolaire — Sup de Vinci — Coordinateur de Projets Informatiques — 2026
> 👥 Équipe de 3 — 5 jours de développement

## 🎯 Fonctionnalités

**Côté utilisateur :**

- Inscription / connexion (Supabase Auth)
- Parcours des produits (liste + fiche détaillée + filtre par catégorie)
- Ajout aux favoris (persistés en BDD pour les utilisateurs connectés)
- Ajout au panier (persisté en local via AsyncStorage / localStorage)
- **Checkout simulé** : la commande est créée en base avec le statut `paid`,
  sans passer par un vrai prestataire de paiement (voir [Limitations](#-limitations))
- Historique des commandes

**Côté admin :**

- CRUD produits, catégories et variantes via une interface dédiée (`/admin`)
- Consultation des commandes

## 🏗️ Architecture

```
┌──────────────────────────────────────────────┐
│    React Native + Expo (iOS / Android / Web) │
│   ─ expo-router pour la navigation           │
│   ─ AsyncStorage / localStorage (panier)     │
└──────────────────┬───────────────────────────┘
                   │ supabase-js
                   ▼
            ┌──────────────┐
            │   Supabase   │
            │  ┌────────┐  │
            │  │ Auth   │  │  email + password
            │  │ DB     │  │  PostgreSQL + RLS
            │  └────────┘  │
            └──────────────┘
```

**Pas de backend custom et pas d'Edge Function** : toutes les opérations passent
directement par le client Supabase depuis l'app, et la sécurité repose sur les
policies **Row Level Security** (cf. [`supabase/schema.sql`](supabase/schema.sql)).

## ⚠️ Limitations

Décisions assumées dans le cadre du projet école (5 jours / équipe de 3) :

- **Paiement simulé** : `hooks/useMockCheckout.ts` insère directement la
  commande en base avec le statut `paid`. Aucune intégration Stripe / autre
  PSP n'est branchée. Pour passer en production, il faudrait ajouter une
  Edge Function `create-checkout-session` qui appelle l'API du PSP, et marquer
  la commande comme `paid` uniquement sur webhook de confirmation.
- **Pas de gestion de stock transactionnelle** : la décrémentation du stock
  des variantes après une commande n'est pas implémentée.
- **Admin = utilisateur connecté quelconque** : la zone `/admin` n'a pas de
  rôle dédié côté JWT. À durcir avant toute mise en prod (ex. claim
  `auth.jwt() ->> 'role' = 'admin'` + policies INSERT/UPDATE/DELETE).

## 🛠️ Stack

- **React Native 0.81 + Expo SDK 54** (iOS / Android)
- **React Native Web** (build web)
- **expo-router** (file-based routing)
- **Supabase** : Auth + PostgreSQL + RLS
- **AsyncStorage** (persistance panier & session sur mobile)
- **Jest + jest-expo** (tests unitaires)
- **ESLint** (`eslint-config-expo`)

## 📋 Prérequis

- Node.js 18+
- npm
- Expo CLI (via `npx`)
- Un projet Supabase (gratuit)
- Pour mobile : app **Expo Go** (iOS / Android) ou un émulateur

## 🚀 Installation

```bash
# Cloner le repo
git clone git@github.com:Terapyy18/leico.git
cd leico

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env.local
# Éditer .env.local avec les clés Supabase du projet
#   EXPO_PUBLIC_SUPABASE_URL=...
#   EXPO_PUBLIC_SUPABASE_KEY=...

# Provisionner la base (à exécuter dans Supabase SQL Editor)
# → copier-coller le contenu de supabase/schema.sql

# Lancer en mode dev
npx expo start
```

Choisir ensuite :

- `w` → navigateur (web)
- `i` → simulateur iOS
- `a` → émulateur Android
- Scanner le QR code avec Expo Go sur mobile

## 🧪 Tests

```bash
npm test
```

Tests unitaires Jest dans `__tests__/` (validation email, persistance session).

## 📚 Documentation

- [`docs/API.md`](docs/API.md) — endpoints utilisés (auth + tables Supabase)
- [`docs/AUTH.md`](docs/AUTH.md) — flux d'authentification détaillé
- [`docs/openapi.yaml`](docs/openapi.yaml) — spec OpenAPI 3.1 des endpoints
- [`docs/sequence-diagrams.md`](docs/sequence-diagrams.md) — diagrammes de séquence (login, checkout)
- [`supabase/schema.sql`](supabase/schema.sql) — DDL complet (tables, FK, index, RLS)

## 📝 Licence

Projet scolaire Theo, Baptiste, Thomas — Sup de Vinci — 2026
