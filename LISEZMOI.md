# React-FB — instae-commerce

Projet React (Vite) + Express + SQLite : inscription, connexion, puis boutique
(menu, barre de recherche, produits, panier).

## Prérequis
- Node.js (version 22 ou plus) : https://nodejs.org
- VS Code

## Installation (une seule fois)
1. Dézipper le dossier, puis l'ouvrir dans VS Code (Fichier → Ouvrir le dossier → `React-FB`).
2. Ouvrir un terminal : menu **Terminal → Nouveau terminal**.
3. Installer les dépendances (3 commandes, dans l'ordre) :

```
npm install
npm install --prefix Backend
npm install --prefix Frontend
```

## Lancer le projet
Toujours depuis le dossier `React-FB` :

```
npm run dev
```

Cette commande lance le backend (port 3000) et le frontend (port 5173).
Ouvrir ensuite **http://localhost:5173** dans le navigateur.

Pour arrêter : **Ctrl + C** dans le terminal.

## Utilisation
1. Créer un compte (mot de passe de **12 caractères minimum**).
2. Cliquer sur **Se connecter** et entrer l'e-mail et le mot de passe.
3. La page **Boutique** s'affiche : menu, recherche, produits, panier.

La base de données `Backend/boutique.db` est créée automatiquement au premier
lancement (avec 2 produits : Clavier et Souris). On peut l'ouvrir avec
DB Browser for SQLite pour voir les utilisateurs.

## Organisation des fichiers
```
React-FB/
├── package.json           commande "npm run dev" (lance back + front)
├── Backend/
│   ├── server.js          serveur Express (port 3000)
│   ├── db.js              base SQLite (tables utilisateurs, produits)
│   ├── routes/            URL de l'API (/api/inscription, /api/connexion, /api/produits)
│   └── controllers/       traitement de chaque route
└── Frontend/
    ├── vite.config.js     proxy : /api → http://localhost:3000
    └── src/
        ├── main.jsx       démarre React
        ├── App.jsx        routes : /, /authentification, /boutique
        ├── index.css      style global
        └── composants/    Layout, Inscription, Connexion, Boutique,
                           Authentification, BarreRecherche, Menu, Produit, Panier
```

## Problèmes fréquents
- `Missing script: "dev"` : le terminal n'est pas dans le dossier `React-FB` (faire `cd ..`).
- « Serveur injoignable » : le backend ne tourne pas, relancer `npm run dev`.
- Port 3000 déjà utilisé : fermer les autres terminaux qui lancent `node`.

⚠️ Les mots de passe sont stockés en clair : projet d'école, usage local uniquement.
