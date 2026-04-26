
# 🎓 Smart Campus — Plateforme IoT Intelligente

> Projet Développement Web — Groupe C — ING1 2025-2026 | CY Tech  
> Thème : **Université/École Intelligente**

## 📋 Description

Smart Campus est une plateforme numérique intelligente pour la gestion d'une université connectée. Elle centralise la surveillance des objets IoT (thermostats, caméras, éclairages, capteurs…), les actualités du campus, et les outils de gestion des ressources.

--- 

# ⚡ GUIDE DE LANCEMENT RAPIDE (Smart Campus)
## ⚡ LANCEMENT RAPIDE

1️⃣ Installation (une seule fois)  
- Terminal dans `/backend` → `npm install`  
- Terminal dans `/frontend` → `npm install`  

2️⃣ Base de données  
- Lancer WampServer (MySQL actif)  
- Importer `SQL/schemas.sql` (obligatoire)  
- Importer `SQL/requetes.sql` (optionnel)  

3️⃣ Backend  
- Terminal dans `/backend` → `node server.js`  

4️⃣ Frontend  
- Terminal dans `/frontend` → `npm run dev`  

🌐 Accès : http://localhost:5173

---

## 0️⃣ PREMIÈRE FOIS ? (Installation)

Avant de lancer le projet, assurez-vous d’avoir installé les outils suivants :

- **Node.js** (version 18 ou plus)
- **npm** (installé avec Node.js)
- **WampServer** (Apache + MySQL en local)
- **MySQL Workbench** (pour gérer et importer la base de données)

---

### ⚙️ Configuration requise

- Activer **Apache** et **MySQL** via WampServer (icône verte)
- Avoir un serveur MySQL accessible en local 
- Configurer le fichier `.env` dans le dossier `/backend` avec vos identifiants MySQL

---

## 1️⃣ SQL (La Base de données)

### 📌 Action

* Ouvrir **WampServer**
* Vérifier que MySQL est actif (icône verte)

---

### 📌 Base

La base de données utilisée dans le projet est :

```sql
smart_campus
```

Elle doit être créée avant de lancer le backend.

---

### 📂 Fichiers SQL

La base de données est composée de **deux fichiers principaux** :

#### 🔹 `schemas.sql`

Ce fichier permet :

* de créer la base de données `smart_campus`
* de créer toutes les tables du projet (`users`, `rooms`, `devices`, etc.)
* de définir les relations entre les tables (clés étrangères)

👉 Il sert à **initialiser complètement la base de données**

---

#### 🔹 `requetes.sql`

Ce fichier contient :

* des requêtes SQL (SELECT, INSERT, UPDATE)
* des données de test
* des exemples de requêtes pour vérifier le bon fonctionnement

👉 Il sert à **tester et manipuler la base de données**

---

### ⚙️ Installation avec MySQL Workbench

#### 1. Ouvrir MySQL Workbench

* Se connecter à **localhost**

---

#### 2. Importer la base

1. Ouvrir le fichier `schemas.sql`
2. Cliquer sur le bouton **⚡ Execute**

👉 Cela crée :

* la base `smart_campus`
* toutes les tables nécessaires

---

#### 3. Tester la base

1. Ouvrir le fichier `requetes.sql`
2. Cliquer sur **⚡ Execute**

👉 Cela permet de :

* vérifier que les tables fonctionnent
* afficher des données
* tester les requêtes SQL

---

### ✅ Résultat attendu

* La base `smart_campus` est créée
* Toutes les tables sont présentes
* Les données peuvent être utilisées par le backend

---


---

## 2️⃣ BACKEND (Le Serveur)
* **Emplacement :** `/backend`
* **Commande :** ```npm start ```

## 3️⃣ FRONTEND (L'Interface)
* **Emplacement :** `/frontend`
* **Commande :** ```
   npm run dev ```

* **Lien :** Cliquez sur [http://localhost:5173](http://localhost:5173)

---

## 🛠️ DÉPANNAGE RAPIDE

* **Le backend crash ?** Vérifie le fichier `.env` (MDP : `cytech0001`).
* **Erreur de Login ?** Va en SQL -> Table `users` -> Mets `is_approved = 1` pour ton compte.
* **"Command not found" ?** Vérifie que tu as bien fait l'étape **0️⃣**.


---

## 🏗️ Stack Technique

| Couche     | Technologie             |
|------------|-------------------------|
| Frontend   | React 18 + Vite         |
| Backend    | Node.js + Express       |
| Base de données | MySQL              |
| Auth       | JWT + bcrypt            |
| Email      | Nodemailer              |
| Charts     | Recharts                |
| Icons      | Lucide React            |

---


## 🚀 Installation & Lancement

### Prérequis
- Node.js ≥ 18
- MySQL ≥ 8
- npm



### 2. Backend

```bash
cd backend
npm install

# Copier et configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos paramètres MySQL et SMTP

npm run dev   # Démarre sur http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev   # Démarre sur http://localhost:5173
```

---

## 🔑 Compte de démonstration

| Email             | Mot de passe | Niveau  | Accès               |
|-------------------|--------------|---------|---------------------|
| admin@campus.fr   | Admin1234!   | Expert  | Tous les modules    |

> **Note :** Le mot de passe dans la BDD est hashé avec bcrypt. Pour tester, utilisez le hash fourni dans le schéma SQL, ou créez un nouveau compte admin via le script `scripts/create-admin.js` (à créer si besoin).

---

## 📦 Structure du projet

```
smart-campus/
├── backend/
│   ├── config/
│   │   └── db.js               # Pool de connexion MySQL
│   ├── controllers/
│   │   ├── authController.js   # Auth, profil, utilisateurs
│   │   ├── deviceController.js # Objets IoT, stats
│   │   └── contentController.js# News, events, services
│   ├── middleware/
│   │   └── auth.js             # JWT + contrôle de niveau
│   ├── routes/
│   │   └── index.js            # Toutes les routes API
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Navbar.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx         # Module Information (visiteur)
│   │   │   ├── Actualites.jsx   # Actualités & événements
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── VerifyEmail.jsx
│   │   │   ├── Devices.jsx      # Module Visualisation
│   │   │   ├── DeviceDetail.jsx
│   │   │   ├── DeviceNew.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Members.jsx
│   │   │   ├── Dashboard.jsx    # Module Gestion (avancé+)
│   │   │   └── Admin.jsx        # Module Administration (expert)
│   │   ├── utils/
│   │   │   └── api.js           # Instance Axios
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── database/
│   └── schema.sql              # Schéma + données initiales
├── .gitignore
└── README.md
```

---

## 🎯 Modules & Fonctionnalités

### Module Information (Visiteur — sans connexion)
- Page d'accueil avec statistiques du campus
- Consultation des actualités
- Consultation des événements
- **Recherche avec 2 filtres** (mots-clés + catégorie)
- Bouton d'inscription

### Module Visualisation (Utilisateur Simple — débutant/intermédiaire)
- Inscription avec vérification email
- Vérification de membership par l'admin
- Connexion avec vérification login/mot de passe
- Gestion de profil (public + privé)
- Consultation des profils des autres membres
- **Recherche d'objets IoT avec 4 filtres** (mots-clés, type, état, marque)
- Consultation des détails d'un objet
- Système de points et progression de niveau

### Module Gestion (Utilisateur Complexe — avancé/expert)
- Tableau de bord avancé avec graphiques
- Ajout d'objets connectés
- Modification des objets (attributs, statut)
- Activation/désactivation des objets
- Demande de suppression (→ admin)
- Suivi consommation énergétique
- Identification des objets défaillants


---

## 🔐 Système de niveaux & points

| Niveau        | Points requis | Accès                    |
|---------------|---------------|--------------------------|
| Débutant      | 0 pts         | Information + Visualisation |
| Intermédiaire | 3 pts         | Information + Visualisation |
| Avancé        | 5 pts         | + Module Gestion          |
| Expert        | 7 pts         | + Module Administration   |

**Gain de points :**
- Connexion : +0.25 pts
- Consultation d'un objet : +0.50 pts

---

## 🗄️ Variables d'environnement (backend/.env)

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=votre_mdp
DB_NAME=smart_campus
JWT_SECRET=votre_secret_jwt
JWT_EXPIRES_IN=7d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre@gmail.com
SMTP_PASS=votre_app_password
EMAIL_FROM=Smart Campus <votre@gmail.com>
FRONTEND_URL=http://localhost:5173
```

---

## 👥 Répartition des tâches 

| Membre | Tâches |
|--------|--------|
| Maellys| Base de données |
| Malak | Backend  |
| Samia | Backend  |
| Mohamed Lemine | Frontend  |
| Bayane| Frontend |

---

## 📝 Données de test

Le fichier `database/schema.sql` contient :
- **20 objets IoT** (thermostats, caméras, éclairages, capteurs, compteurs, accès, Wi-Fi, projecteurs)
- **10 salles** (amphi, TP, labo, bibliothèque, cafétéria…)
- **8 catégories** d'objets
- **6 actualités** et **6 événements**
- **8 services**
- **Historique** de consommation sur 7 jours
- **1 compte admin** prêt à l'emploi

---

## 🔗 Routes API principales

| Méthode | Route | Accès |
|---------|-------|-------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/news` | Public |
| GET | `/api/events` | Public |
| GET | `/api/devices` | Public (points si connecté) |
| GET | `/api/profile` | Connecté |
| PUT | `/api/profile` | Connecté |
| POST | `/api/devices` | Avancé+ |
| PUT | `/api/devices/:id` | Avancé+ |
| GET | `/api/admin/users` | Expert |
| DELETE | `/api/admin/devices/:id` | Expert |

---

## 🧪 Tests

- Tester sur Chrome, Firefox, Safari
- Tester en responsive : mobile (375px), tablette (768px), desktop (1280px)
- Vérifier la compatibilité des formulaires

---

*Projet réalisé dans le cadre du cours de Développement Web — CY Tech ING1 2025-2026*
>>>>>>> 8d696fec33917a25553435002e33938ac98a7b81
