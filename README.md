# Bot Telegram d’Affiliation - MVP

---

## 📖 Présentation

Ce projet est un **bot Telegram SaaS** permettant à une communauté d’utilisateurs affiliés (par exemple, parieurs sportifs) de diffuser automatiquement leurs liens affiliés dans des groupes et canaux Telegram.  
L’objectif est d’automatiser la promotion, de tracker les clics sur les liens et de fournir un tableau de bord simple pour visualiser les statistiques.

---

## 🚀 Objectifs du MVP

- Permettre à un utilisateur d’ajouter ses liens affiliés via Telegram
- Diffuser automatiquement ces liens dans des groupes/canaux selon une fréquence définie
- Suivre les clics sur chaque lien via une API backend avec redirection trackée
- Fournir un dashboard web simple affichant les statistiques des liens
- Gérer les partenaires et les administrateurs avec un système de rôles

---

## ⚙️ Stack Technique

| Composant        | Technologie                       |
|------------------|-----------------------------------|
| Bot Telegram     | Python + python-telegram-bot      |
| Backend API      | Node.js + Express.js              |
| Base de données  | MySQL (hébergée sur Railway)      |
| Dashboard Web    | HTML, CSS, JavaScript Vanilla     |
| Hébergement      | Render, Railway, Vercel, Netlify  |
| Nom de domaine   | Freenom (gratuit)                 |

---

## 📁 Architecture du projet

/monbot-affiliation/
│
├── bot/ # Code Python du bot Telegram
│ └── main.py
│
├── api/ # Backend Express.js (Node.js)
│ ├── routes/
│ ├── controllers/
│ └── index.js
│
├── public/ # Landing page (facultatif)
│ └── index.html
│
├── dashboard/ # Dashboard client (HTML/CSS/JS)
│ ├── index.html
│ ├── css/
│ └── js/
│
├── sql/ # Scripts SQL (création tables)
│ └── init.sql
│
├── .env # Variables d’environnement (tokens, DB creds)
├── package.json # Dépendances backend Node.js
├── requirements.txt # Dépendances Python bot
└── README.md # Documentation (ce fichier)


---

## 💾 Structure Base de données (MySQL)

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  telegram_id VARCHAR(100),
  username VARCHAR(100),
  role ENUM('admin', 'partner') DEFAULT 'partner'
);

CREATE TABLE affiliate_links (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE clicks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  affiliate_link TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  user_ip VARCHAR(45),
  source_channel VARCHAR(255)
);


🔧 Fonctionnalités principales
Bot Telegram
Commandes /start, /help, /addlink, /mesliens

Gestion du choix de business (ex : paris sportifs, musique)

Ajout de liens affiliés et choix des canaux/groupes de diffusion

Envoi automatique de messages avec liens trackés

Backend API
Gestion des liens affiliés (CRUD)

Enregistrement des clics sur les liens

Redirection trackée via /redirect/:id

Gestion des utilisateurs et partenaires

Dashboard Web
Affichage des statistiques par utilisateur (clics, liens actifs)

Interface simple pour gérer liens et campagnes

💡 Bonnes pratiques
Stocker tokens et accès DB dans .env (ne pas versionner)

Utiliser Git avec commits clairs et réguliers

Modulariser le code (routes, contrôleurs, services)

Protéger les routes sensibles (authentification à prévoir)

Tester régulièrement le bot et l’API

🚀 Déploiement
Héberger la base MySQL sur Railway (offre gratuite)

Déployer l’API Node.js sur Render ou Railway

Héberger le bot Python sur Render ou Replit

Servir le dashboard sur Netlify ou Vercel

Configurer un nom de domaine gratuit via Freenom (optionnel)

📞 Contact
Pour toute aide ou questions, vous pouvez contacter l’auteur du projet.

📜 Licence
Ce projet est libre et open-source pour usage personnel et apprentissage.