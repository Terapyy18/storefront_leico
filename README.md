# Marketplace — Mini marketplace de vêtements

Application mobile et web d'un mini-marketplace de vêtements.
Un seul codebase pour **iOS, Android et Web** grâce à Expo + React Native Web, avec **Supabase** comme backend unifié.

> 🎓 Projet scolaire — Sup de Vinci — Coordinateur de Projets Informatiques — 2026
> 👥 Équipe de 3 — 5 jours de développement

## 🎯 Fonctionnalités

**Côté utilisateur :**
- Inscription / connexion (Supabase Auth)
- Parcours des produits (liste + fiche détaillée)
- Ajout aux favoris (persisté localement)
- Ajout au panier (persisté localement)
- Paiement via Stripe Checkout

**Côté admin :**
- CRUD produits via **Supabase Studio** (interface native Supabase)
- Consultation des commandes via Supabase Studio

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│    React Native + Expo (Web + Mobile)   │
└────────────────┬────────────────────────┘
                 │
         ┌───────▼────────┐
         │   Supabase     │
         │  ┌──────────┐  │
         │  │  Auth    │  │
         │  │  DB      │  │  RLS policies
         │  │  Storage │  │  (images produits)
         │  │  Edge Fn │──┼──► Stripe API
         │  └──────────┘  │
         └────────────────┘
```

**Pas de backend custom** : toute la logique métier s'appuie sur Supabase (BDD, auth, storage) et sur des **Edge Functions** pour l'intégration Stripe sécurisée.

## 🛠️ Stack

- **React Native + Expo** (SDK 51+)
- **React Native Web** (build web)
- **React Navigation** (routing)
- **Supabase** (auth + DB + storage + edge functions)
- **Stripe Checkout** (paiement hébergé)
- **AsyncStorage** (persistance panier & favoris)
- **Expo WebBrowser** (redirection Stripe)

## 📋 Prérequis

- Node.js 18+
- npm ou yarn
- Expo CLI (via `npx`)
- Compte Supabase (gratuit)
- Compte Stripe (mode test)
- Pour mobile : app **Expo Go** (iOS / Android)

## 🚀 Installation

```bash
# Cloner le repo
git clone git@github.com:Terapyy18/leico.git
cd leico

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env
# Éditer .env (voir section suivante)

# Lancer en mode dev
npx expo start
```

Choisir ensuite :
- `w` → navigateur (web)
- `i` → simulateur iOS
- `a` → émulateur Android
- Scanner le QR code avec Expo Go sur mobile

## 📚 Ressources

- [Expo docs](https://docs.expo.dev/)
- [Supabase docs](https://supabase.com/docs)
- [Supabase RLS guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Stripe Checkout](https://stripe.com/docs/checkout/quickstart)
- [React Navigation](https://reactnavigation.org/)

## 📝 Licence

Projet scolaire Theo, Baptiste, Thomas — Sup de Vinci — 2026
