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
 
// Colonne "image" : le CHEMIN ou l'ADRESSE d'une image (texte), pas l'image elle-même.
// Ex. : "/images/clavier.jpg" (fichier dans Frontend/public/images/)
//    ou "https://exemple.com/clavier.jpg" (image sur internet)
// ALTER TABLE ajoute la colonne aux bases déjà créées ; on vérifie d'abord
// qu'elle n'existe pas (pragma table_info = liste des colonnes de la table).
// Renvoie true si la colonne existe (ou vient d'être ajoutée), false sinon.
// Appelée au démarrage ET à chaque GET /api/produits : si DB Browser bloquait
// la base au démarrage, la colonne est ajoutée dès que la base est libérée.
let dernierEssai = 0; // heure (en ms) du dernier essai raté
export function assurerColonneImage() {
  const colonnes = db.pragma("table_info(produits)").map((c) => c.name);
  if (colonnes.includes("image")) return true;

  // Pas plus d'un essai toutes les 10 secondes
  if (Date.now() - dernierEssai < 10000) return false;
  dernierEssai = Date.now();

  // busy_timeout = 0 : si la base est verrouillée, on abandonne TOUT DE SUITE.
  // Sinon SQLite attend 5 s, et pendant ce temps tout le serveur est bloqué
  // (le catalogue restait sur "Chargement..." à l'infini).
  db.pragma("busy_timeout = 0");
  try {
    db.exec("ALTER TABLE produits ADD COLUMN image TEXT");
    console.log("Colonne « image » ajoutée à la table produits");
    return true;
  } catch (err) {
    // Base verrouillée : DB Browser a des modifications non enregistrées
    // ("Enregistrer les modifications" ou "Annuler les modifications" pour la libérer)
    console.error("Colonne image pas encore ajoutée (base verrouillée par DB Browser ?) :", err.message);
    return false;
  } finally {
    // On remet l'attente normale (5 s) pour les autres requêtes (inscription...)
    db.pragma("busy_timeout = 5000");
  }
}
assurerColonneImage();

// Données de départ si la table est vide
const { total } = db.prepare("SELECT COUNT(*) AS total FROM produits").get();
if (total === 0) {
  const ajouter = db.prepare("INSERT INTO produits (nom, prix) VALUES (?, ?)");
  ajouter.run("Clavier", 49);
  ajouter.run("Souris", 25);
}