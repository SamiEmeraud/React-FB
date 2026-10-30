// Importe Router depuis Express pour créer un mini-routeur
import { Router } from "express";
// Importe la fonction de traitement du contrôleur des produits
import { listerProduits } from "../controllers/produits.controller.js";

// Crée le routeur des produits
const router = Router();

// GET / -> listerProduits
// Ce routeur est monté sous "/api/produits" dans server.js,
// donc cette route correspond en réalité à GET /api/produits.
// GET = on LIT des données (pas besoin d'envoyer un corps, contrairement à POST)
router.get("/", listerProduits);

// Exporte le routeur pour server.js
export default router;
