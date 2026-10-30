// Importe la connexion à la base SQLite depuis db.js
// ("../" remonte d'un dossier : on sort de controllers/ pour atteindre la racine)
// assurerColonneImage : ajoute la colonne "image" si elle manque encore
import { db, assurerColonneImage } from "../db.js";

// Fonction exportée : appelée par la route GET /api/produits
// req = requête reçue (inutilisée ici), res = réponse à renvoyer
export function listerProduits(req, res) {
  // La colonne "image" existe-t-elle ? (false si DB Browser bloque encore la base)
  // Sans elle, on renvoie image = NULL pour que le catalogue marche quand même.
  const colonneImage = assurerColonneImage() ? "image" : "NULL AS image";

  // Récupère les produits dans la base et les stocke dans la variable "produits"
  const produits = db
    // Prépare la requête SQL : sélectionne id, nom, prix et image,
    // triés par nom dans l'ordre alphabétique
    .prepare(`SELECT id, nom, prix, ${colonneImage} FROM produits ORDER BY nom`)
    // .all() exécute la requête et renvoie toutes les lignes
    // sous forme de tableau d'objets : [{ id, nom, prix, image }, ...]
    // (image vaut null si la case est vide dans DB Browser)
    .all();
  // Envoie le tableau au client au format JSON (code HTTP 200 par défaut)
  res.json(produits);
}
