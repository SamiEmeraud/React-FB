# Code complet du projet React-FB

Créer chaque fichier au chemin indiqué (à partir du dossier React-FB), puis coller son contenu.
Ensuite : voir les commandes à la fin.

---

## `package.json`

```json
{
  "name": "react-fb",
  "private": true,
  "scripts": {
    "dev": "concurrently -n back,front -c blue,green \"npm run dev --prefix Backend\" \"npm run dev --prefix Frontend\""
  },
  "dependencies": {
    "react-router": "^8.4.0"
  },
  "devDependencies": {
    "concurrently": "^10.0.6"
  }
}

```

---

## `Backend/package.json`

```json
{
  "name": "backend",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "dev": "node --watch server.js"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "type": "module",
  "dependencies": {
    "better-sqlite3": "^13.0.3",
    "express": "^5.3.0"
  }
}

```

---

## `Backend/server.js`

```js
// Importe Express (framework web pour Node.js)
import express from "express";
// Importe le routeur d'authentification (routes /inscription et /connexion)
// "default" : pas d'accolades, le nom authRoutes est choisi librement
import authRoutes from "./routes/auth.routes.js";
// Importe le routeur des produits (route GET /)
import produitsRoutes from "./routes/produits.routes.js";

// Crée l'application Express : l'objet qui représente ton serveur
const app = express();
// Middleware global : lit le JSON des requêtes et le place dans req.body
app.use(express.json()); // lit le JSON envoyé par React

// Monte le routeur d'authentification sous le préfixe "/api"
// Ses routes deviennent donc /api/inscription et /api/connexion
app.use("/api", authRoutes);                  // /api/inscription, /api/connexion
// Monte le routeur des produits sous le préfixe "/api/produits"
// Sa route "/" devient donc /api/produits
app.use("/api/produits", produitsRoutes);     // /api/produits

// Démarre le serveur sur le port 3000
// La fonction fléchée s'exécute une fois le serveur prêt et affiche un message
app.listen(3000, () => console.log("API démarrée sur http://localhost:3000"));
```

---

## `Backend/db.js`

```js
import Database from "better-sqlite3";
 
export const db = new Database("boutique.db"); // créé automatiquement
//db.pragma("journal_mode = WAL");   // meilleures performances en lecture
db.pragma("foreign_keys = ON");    // active les clés étrangères

db.exec(`
  CREATE TABLE IF NOT EXISTS utilisateurs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    mot_de_passe TEXT NOT NULL,
    cree_le TEXT DEFAULT (datetime('now'))
  );
 
  CREATE TABLE IF NOT EXISTS produits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    prix REAL NOT NULL
  );
`);
 
// Données de départ si la table est vide
const { total } = db.prepare("SELECT COUNT(*) AS total FROM produits").get();
if (total === 0) {
  const ajouter = db.prepare("INSERT INTO produits (nom, prix) VALUES (?, ?)");
  ajouter.run("Clavier", 49);
  ajouter.run("Souris", 25);
}
```

---

## `Backend/routes/auth.routes.js`

```js
// Importe Router depuis Express pour créer un mini-routeur
import { Router } from "express";
// Importe les deux fonctions de traitement du contrôleur d'authentification
import { inscription, connexion } from "../controllers/auth.controller.js";

// Crée le routeur d'authentification
const router = Router();

// POST /api/inscription (le préfixe /api est ajououté dans server.js)
router.post("/inscription", inscription);
// POST /api/connexion
router.post("/connexion", connexion);

// Exporte le routeur pour server.js
export default router;
```

---

## `Backend/routes/produits.routes.js`

```js
import { Router } from "express";
import { listerProduits } from "../controllers/produits.controller.js";

const router = Router();

router.get("/", listerProduits);

export default router;
```

---

## `Backend/controllers/auth.controller.js`

```js
// Importe la connexion à la base SQLite depuis db.js
import { db } from "../db.js";

// Fonction exportée : appelée par la route POST /api/inscription
export function inscription(req, res) {
  // Extrait les champs envoyés par le formulaire d'inscription
  const { nom, prenom, email, password } = req.body;

  // Validation : refuse si un champ est vide ou absent,
  // ou si le mot de passe fait moins de 12 caractères
  if (!nom || !prenom || !email || !password || password.length < 12) {
    // Répond 400 (requête invalide) ; "return" arrête la fonction ici
    return res.status(400).json({ message: "Données invalides" });
  }

  // try/catch : permet d'intercepter une erreur levée par la base de données
  try {
    // Prépare la requête SQL d'insertion ; chaque "?" sera remplacé par une valeur
    // (requête paramétrée : protège contre l'injection SQL)
    db.prepare(
      "INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe) VALUES (?, ?, ?, ?)"
    // Exécute l'insertion avec les valeurs, dans l'ordre des "?"
    ).run(nom, prenom, email, password);

    // Répond 201 (« créé ») avec un message JSON
    res.status(201).json({ message: "Compte créé" });
  } catch (err) {
    // Si l'email existe déjà, SQLite lève une erreur de contrainte d'unicité
    if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
      // Répond 409 (conflit) ; "return" évite d'exécuter la suite
      return res.status(409).json({ message: "Email déjà utilisé" });
    }
    // Autre erreur : on l'affiche dans le terminal du serveur pour la déboguer
    console.error(err);
    // Répond 500 (erreur interne) sans révéler les détails au client
    res.status(500).json({ message: "Erreur serveur" });
  }
}

// Fonction exportée : appelée par la route POST /api/connexion
export function connexion(req, res) {
  // Extrait l'email et le mot de passe envoyés par le formulaire de connexion
  const { email, password } = req.body;

  // Cherche l'utilisateur dont l'email ET le mot de passe correspondent
  const user = db
    // Requête paramétrée : ne récupère que l'id et le prénom, pas le mot de passe
    .prepare("SELECT id, prenom FROM utilisateurs WHERE email = ? AND mot_de_passe = ?")
    // .get() renvoie la première ligne trouvée, ou undefined s'il n'y en a aucune
    .get(email, password);

  // Aucun utilisateur trouvé : identifiants incorrects
  if (!user) {
    // Répond 401 (non autorisé) ; le message ne dit pas lequel des deux est faux
    return res.status(401).json({ message: "Email ou mot de passe incorrect" });
  }

  // Identifiants valides : renvoie l'id et le prénom en JSON (code 200 par défaut)
  res.json({ id: user.id, prenom: user.prenom });
}
```

---

## `Backend/controllers/produits.controller.js`

```js
// Importe la connexion à la base SQLite depuis db.js
// ("../" remonte d'un dossier : on sort de controllers/ pour atteindre la racine)
import { db } from "../db.js";

// Fonction exportée : appelée par la route GET /api/produits
// req = requête reçue (inutilisée ici), res = réponse à renvoyer
export function listerProduits(req, res) {
  // Récupère les produits dans la base et les stocke dans la variable "produits"
  const produits = db
    // Prépare la requête SQL : sélectionne id, nom et prix,
    // triés par nom dans l'ordre alphabétique
    .prepare("SELECT id, nom, prix FROM produits ORDER BY nom")
    // .all() exécute la requête et renvoie toutes les lignes
    // sous forme de tableau d'objets : [{ id, nom, prix }, ...]
    .all();
  // Envoie le tableau au client au format JSON (code HTTP 200 par défaut)
  res.json(produits);
}
```

---

## `Frontend/package.json`

```json
{
  "name": "frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.2.8",
    "react-dom": "^19.2.8",
    "react-router": "^8.4.0"
  },
  "devDependencies": {
    "@babel/core": "^7.29.7",
    "@eslint/js": "^10.0.1",
    "@rolldown/plugin-babel": "^0.2.3",
    "@types/react": "^19.2.18",
    "@types/react-dom": "^19.2.7",
    "@vitejs/plugin-react": "^6.1.1",
    "babel-plugin-react-compiler": "^1.0.0",
    "eslint": "^10.10.0",
    "eslint-plugin-react-hooks": "^7.1.1",
    "eslint-plugin-react-refresh": "^0.5.6",
    "globals": "^17.12.0",
    "vite": "^8.3.0"
  }
}

```

---

## `Frontend/vite.config.js`

```js
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],

  // "server" (en anglais) : options du serveur de dev Vite
  server: {
    // Redirige toutes les requêtes /api vers le backend Express
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
})

```

---

## `Frontend/index.html`

```html
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>instae-commerce</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>

```

---

## `Frontend/src/main.jsx`

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// BrowserRouter : active la navigation (nécessaire pour <Link> dans Inscription)
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

```

---

## `Frontend/src/App.jsx`

```jsx
// Routes / Route : associe une URL à un composant
import { Routes, Route } from 'react-router'
import Layout from './composants/Layout.jsx'
import Inscription from './composants/Inscription.jsx'
import Connexion from './composants/Connexion.jsx'
import Boutique from './composants/Boutique.jsx'

function App() {
  return (
    <Routes>
      {/* Layout entoure toutes les pages : en-tête + pied de page */}
      <Route element={<Layout />}>
        {/* Page d'accueil : le formulaire d'inscription */}
        <Route path="/" element={<Inscription />} />
        {/* Page de connexion (lien "Se connecter") */}
        <Route path="/authentification" element={<Connexion />} />
        {/* Page affichée après la connexion */}
        <Route path="/boutique" element={<Boutique />} />
      </Route>
    </Routes>
  )
}

export default App

```

---

## `Frontend/src/index.css`

```css
/* Styles globaux de l'application (couleurs et police de la maquette Canva) */

/* Réinitialisation : marges à zéro, la taille inclut padding et bordure */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 16px;
  line-height: 1.4;
  color: #1f2937;
  background: #f9fafb; /* fond gris très clair de la maquette */
}

```

---

## `Frontend/src/composants/Layout.jsx`

```jsx
// Link : lien sans rechargement ; Outlet : emplacement de la page affichée
import { Link, Outlet } from "react-router";
import styles from "./Layout.module.css";

// Mise en page commune à toutes les pages : en-tête + contenu + pied de page
function Layout() {
  return (
    <div className={styles.layout}>
      <header className={styles.entete}>
        {/* Le logo ramène à l'accueil */}
        <Link to="/" className={styles.logo}>instae-commerce</Link>
        <a href="#" className={styles.panier}>Panier</a>
        {/* Menu ☰ : remplace "Panier" sur mobile (maquette M2) */}
        <button type="button" className={styles.burger} aria-label="Menu">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </header>

      {/* La page de la route actuelle (Inscription, Connexion...) s'affiche ici */}
      <Outlet />

      <footer className={styles.pied}>
        © 2026 instae-commerce
        {/* Masqué sur mobile, comme dans la maquette M2 */}
        <span className={styles.liensPied}> · Mentions légales · Contact</span>
      </footer>
    </div>
  );
}

export default Layout;

```

---

## `Frontend/src/composants/Layout.module.css`

```css
/* Mise en page commune : en-tête / contenu / pied de page (maquette M1) */

/* La page occupe toute la hauteur : l'en-tête en haut, le pied en bas */
.layout {
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
}

/* En-tête blanc avec une fine ligne grise en dessous */
.entete {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 68px;
  padding: 0 28px;
  background: #ffffff;
  border-bottom: 2px solid #e5e7eb;
}

/* Logo texte "instae-commerce" en bleu */
.logo {
  font-size: 22px;
  font-weight: bold;
  color: #1f4e79;
  text-decoration: none;
}

.panier {
  font-size: 16px;
  color: #1f2937;
  text-decoration: none;
}

/* Menu ☰ : caché sur ordinateur, visible sur mobile */
.burger {
  display: none;
  flex-direction: column;
  gap: 6px;
  border: none;
  background: none;
  cursor: pointer;
}

.burger span {
  width: 28px;
  height: 4px;
  background: #1f2937;
}

/* Pied de page gris clair */
.pied {
  padding: 20px;
  background: #f3f4f6;
  font-size: 14px;
  color: #6b7280;
  text-align: center;
}

/* Mobile (maquette M2) : le pied de page n'affiche que le copyright */
@media (max-width: 600px) {
  .entete {
    padding: 0 24px;
  }

  .liensPied,
  .panier {
    display: none;
  }

  .burger {
    display: flex;
  }
}

```

---

## `Frontend/src/composants/Inscription.jsx`

```jsx
// Importe le hook useState pour créer des états dans le composant
import { useState } from "react";
// Importe Link : lien de navigation sans rechargement de la page
import { Link } from "react-router";
// Importe les styles CSS Modules : styles.xxx renvoie un nom de classe unique
import styles from "./Inscription.module.css";

// Déclare le composant Inscription (une fonction qui renvoie du JSX)
function Inscription() {
  // Un seul état objet pour tous les champs du formulaire
  // form = valeurs actuelles, setForm = fonction pour les modifier
  const [form, setForm] = useState({
    nom: "",            // valeur initiale vide
    prenom: "",
    email: "",
    password: "",
    confirmation: "",   // confirmation du mot de passe
    cgu: false,         // case à cocher : booléen
  });

  // État du message d'erreur ("" = pas d'erreur)
  const [erreur, setErreur] = useState("");
  // État du succès : false au départ, true quand l'inscription a réussi
  const [succes, setSucces] = useState(false);

  // Gestionnaire appelé à chaque modification d'un champ
  const handleChange = (e) => {
    // Extrait les propriétés utiles du champ qui a changé (déstructuration)
    const { name, value, type, checked } = e.target;
    // Met à jour l'état avec un nouvel objet (prev = ancien état)
    setForm((prev) => ({
      ...prev,  // recopie tous les champs existants
      // [name] : clé dynamique (nom, email...) ; une checkbox donne "checked", les autres "value"
      [name]: type === "checkbox" ? checked : value,
    }));
    // Affiche le champ modifié dans la console (y compris le mot de passe en clair)
    console.log(e.target.name, e.target.value);
  };

  // Fonction appelée à l'envoi du formulaire ; async pour pouvoir utiliser await
  const handleSubmit = async (e) => {
    // Empêche le rechargement de la page (comportement par défaut d'un formulaire)
    e.preventDefault();

    // try/catch : intercepte les erreurs réseau
    try {
      // Envoie la requête au backend et attend la réponse
      const res = await fetch("/api/inscription", {
        method: "POST",                                    // envoi de données
        headers: { "Content-Type": "application/json" },   // le corps est du JSON
        // Convertit l'objet en texte JSON ; confirmation et cgu ne sont pas envoyés
        body: JSON.stringify({
          nom: form.nom,
          prenom: form.prenom,
          email: form.email,
          password: form.password,
        }),
      });
      // Lit le corps de la réponse et le convertit en objet JavaScript
      const data = await res.json();

      // res.ok vaut false pour tout code HTTP hors 200-299 (400, 409, 500...)
      if (!res.ok) {
        // Affiche le message renvoyé par le serveur
        setErreur(data.message);
        // Masque un éventuel message de succès précédent
        setSucces(false);
        // Arrête la fonction ici
        return;
      }

      // Réponse positive : efface l'erreur et affiche le succès
      setErreur("");
      setSucces(true);
    } catch {
      // Le serveur n'a pas répondu (backend éteint, proxy Vite absent...)
      setErreur("Serveur injoignable. Vérifie que le backend est lancé.");
      setSucces(false);
    }
  };

  // JSX : ce que le composant affiche
  return (
    // Balise sémantique du contenu principal de la page
    <main className={styles.page}>
      {/* onSubmit : appelle handleSubmit à l'envoi ; noValidate désactive la validation du navigateur */}
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <h1>Créer un compte</h1>

        {/* Zone du message global en haut du formulaire (même place que la maquette M2) */}
        {/* Affiche l'erreur seulement si erreur n'est pas vide */}
        {erreur && <p className={styles.erreur}>{erreur}</p>}
        {/* Affiche le message de succès seulement si succes vaut true */}
        {succes && <p className={styles.succes}>Inscription réussie, {form.prenom} !</p>}

        {/* Bloc du champ Nom */}
        <div className={styles.champ}>
          {/* htmlFor relie l'étiquette à l'input d'id "nom" : un clic dessus active le champ */}
          <label htmlFor="nom">Nom</label>
          {/* Champ contrôlé : value vient de l'état, onChange le met à jour ; name sert à handleChange */}
          <input type="text" id="nom" name="nom" value={form.nom} onChange={handleChange} />
        </div>

        {/* Bloc du champ Prénom, même principe */}
        <div className={styles.champ}>
          <label htmlFor="prenom">Prénom</label>
          <input type="text" id="prenom" name="prenom" value={form.prenom} onChange={handleChange} />
        </div>

        {/* Bloc du champ Email */}
        <div className={styles.champ}>
          <label htmlFor="email">Adresse e-mail</label>
          <input
            type="email"                    // clavier adapté sur mobile
            id="email"
            name="email"
            placeholder="exemple@mail.fr"   // texte d'exemple grisé
            value={form.email}
            onChange={handleChange}
          />
        </div>

        {/* Bloc du champ Mot de passe */}
        <div className={styles.champ}>
          <label htmlFor="password">Mot de passe</label>
          {/* type="password" masque les caractères saisis */}
          <input type="password" id="password" name="password" value={form.password} onChange={handleChange} />
        </div>

        {/* Bloc du champ Confirmation */}
        <div className={styles.champ}>
          <label htmlFor="confirmation">Confirmer le mot de passe</label>
          <input
            type="password"
            id="confirmation"
            name="confirmation"
            value={form.confirmation}
            onChange={handleChange}
          />
        </div>

        {/* Combine deux classes CSS : champ et champCase */}
        <div className={`${styles.champ} ${styles.champCase}`}>
          {/* Case à cocher : on utilise "checked" (booléen) au lieu de "value" */}
          <input type="checkbox" id="cgu" name="cgu" checked={form.cgu} onChange={handleChange} />
          <label htmlFor="cgu">J'accepte les conditions d'utilisation</label>
        </div>

        {/* Bouton principal bleu qui déclenche l'envoi du formulaire */}
        <button type="submit" className={styles.boutonPrincipal}>S'inscrire</button>

        {/* Ligne de séparation */}
        <hr className={styles.separateur} />

        <p className={styles.question}>Déjà un compte ?</p>
        {/* Lien vers la connexion, affiché comme un bouton à contour bleu */}
        <Link to="/authentification" className={styles.boutonSecondaire}>Se connecter</Link>
      </form>
    </main>
  );
}

// Exporte le composant pour l'importer dans App.jsx ou le routeur
export default Inscription;
```

---

## `Frontend/src/composants/Connexion.jsx`

```jsx
// Importe le hook useState pour créer des états dans le composant
import { useState } from "react";
// Importe Link : lien de navigation sans rechargement de la page
// useNavigate : changer de page depuis le code (après la connexion)
import { Link, useNavigate } from "react-router";
// Réutilise les styles du formulaire d'inscription (même apparence)
import styles from "./Inscription.module.css";

// Déclare le composant Connexion
function Connexion() {
  // État des deux champs du formulaire
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  // État du message d'erreur ("" = pas d'erreur)
  const [erreur, setErreur] = useState("");
  // Utilisateur connecté renvoyé par le serveur ({ id, prenom }), null au départ
  const [utilisateur, setUtilisateur] = useState(null);
  // Fonction de navigation fournie par React Router
  const navigate = useNavigate();

  // Met à jour le champ modifié (même principe que dans Inscription)
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Fonction appelée à l'envoi du formulaire
  const handleSubmit = async (e) => {
    // Empêche le rechargement de la page
    e.preventDefault();

    try {
      // Envoie l'email et le mot de passe au backend (route POST /api/connexion)
      const res = await fetch("/api/connexion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });
      // Lit la réponse JSON : { id, prenom } ou { message }
      const data = await res.json();

      // Identifiants incorrects (401) ou autre erreur
      if (!res.ok) {
        // Texte de la maquette M2 pour des identifiants incorrects
        setErreur(res.status === 401 ? "Adresse e-mail ou mot de passe incorrect." : data.message);
        setUtilisateur(null);
        return;
      }

      // Connexion réussie : on garde l'utilisateur renvoyé par le serveur
      setErreur("");
      setUtilisateur(data);
      // Garde l'utilisateur dans le navigateur pour la page Boutique
      localStorage.setItem("utilisateur", JSON.stringify(data));
      // Redirige vers la boutique
      navigate("/boutique");
    } catch {
      // Le serveur n'a pas répondu
      setErreur("Serveur injoignable. Vérifie que le backend est lancé.");
      setUtilisateur(null);
    }
  };

  return (
    <main className={styles.page}>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <h1>Se connecter</h1>

        {/* Zone du message d'erreur global, en haut du formulaire (maquette M2) */}
        {erreur && <p className={styles.erreur}>{erreur}</p>}
        {/* Message de bienvenue avec l'identifiant renvoyé par le serveur */}
        {utilisateur && (
          <p className={styles.succes}>
            Bienvenue {utilisateur.prenom} ! (identifiant : {utilisateur.id})
          </p>
        )}

        {/* Champ Adresse e-mail */}
        <div className={styles.champ}>
          <label htmlFor="email">Adresse e-mail</label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="exemple@mail.fr"
            value={form.email}
            onChange={handleChange}
          />
        </div>

        {/* Champ Mot de passe */}
        <div className={styles.champ}>
          <label htmlFor="password">Mot de passe</label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
          />
        </div>

        {/* US-05 : la page "mot de passe oublié" n'existe pas encore */}
        <a href="#" className={styles.oublie}>Mot de passe oublié ?</a>

        <button type="submit" className={styles.boutonPrincipal}>Se connecter</button>

        {/* Ligne de séparation */}
        <hr className={styles.separateur} />

        <p className={styles.question}>Pas encore de compte ?</p>
        {/* Lien vers l'inscription, affiché comme un bouton à contour bleu */}
        <Link to="/" className={styles.boutonSecondaire}>Créer un compte</Link>
      </form>
    </main>
  );
}

// Exporte le composant pour l'utiliser dans App.jsx
export default Connexion;

```

---

## `Frontend/src/composants/Inscription.module.css`

```css
/* Styles des formulaires Connexion et Inscription (CSS Module).
   Couleurs et dimensions reprises de la maquette Canva (M1 / M2).
   La réinitialisation et la police sont dans index.css. */

/* Zone centrale : centre la carte du formulaire */
.page {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 34px 24px;
}

/* Carte blanche, bordure grise, coins arrondis */
.form {
  width: 100%;
  max-width: 400px;
  padding: 30px;
  background: #ffffff;
  border: 2px solid #d1d5db;
  border-radius: 8px;
}

/* Titre "Se connecter" / "Créer un compte" */
.form h1 {
  margin-bottom: 24px;
  font-size: 28px;
  font-weight: bold;
  color: #111827;
}

/* Un champ = un label + un input */
.champ {
  margin-bottom: 18px;
}

.champ label {
  display: block;
  margin-bottom: 6px;
  font-size: 16px;
  color: #374151;
}

.champ input[type="text"],
.champ input[type="email"],
.champ input[type="password"] {
  width: 100%;
  height: 48px;
  padding: 0 14px;
  border: 2px solid #9ca3af;
  border-radius: 6px;
  background: #ffffff;
  font-size: 16px;
  color: #111827;
}

/* Texte d'exemple grisé (exemple@mail.fr, ••••••••) */
.champ input::placeholder {
  color: #9ca3af;
}

/* Champ actif : bordure bleue de la maquette */
.champ input:focus {
  outline: none;
  border-color: #1f4e79;
  box-shadow: 0 0 0 3px rgba(31, 78, 121, 0.2);
}

/* Case à cocher alignée avec son texte (utilisée avec .champ) */
.champCase {
  display: flex;
  align-items: center;
  gap: 8px;
}

.champCase label {
  margin-bottom: 0;
  font-size: 15px;
}

/* Lien "Mot de passe oublié ?" : bleu souligné */
.oublie {
  display: inline-block;
  margin-bottom: 20px;
  font-size: 16px;
  color: #1f4e79;
}

/* Bouton principal : fond bleu, texte blanc en gras */
.boutonPrincipal {
  width: 100%;
  height: 54px;
  border: none;
  border-radius: 6px;
  background: #1f4e79;
  color: #ffffff;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
}

.boutonPrincipal:hover {
  background: #163a5c;
}

/* Ligne grise de séparation */
.separateur {
  margin: 26px 0 18px;
  border: none;
  border-top: 2px solid #d1d5db;
}

/* "Pas encore de compte ?" / "Déjà un compte ?" */
.question {
  margin-bottom: 18px;
  font-size: 16px;
  color: #4b5563;
  text-align: center;
}

/* Bouton secondaire (un lien) : contour bleu, fond blanc */
.boutonSecondaire {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 50px;
  border: 2px solid #1f4e79;
  border-radius: 6px;
  background: #ffffff;
  color: #1f4e79;
  font-size: 18px;
  font-weight: bold;
  text-decoration: none;
}

.boutonSecondaire:hover {
  background: #eef3f8;
}

/* Message d'erreur global : encadré rouge en haut du formulaire (maquette M2) */
.erreur {
  margin-bottom: 20px;
  padding: 12px 16px;
  background: #fdecea;
  border: 2px solid #c0392b;
  border-radius: 6px;
  font-size: 15px;
  color: #c0392b;
  text-align: center;
}

/* Message de succès : même forme, en vert */
.succes {
  margin-bottom: 20px;
  padding: 12px 16px;
  background: #e8f5e9;
  border: 2px solid #2e7d32;
  border-radius: 6px;
  font-size: 15px;
  color: #2e7d32;
  text-align: center;
}

/* Mobile (maquette M2) : une seule colonne, marges de 24 px,
   la carte prend toute la largeur */
@media (max-width: 600px) {
  .page {
    padding: 24px;
    background: #ffffff;
  }

  .form {
    padding: 0;
    border: none;
    background: transparent;
  }
}

```

---

## `Frontend/src/composants/Boutique.jsx`

```jsx
import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router";
import Authentification from "./Authentification.jsx";
import BarreRecherche from "./BarreRecherche.jsx";
import Menu from "./Menu.jsx";
import Produit from "./Produit.jsx";
import Panier from "./Panier.jsx";
import styles from "./Boutique.module.css";

// Lit une valeur JSON gardée dans le navigateur (ou renvoie la valeur par défaut)
function lire(cle, defaut) {
  try {
    return JSON.parse(localStorage.getItem(cle)) ?? defaut;
  } catch {
    return defaut;
  }
}

// Page affichée après la connexion
function Boutique() {
  const navigate = useNavigate();
  // Utilisateur connecté, enregistré par la page Connexion
  const [utilisateur] = useState(() => lire("utilisateur", null));
  // Produits venant du backend
  const [produits, setProduits] = useState([]);
  // Texte de la barre de recherche
  const [recherche, setRecherche] = useState("");
  // Articles du panier (repris du navigateur s'il y en avait)
  const [panier, setPanier] = useState(() => lire("panier", []));

  // Au chargement : récupère les produits (GET /api/produits)
  useEffect(() => {
    fetch("/api/produits")
      .then((res) => res.json())
      .then(setProduits)
      .catch(() => setProduits([]));
  }, []);

  // Pas connecté : retour à la page de connexion
  if (!utilisateur) return <Navigate to="/authentification" />;

  // Ajoute un produit ; s'il est déjà dans le panier, augmente sa quantité
  const ajouter = (produit, quantite) => {
    setPanier((prev) => {
      const existe = prev.find((a) => a.id === produit.id);
      if (existe) {
        return prev.map((a) => (a.id === produit.id ? { ...a, quantite: a.quantite + quantite } : a));
      }
      return [...prev, { ...produit, quantite }];
    });
  };

  // Enlève un article du panier
  const retirer = (id) => setPanier((prev) => prev.filter((a) => a.id !== id));

  // Déconnexion : oublie l'utilisateur et retourne à la connexion
  const deconnexion = () => {
    localStorage.removeItem("utilisateur");
    navigate("/authentification");
  };

  // Produits dont le nom contient le texte recherché (sans tenir compte des majuscules)
  const produitsFiltres = produits.filter((p) =>
    p.nom.toLowerCase().includes(recherche.toLowerCase())
  );

  return (
    <div className={styles.boutique}>
      {/* Barre du haut : menu, recherche, compte */}
      <div className={styles.barre}>
        <Menu />
        <BarreRecherche valeur={recherche} onChange={setRecherche} />
        <Authentification utilisateur={utilisateur} onDeconnexion={deconnexion} />
      </div>

      <div className={styles.contenu}>
        {/* Liste des produits */}
        <section id="produits">
          <h2>Produits</h2>
          {produitsFiltres.length === 0 ? (
            <p className={styles.vide}>Aucun produit trouvé.</p>
          ) : (
            <div className={styles.grille}>
              {produitsFiltres.map((p) => (
                <Produit key={p.id} produit={p} onAjouter={ajouter} />
              ))}
            </div>
          )}
        </section>

        <Panier articles={panier} onRetirer={retirer} />
      </div>
    </div>
  );
}

export default Boutique;

```

---

## `Frontend/src/composants/Boutique.module.css`

```css
/* Page Boutique : mêmes couleurs que la maquette Canva
   (bleu #1f4e79, bordures #d1d5db / #9ca3af, fond #f9fafb) */

.boutique {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px;
}

/* ---------- Barre du haut : menu | recherche | compte ---------- */
.barre {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 28px;
}

/* Menu ☰ */
.menu {
  position: relative;
}

.boutonMenu {
  width: 48px;
  height: 48px;
  border: 2px solid #d1d5db;
  border-radius: 6px;
  background: #ffffff;
  font-size: 22px;
  color: #1f2937;
  cursor: pointer;
}

.menuListe {
  position: absolute;
  top: 56px;
  left: 0;
  z-index: 10;
  min-width: 180px;
  list-style: none;
  background: #ffffff;
  border: 2px solid #d1d5db;
  border-radius: 8px;
  overflow: hidden;
}

.menuListe a {
  display: block;
  padding: 12px 16px;
  color: #1f2937;
  text-decoration: none;
}

.menuListe a:hover {
  background: #eef3f8;
  color: #1f4e79;
}

/* Barre de recherche : prend toute la place disponible */
.recherche {
  position: relative;
  flex: 1;
}

.recherche input {
  width: 100%;
  height: 48px;
  padding: 0 44px 0 16px;
  border: 2px solid #9ca3af;
  border-radius: 6px;
  font-size: 16px;
}

.recherche input:focus {
  outline: none;
  border-color: #1f4e79;
  box-shadow: 0 0 0 3px rgba(31, 78, 121, 0.2);
}

.recherche button {
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  border: none;
  background: none;
  font-size: 16px;
  color: #6b7280;
  cursor: pointer;
}

/* Compte de l'utilisateur */
.compte {
  position: relative;
}

.boutonCompte {
  height: 48px;
  padding: 0 16px;
  border: 2px solid #1f4e79;
  border-radius: 6px;
  background: #ffffff;
  font-size: 16px;
  font-weight: bold;
  color: #1f4e79;
  white-space: nowrap;
  cursor: pointer;
}

.compteMenu {
  position: absolute;
  top: 56px;
  right: 0;
  z-index: 10;
  min-width: 200px;
  padding: 16px;
  background: #ffffff;
  border: 2px solid #d1d5db;
  border-radius: 8px;
}

.compteMenu p {
  margin-bottom: 12px;
  font-size: 14px;
  color: #4b5563;
}

.compteMenu button {
  width: 100%;
  height: 40px;
  border: 2px solid #c0392b;
  border-radius: 6px;
  background: #fdecea;
  font-weight: bold;
  color: #c0392b;
  cursor: pointer;
}

/* ---------- Contenu : produits à gauche, panier à droite ---------- */
.contenu {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 28px;
  align-items: start;
}

.contenu h2 {
  margin-bottom: 16px;
  font-size: 24px;
  color: #111827;
}

.grille {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

/* Carte produit */
.produit {
  padding: 18px;
  background: #ffffff;
  border: 2px solid #d1d5db;
  border-radius: 8px;
}

.image {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 120px;
  margin-bottom: 14px;
  border-radius: 6px;
  background: #eef3f8;
  font-size: 48px;
  font-weight: bold;
  color: #1f4e79;
}

.produit h3 {
  font-size: 18px;
  color: #111827;
}

.prix {
  margin: 4px 0 14px;
  font-size: 18px;
  font-weight: bold;
  color: #1f4e79;
}

.quantite {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.quantite button {
  width: 36px;
  height: 36px;
  border: 2px solid #9ca3af;
  border-radius: 6px;
  background: #ffffff;
  font-size: 18px;
  cursor: pointer;
}

/* Bouton bleu de la maquette */
.boutonPrincipal {
  width: 100%;
  height: 48px;
  border: none;
  border-radius: 6px;
  background: #1f4e79;
  color: #ffffff;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
}

.boutonPrincipal:hover {
  background: #163a5c;
}

.boutonPrincipal:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

/* Panier */
.panier {
  position: sticky;
  top: 24px;
  padding: 20px;
  background: #ffffff;
  border: 2px solid #d1d5db;
  border-radius: 8px;
}

.compteur {
  display: inline-block;
  min-width: 28px;
  padding: 2px 8px;
  border-radius: 14px;
  background: #1f4e79;
  font-size: 15px;
  color: #ffffff;
  text-align: center;
}

.lignes {
  list-style: none;
  margin-bottom: 16px;
}

.lignes li {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #e5e7eb;
}

.lignes button {
  border: none;
  background: none;
  color: #c0392b;
  cursor: pointer;
}

.total {
  margin-bottom: 16px;
  font-size: 18px;
}

.vide {
  margin-bottom: 16px;
  color: #6b7280;
}

/* Mobile : tout sur une colonne, marges de 24 px */
@media (max-width: 800px) {
  .barre {
    flex-wrap: wrap;
  }

  .recherche {
    order: 3;
    flex-basis: 100%;
  }

  .compte {
    margin-left: auto;
  }

  .contenu {
    grid-template-columns: 1fr;
  }

  .panier {
    position: static;
  }
}

```

---

## `Frontend/src/composants/Authentification.jsx`

```jsx
import { useState, useRef, useEffect } from "react";
import styles from "./Boutique.module.css";

// Affiche l'utilisateur connecté et le bouton de déconnexion
// utilisateur = { id, prenom } ; onDeconnexion = fonction de la page Boutique
function Authentification({ utilisateur, onDeconnexion }) {
  // Petit menu du compte ouvert ou fermé
  const [ouvert, setOuvert] = useState(false);
  // Le bouton "Se déconnecter" (pour lui donner le focus)
  const deconnexionRef = useRef(null);

  // Quand le menu du compte s'ouvre : focus sur "Se déconnecter"
  useEffect(() => {
    if (ouvert) deconnexionRef.current.focus();
  }, [ouvert]);

  return (
    <div className={styles.compte}>
      <button type="button" className={styles.boutonCompte} onClick={() => setOuvert(!ouvert)}>
        Bonjour {utilisateur.prenom} ▾
      </button>

      {ouvert && (
        <div className={styles.compteMenu}>
          <p>Identifiant : {utilisateur.id}</p>
          <button type="button" ref={deconnexionRef} onClick={onDeconnexion}>
            Se déconnecter
          </button>
        </div>
      )}
    </div>
  );
}

export default Authentification;

```

---

## `Frontend/src/composants/BarreRecherche.jsx`

```jsx
import { useRef, useEffect } from "react";
import styles from "./Boutique.module.css";

// Champ de recherche ; la valeur est gardée dans la page Boutique
// valeur = texte tapé ; onChange = fonction qui met à jour ce texte
function BarreRecherche({ valeur, onChange }) {
  // L'input (pour y placer le curseur)
  const inputRef = useRef(null);

  // À l'arrivée sur la page : curseur dans la recherche
  useEffect(() => {
    inputRef.current.focus();
  }, []);

  return (
    <div className={styles.recherche}>
      <input
        ref={inputRef}
        type="text"
        placeholder="Rechercher un produit..."
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
      />
      {/* Bouton visible seulement s'il y a du texte : vide le champ */}
      {valeur && (
        <button type="button" onClick={() => { onChange(""); inputRef.current.focus(); }}>
          ✕
        </button>
      )}
    </div>
  );
}

export default BarreRecherche;

```

---

## `Frontend/src/composants/Menu.jsx`

```jsx
import { useState, useRef, useEffect } from "react";
import styles from "./Boutique.module.css";

// Menu ☰ avec les liens vers les sections de la page
function Menu() {
  // Menu ouvert ou fermé
  const [ouvert, setOuvert] = useState(false);
  // Le bloc du menu (pour savoir si on clique dedans ou dehors)
  const menuRef = useRef(null);

  // Ferme le menu quand on clique en dehors
  useEffect(() => {
    const fermer = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOuvert(false);
    };
    document.addEventListener("click", fermer);
    // Nettoyage : retire l'écouteur quand le composant disparaît
    return () => document.removeEventListener("click", fermer);
  }, []);

  return (
    <nav className={styles.menu} ref={menuRef}>
      <button type="button" className={styles.boutonMenu} onClick={() => setOuvert(!ouvert)} aria-label="Menu">
        ☰
      </button>

      {ouvert && (
        <ul className={styles.menuListe} onClick={() => setOuvert(false)}>
          <li><a href="#produits">Produits</a></li>
          <li><a href="#panier">Panier</a></li>
        </ul>
      )}
    </nav>
  );
}

export default Menu;

```

---

## `Frontend/src/composants/Produit.jsx`

```jsx
import { useState, useRef, useEffect } from "react";
import styles from "./Boutique.module.css";

// Carte d'un produit ; produit = { id, nom, prix }
// onAjouter = fonction de la page Boutique qui ajoute au panier
function Produit({ produit, onAjouter }) {
  // Quantité choisie avant l'ajout
  const [quantite, setQuantite] = useState(1);
  // true pendant un court instant après l'ajout ("Ajouté ✓")
  const [ajoute, setAjoute] = useState(false);
  // Le bouton "Ajouter au panier"
  const boutonRef = useRef(null);

  // Après un ajout : remet le texte normal du bouton au bout de 1,5 s
  useEffect(() => {
    if (!ajoute) return;
    const minuteur = setTimeout(() => setAjoute(false), 1500);
    // Nettoyage : annule le minuteur si le composant disparaît
    return () => clearTimeout(minuteur);
  }, [ajoute]);

  return (
    <article className={styles.produit}>
      {/* Pas d'image dans la base : un bloc avec l'initiale du produit */}
      <div className={styles.image}>{produit.nom[0]}</div>
      <h3>{produit.nom}</h3>
      <p className={styles.prix}>{produit.prix} €</p>

      <div className={styles.quantite}>
        <button type="button" onClick={() => setQuantite(Math.max(1, quantite - 1))}>−</button>
        <span>{quantite}</span>
        <button type="button" onClick={() => setQuantite(quantite + 1)}>+</button>
      </div>

      <button
        type="button"
        ref={boutonRef}
        className={styles.boutonPrincipal}
        onClick={() => { onAjouter(produit, quantite); setAjoute(true); setQuantite(1); }}
      >
        {ajoute ? "Ajouté ✓" : "Ajouter au panier"}
      </button>
    </article>
  );
}

export default Produit;

```

---

## `Frontend/src/composants/Panier.jsx`

```jsx
import { useRef, useEffect } from "react";
import styles from "./Boutique.module.css";

// Panier ; articles = [{ id, nom, prix, quantite }]
// onRetirer = fonction de la page Boutique qui enlève un article
function Panier({ articles, onRetirer }) {
  // Le nombre d'articles affiché dans le titre
  const compteurRef = useRef(null);

  // À chaque changement du panier : sauvegarde dans le navigateur
  // et petite animation sur le compteur
  useEffect(() => {
    localStorage.setItem("panier", JSON.stringify(articles));
    compteurRef.current.animate(
      [{ transform: "scale(1.4)" }, { transform: "scale(1)" }],
      { duration: 300 }
    );
  }, [articles]);

  // Total = somme de prix × quantité
  const total = articles.reduce((somme, a) => somme + a.prix * a.quantite, 0);

  return (
    <aside id="panier" className={styles.panier}>
      <h2>
        Mon panier <span ref={compteurRef} className={styles.compteur}>{articles.length}</span>
      </h2>

      {articles.length === 0 ? (
        <p className={styles.vide}>Votre panier est vide.</p>
      ) : (
        <ul className={styles.lignes}>
          {articles.map((a) => (
            <li key={a.id}>
              <span>{a.nom} × {a.quantite}</span>
              <span>{a.prix * a.quantite} €</span>
              <button type="button" onClick={() => onRetirer(a.id)} aria-label={`Retirer ${a.nom}`}>✕</button>
            </li>
          ))}
        </ul>
      )}

      <p className={styles.total}>Total : <strong>{total} €</strong></p>
      <button type="button" className={styles.boutonPrincipal} disabled={articles.length === 0}>
        Commander
      </button>
    </aside>
  );
}

export default Panier;

```

---

## Commandes (dans le dossier React-FB)

Le dossier Frontend doit d'abord exister (créé avec `npm create vite@latest Frontend -- --template react`),
sinon il manque ses fichiers de configuration. Ensuite :

```
npm install
npm install --prefix Backend
npm install --prefix Frontend
npm install react-router --prefix Frontend
npm install -D concurrently
npm run dev
```

Puis ouvrir http://localhost:5173
