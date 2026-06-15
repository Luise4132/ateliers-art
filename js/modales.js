/* ============================================================
   modales.js
   Rôle : modales légales accessibles depuis le footer (mentions légales,
          politique de confidentialité). La gestion des cookies est
          déléguée à cookies.js (window.ouvrirGestionCookies).
   Le contenu est injecté ici pour être disponible sur TOUTES les pages
   sans dupliquer le texte dans chaque fichier HTML.
   Expose : window.ouvrirModale(id) avec id ∈ {mentions-legales, confidentialite, cookies}
   Dépendances : cookies.js (pour 'cookies'). Styles dans style.css.
   ============================================================ */

(function () {
  "use strict";

  /* ----- Contenus légaux -----
     ⚠️ Remplacer tous les [TODO] par les vraies informations de l'artiste. */

  const CONTENUS = {
    "mentions-legales": {
      titre: "Mentions légales",
      html:
        "<h3>Éditeur du site</h3>" +
        "<p><!-- TODO: Nom complet de l'artiste -->Pascal Abramovici<br>" +
        "<!-- TODO: Adresse de l'atelier -->45 Rue de la Poste, 36000 Châteauroux<br>" +
        "<!-- TODO: Téléphone -->06 77 69 73 63<br>" +
        "</p>" +
        "<h3>Hébergeur</h3>" +
        "<p>Netlify, Inc.<br>512 2nd Street, Suite 200<br>San Francisco, CA 94107, USA<br>" +
        '<a href="https://www.netlify.com" target="_blank" rel="noopener">https://www.netlify.com</a></p>' +
        "<h3>Propriété intellectuelle</h3>" +
        "<p>L'ensemble des œuvres présentées sur ce site est la propriété exclusive de " +
        "<!-- TODO: Nom artiste -->Pascal Abramovici. Toute reproduction, même partielle, est interdite " +
        "sans autorisation écrite préalable.</p>" +
        "<h3>Crédits photos</h3>" +
        "<p>Toutes les photographies des œuvres sont réalisées par " +
        "<!-- TODO: Nom artiste / photographe -->Pascal Abramovici.</p>" +
        "<h3>Création du site</h3>" +
        "<p><!-- TODO: Ton nom / studio si tu veux apparaître -->Site réalisé sur mesure.</p>",
    },
    "confidentialite": {
      titre: "Politique de confidentialité",
      html:
        "<h3>Données collectées</h3>" +
        "<p>Ce site collecte les données suivantes via ses formulaires :</p>" +
        "<p>– Nom et prénom<br>– Adresse email<br>– Numéro de téléphone (formulaire atelier uniquement)<br>– Message</p>" +
        "<p>Ces données sont collectées uniquement pour répondre à vos demandes ou gérer vos inscriptions aux ateliers.</p>" +
        "<h3>Responsable du traitement</h3>" +
        "<p><!-- TODO: Nom artiste -->Pascal Abramovici</p>" +
        "<h3>Durée de conservation</h3>" +
        "<p>Vos données sont conservées 3 ans à compter de votre dernier contact.</p>" +
        "<h3>Vos droits</h3>" +
        "<p>Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données. " +
        "Pour exercer ces droits, contactez-nous par courrier ou via le formulaire de contact.</p>" +
        "<h3>Cookies</h3>" +
        "<p>Ce site utilise des cookies. Consultez notre politique de gestion des cookies via le lien « Gérer mes cookies » en bas de page.</p>" +
        "<h3>Hébergement des données</h3>" +
        "<p>Les formulaires sont traités par Netlify (San Francisco, CA, USA) — " +
        '<a href="https://www.netlify.com/privacy/" target="_blank" rel="noopener">Privacy Policy</a>.</p>',
    },
  };

  /* ----- Création d'une modale réutilisable ----- */
  const modale = document.createElement("div");
  modale.className = "modale-legale";
  modale.id = "modale-legale";
  modale.setAttribute("role", "dialog");
  modale.setAttribute("aria-modal", "true");
  document.body.appendChild(modale);

  let dernierFocus = null;

  function fermer() {
    modale.classList.remove("ouverte");
    document.body.style.overflow = "";
    document.removeEventListener("keydown", surClavier);
    if (dernierFocus) dernierFocus.focus();
  }

  function surClavier(e) {
    if (e.key === "Escape") fermer();
    else if (e.key === "Tab") piegerFocus(e);
  }

  function piegerFocus(e) {
    const focusables = modale.querySelectorAll('a[href], button:not([disabled])');
    if (!focusables.length) return;
    const premier = focusables[0];
    const dernier = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === premier) { e.preventDefault(); dernier.focus(); }
    else if (!e.shiftKey && document.activeElement === dernier) { e.preventDefault(); premier.focus(); }
  }

  /* ----- Fonction globale d'ouverture ----- */
  window.ouvrirModale = function (id) {
    // Les cookies sont gérés par cookies.js
    if (id === "cookies") {
      if (typeof window.ouvrirGestionCookies === "function") window.ouvrirGestionCookies();
      return;
    }
    const contenu = CONTENUS[id];
    if (!contenu) return;

    dernierFocus = document.activeElement;
    modale.setAttribute("aria-label", contenu.titre);
    modale.innerHTML =
      '<div class="modale-boite">' +
      '<button class="modale-fermer" aria-label="Fermer">&times;</button>' +
      "<h2>" + contenu.titre + "</h2>" +
      contenu.html +
      "</div>";
    modale.classList.add("ouverte");
    document.body.style.overflow = "hidden";

    modale.querySelector(".modale-fermer").addEventListener("click", fermer);
    modale.addEventListener("click", function (e) { if (e.target === modale) fermer(); });
    document.addEventListener("keydown", surClavier);
    modale.querySelector(".modale-fermer").focus();
  };
})();
