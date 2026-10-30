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