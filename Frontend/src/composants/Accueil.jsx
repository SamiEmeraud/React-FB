import { useContext } from "react";
import { Link, Navigate } from "react-router";
import { UserContext } from "../Contexte/UserContext.jsx";
import styles from "./Accueil.module.css";

// Page d'accueil affichée juste après la connexion
function Accueil() {
  // ===== useContext =====
  // Utilisateur connecté ({ id, prenom } ou null), fourni par UserProvider
  const { utilisateur } = useContext(UserContext);

  // Pas connecté : retour à la page de connexion
  // <Navigate> redirige dès qu'il est affiché : c'est une protection de la page
  if (!utilisateur) return <Navigate to="/authentification" />;

  return (
    <main className={styles.page}>
      <section className={styles.carte}>
        <h1 className={styles.titre}>Bienvenue, {utilisateur.prenom} !</h1>
        <p className={styles.texte}>Vous êtes connecté à votre espace client instae-commerce.</p>

        {/* Lien vers les produits et le panier */}
        <Link to="/boutique" className={styles.bouton}>Voir les produits</Link>
      </section>
    </main>
  );
}

export default Accueil;
