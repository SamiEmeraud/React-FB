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