# BankDemo — Application Bancaire Mobile

Application bancaire complète composée d'un backend **Laravel 11** et d'un frontend mobile **Expo SDK 54 / React Native**.

---
## DEMO

[Voir la vidéo de démo](./8db9f544-37ee-4129-bb37-721d6d837b93.mp4)

## Architecture

```
AppFinale/
├── bankdemo-api/          # Backend Laravel 11 (PHP 8.2, Sanctum, SQLite)
├── bankdemo-mobile/       # Frontend Expo SDK 54 (React Native 0.81, TypeScript)
└── Mobile Banking Demo UI/ # Prototype web (référence design)
```

---

## Backend — `bankdemo-api`

### Stack technique
- **Laravel 11** avec **Sanctum** (authentification par token)
- **SQLite** (base de données locale)
- **PHP 8.2+**

### Modèles & Migrations
| Table | Description |
|-------|-------------|
| `users` | Utilisateurs (name, email, password) |
| `personal_access_tokens` | Tokens Sanctum |
| `accounts` | Comptes bancaires (account_number, balance) |
| `transactions` | Transactions (type: deposit/withdrawal/transfer, amount, description, status) |
| `atms` | Distributeurs (name, address, lat/lng, services JSON, available_24h, distance_km) |
| `recipients` | Bénéficiaires enregistrés (user_id, name, account_number) |
| `notifications` | Notifications utilisateur (user_id, type, title, message, read) |

### Routes API (`/api`)

**Publiques :**
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/login` | Connexion (email, password) → token |
| POST | `/register` | Inscription (name, email, password, password_confirmation) → token |

**Protégées (auth:sanctum) :**
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/logout` | Déconnexion |
| GET | `/user` | Profil utilisateur |
| GET | `/account` | Compte bancaire (solde, numéro) |
| GET | `/transactions` | Historique des transactions (envoyées et reçues) |
| POST | `/transactions/send` | Envoyer de l'argent (recipient_account_number, amount, description) |
| POST | `/transactions/deposit` | Effectuer un dépôt (amount, description) |
| GET | `/atms/nearby` | Distributeurs à proximité (lat, lng, radius) |
| GET | `/recipients` | Liste des bénéficiaires |
| POST | `/recipients` | Ajouter un bénéficiaire (name, account_number) |
| DELETE | `/recipients/{id}` | Supprimer un bénéficiaire |
| GET | `/notifications` | Notifications de l'utilisateur (max 50) |
| PATCH | `/notifications/{id}/read` | Marquer une notification comme lue |
| PATCH | `/notifications/read-all` | Marquer toutes les notifications comme lues |
| POST | `/change-password` | Changer le mot de passe (current_password, password, password_confirmation) |
| POST | `/revoke-token` | Révoquer le token de la session courante |
| POST | `/revoke-all-tokens` | Révoquer tous les tokens de l'utilisateur |
| POST | `/verify-password` | Vérifier le mot de passe (pour opérations sensibles) |

### Données de seed
- **4 utilisateurs** : Yassin (€4 872,50), Alex Martin, Sara Lopez, Marie Dupont
- **3 bénéficiaires** prédéfinis pour Yassin
- **7 transactions** en français (salaire, loyer, courses, etc.)
- **8 distributeurs** à Lyon avec services et disponibilité 24h
- **6 notifications** pré-remplies pour Yassin (transaction, sécurité, info)

### Lancement

```bash
cd bankdemo-api
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve
```

Pour exposer via localtunnel :
```bash
lt --port 8000 --subdomain bank-backend
```

---

## Frontend — `bankdemo-mobile`

### Stack technique
- **Expo SDK 54** / **React Native 0.81.5**
- **TypeScript**
- **@react-navigation/native** (navigation stack + bottom tabs)
- **@react-navigation/bottom-tabs** (barre de navigation par onglets)
- **@expo/vector-icons** (Ionicons, MaterialCommunityIcons, MaterialIcons, Feather)
- **expo-secure-store** (stockage sécurisé du token, préférences et identifiants)
- **expo-local-authentication** (biométrie)
- **expo-linear-gradient** (dégradés visuels carte bancaire)
- **react-native-maps** (carte des distributeurs)

### Navigation

L'application utilise une architecture de navigation à deux niveaux :

**Stack racine (NativeStack) :**
| Écran | Description |
|-------|-------------|
| `Splash` | Écran de chargement avec branding (redirection auto vers Login) |
| `Login` | Connexion |
| `Register` | Inscription |
| `MainTabs` | Navigation par onglets (écran principal) |
| `SendMoney` | Envoi d'argent (affiché par-dessus les onglets) |
| `Deposit` | Dépôt (affiché par-dessus les onglets) |
| `Notifications` | Notifications (affiché par-dessus les onglets) |

**Onglets principaux (BottomTabs) :**
| Onglet | Écran | Icône |
|--------|-------|-------|
| Accueil | `DashboardScreen` | `home` / `home-outline` |
| Carte | `CardScreen` | `card` / `card-outline` |
| Historique | `TransactionHistoryScreen` | `time` / `time-outline` |
| DAB | `ATMMapScreen` | `location` / `location-outline` |
| Paramètres | `SettingsScreen` | `settings` / `settings-outline` |

### Écrans (11 au total)

| Écran | Fichier | Description |
|-------|---------|-------------|
| Splash | `SplashScreen.tsx` | Écran de lancement animé avec branding BankDemo, fond dégradé multi-couche |
| Connexion | `LoginScreen.tsx` | Design premium fintech avec fond dégradé sombre, carte flottante, indicateurs de confiance |
| Inscription | `RegisterScreen.tsx` | Design premium assorti, formulaire complet avec validation + proposition biométrie |
| Tableau de bord | `DashboardScreen.tsx` | Solde en temps réel, boutons Envoyer/Dépôt, transactions récentes |
| Envoyer | `SendMoneyScreen.tsx` | Flux en 4 étapes : destinataire → montant → confirmation → succès |
| Dépôt | `DepositScreen.tsx` | Flux multi-étapes : source → montant → confirmation → traitement → succès |
| Historique | `TransactionHistoryScreen.tsx` | Filtres, recherche, regroupement par date, statistiques revenus/dépenses |
| Distributeurs | `ATMMapScreen.tsx` | Carte interactive, liste triée, marqueur sélectionné mis en évidence |
| Paramètres | `SettingsScreen.tsx` | Profil, thème, biométrie, changement de mot de passe, révocation de session, déconnexion |
| Notifications | `NotificationsScreen.tsx` | Données API réelles, filtres tout/non lues, marquer comme lu, pull-to-refresh |
| Carte | `CardScreen.tsx` | Carte visuelle interactive, révélation des détails, verrouillage, consultation PIN sécurisée, dépenses/plafonds |

### Composants UI

| Composant | Description |
|-----------|-------------|
| `Button.tsx` | Boutons Primary/Secondary/Text/Danger |
| `Input.tsx` | Champ texte avec label, erreur, recherche, montant, toggle visibilité mot de passe (icône œil) |
| `Cards.tsx` | BalanceCard, TransactionItem, ATMCard, QuickActionCard |
| `Modal.tsx` | Dialogue modal centré |
| `Toast.tsx` | Notifications toast animées (succès/erreur/info/warning) |
| `BankIcons.tsx` | 24 icônes vectorielles (@expo/vector-icons) |

### Fonctionnalités clés

- **Langue** : Intégralement en français
- **Données réelles** : Toutes les données proviennent de l'API (aucune donnée en dur)
- **Solde en temps réel** : Rechargement automatique via `useFocusEffect` après envoi/dépôt
- **Historique complet** : Les transactions envoyées ET reçues apparaissent dans l'historique (libellé « Reçu de… » / « Envoyé à… »)
- **Badge notifications** : Compteur de notifications non lues affiché sur l'icône cloche du tableau de bord
- **États de chargement** : Indicateur de chargement sur tous les écrans (Dashboard, Carte, Notifications, Paramètres) pour éviter les sauts de contenu
- **Splash screen** : Écran de lancement animé avec branding BankDemo et fond dégradé multi-couche
- **Navigation par onglets** : Barre d'onglets inférieure avec icônes remplies/outline selon l'état actif, ombre et élévation
- **Carte bancaire interactive** : Carte visuelle avec dégradé ; toucher pour révéler/masquer les détails (numéro, expiration, CVV), verrouillage, suivi des dépenses
- **Consultation du code PIN** : Affichage sécurisé du PIN avec vérification du mot de passe et masquage automatique après 30 secondes
- **Authentification biométrique** : Face ID / Touch ID avec ré-authentification complète depuis l'état déconnecté (stockage sécurisé des identifiants)
- **Biométrie à l'inscription** : Proposition d'activer la biométrie après la création du compte
- **Changement de mot de passe** : Modal dédiée dans les paramètres avec validation forte (longueur, casse, chiffres, symboles)
- **Toggle visibilité mot de passe** : Icône œil sur tous les champs de mot de passe (Login, Register, Settings, Card PIN)
- **Gestion des sessions** : Révocation du token courant ou de tous les tokens depuis les paramètres
- **Notifications temps réel** : Le destinataire d'un transfert reçoit automatiquement une notification
- **Notifications toast** : Système de toast animé pour toutes les actions (compatible dark mode)
- **Notifications persistées** : Notifications API réelles (transaction, sécurité, info) avec marquer lu
- **Statistiques historique** : Résumé des revenus/dépenses en haut de l'écran historique
- **Icônes vectorielles** : Aucun emoji, uniquement des composants `@expo/vector-icons`
- **Bénéficiaires persistés** : Ajout/suppression de bénéficiaires via l'API avec messages d'erreur détaillés
- **Dépôt multi-étapes** : Source (virement, carte) → montant → confirmation → traitement animé → succès
- **Mot de passe fort** : Validation visuelle en temps réel (longueur, majuscule, chiffre, caractère spécial)
- **Dark mode** : Support complet clair/sombre sur tous les composants (Toast, Button, Cards, Tab Bar, etc.)
- **Safe area** : Padding bottom adaptatif pour les écrans avec encoche/barre de navigation

### Authentification biométrique

1. À la première connexion par email/mot de passe, les identifiants sont stockés dans `expo-secure-store` (chiffré)
2. Aux lancements suivants, si la biométrie est activée → prompt biométrique → ré-authentification automatique (même après déconnexion complète)
3. La méthode `biometricLogin()` tente d'abord le token existant, puis ré-authentifie avec les identifiants stockés si le token est invalide
4. Après inscription, si le matériel le supporte → écran de configuration biométrique + sauvegarde des identifiants
5. Le réglage peut être désactivé/réactivé dans Paramètres → Sécurité
6. La préférence est stockée dans `expo-secure-store`

### Validation du mot de passe

L'inscription et le changement de mot de passe exigent un mot de passe respectant 4 règles :
- Au moins 8 caractères
- Une lettre majuscule
- Un chiffre
- Un caractère spécial (!@#$...)
- Barre de force (Faible / Moyen / Fort) + checklist colorée (à l'inscription)
- Validation côté backend via `Illuminate\Validation\Rules\Password` (changement de mot de passe)

### Lancement

```bash
cd bankdemo-mobile
npm install
npx expo start
```

### Configuration API

L'URL de l'API est définie dans `src/services/api.ts` :
```typescript
const API_BASE = 'https://bank-backend.loca.lt/api';
```

---

## Thème & Design

### Couleurs
- **Primary** : `#0B84FF`
- **Accent** : `#00C2A8`
- **Success** : `#28a745`
- **Error** : `#e03f3f`
- **Warning** : `#ffc107`
- **Purple** : `#8B5CF6`

### Design Login & Register
Les écrans de connexion et d'inscription utilisent un design premium fintech :
- Fond sombre (`#0a1628`) avec dégradés Primary et Purple en superposition
- Orbes géométriques décoratives avec effets de transparence
- Carte flottante centrée avec coins arrondis (Login)
- Logo et branding BankDemo en en-tête
- Indicateurs de confiance sous le formulaire

### Typographie
- **H1** : 32px / 600
- **H2** : 22px / 600
- **Body** : 16px / 400
- **Caption** : 13px / 400

### Modes
- Clair / Sombre / Automatique (configurable dans Paramètres)
