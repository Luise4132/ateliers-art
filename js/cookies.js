/* ============================================================
   cookies.js
   Rôle : bandeau de consentement cookies (RGPD), enregistrement du choix
          en localStorage, et chargement conditionnel de Google Analytics.
   Le bandeau et la fenêtre de gestion sont injectés automatiquement dans
   chaque page : il suffit d'inclure ce script (avec defer).
   Expose : window.ouvrirGestionCookies() — rouvre le panneau de réglage
            (utilisé par le lien "Gérer mes cookies" du footer).
   Dépendances : aucune. Styles dans style.css.
   ============================================================ */

(function () {
  "use strict";

  const CLE_STOCKAGE = "cookieConsent";

  /* ⚠️ TODO : remplacer par le vrai identifiant Google Analytics (format G-XXXXXXX).
     Tant que ce champ vaut "", Analytics ne se charge pas même si l'utilisateur accepte. */
  const GA_ID = "";

  /* ---------- Lecture / écriture du consentement ---------- */
  function lireConsentement() {
    try { return JSON.parse(localStorage.getItem(CLE_STOCKAGE)); }
    catch (e) { return null; }
  }
  function enregistrerConsentement(consent) {
    localStorage.setItem(CLE_STOCKAGE, JSON.stringify(consent));
    appliquerConsentement(consent);
  }

  /* ---------- Application du choix (chargement éventuel d'Analytics) ---------- */
  let analyticsCharge = false;
  function appliquerConsentement(consent) {
    if (consent && consent.stats && GA_ID && !analyticsCharge) {
      chargerAnalytics();
    }
  }
  function chargerAnalytics() {
    analyticsCharge = true;
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag("js", new Date());
    gtag("config", GA_ID, { anonymize_ip: true });
  }

  /* ---------- Markup du panneau de personnalisation (réutilisé) ---------- */
  function panneauOptionsHTML(consent) {
    const stats = consent && consent.stats;
    const marketing = consent && consent.marketing;
    return (
      '<div class="cookie-option">' +
      '<input type="checkbox" checked disabled aria-label="Cookies nécessaires (toujours actifs)">' +
      '<div><strong>Cookies nécessaires</strong><div class="cookie-desc">Indispensables au fonctionnement du site. Toujours actifs.</div></div>' +
      "</div>" +
      '<div class="cookie-option">' +
      '<input type="checkbox" id="opt-stats"' + (stats ? " checked" : "") + '>' +
      '<div><strong>Cookies de statistiques</strong><div class="cookie-desc">Mesure d\'audience anonyme (Google Analytics).</div></div>' +
      "</div>" +
      '<div class="cookie-option">' +
      '<input type="checkbox" id="opt-marketing"' + (marketing ? " checked" : "") + '>' +
      '<div><strong>Cookies marketing</strong><div class="cookie-desc">Personnalisation et contenus promotionnels.</div></div>' +
      "</div>"
    );
  }

  /* ---------- Injection du bandeau ---------- */
  const banniere = document.createElement("div");
  banniere.className = "cookie-banniere";
  banniere.setAttribute("role", "dialog");
  banniere.setAttribute("aria-label", "Gestion des cookies");
  banniere.innerHTML =
    '<div class="cookie-inner">' +
    "<p>Ce site utilise des cookies pour améliorer votre expérience et mesurer son audience. " +
    "Vous pouvez accepter, refuser ou personnaliser vos choix. " +
    '<a href="#" id="cookie-lien-confid">En savoir plus</a></p>' +
    '<div class="cookie-actions">' +
    '<button class="btn btn-clair" id="cookie-personnaliser">Personnaliser</button>' +
    '<button class="btn btn-secondaire" id="cookie-refuser">Tout refuser</button>' +
    '<button class="btn btn-primaire" id="cookie-accepter">Tout accepter</button>' +
    "</div>" +
    '<div class="cookie-perso" id="cookie-perso"></div>' +
    "</div>";
  document.body.appendChild(banniere);

  const persoBanniere = banniere.querySelector("#cookie-perso");

  function afficherBanniere() { banniere.classList.add("visible"); }
  function masquerBanniere() { banniere.classList.remove("visible"); }

  // Boutons du bandeau
  banniere.querySelector("#cookie-accepter").addEventListener("click", function () {
    enregistrerConsentement({ necessaires: true, stats: true, marketing: true });
    masquerBanniere();
  });
  banniere.querySelector("#cookie-refuser").addEventListener("click", function () {
    enregistrerConsentement({ necessaires: true, stats: false, marketing: false });
    masquerBanniere();
  });
  banniere.querySelector("#cookie-personnaliser").addEventListener("click", function () {
    persoBanniere.innerHTML =
      panneauOptionsHTML(lireConsentement()) +
      '<div class="mt-md"><button class="btn btn-primaire" id="cookie-enregistrer">Enregistrer mes choix</button></div>';
    persoBanniere.classList.add("visible");
    persoBanniere.querySelector("#cookie-enregistrer").addEventListener("click", function () {
      enregistrerConsentement({
        necessaires: true,
        stats: persoBanniere.querySelector("#opt-stats").checked,
        marketing: persoBanniere.querySelector("#opt-marketing").checked,
      });
      masquerBanniere();
    });
  });
  banniere.querySelector("#cookie-lien-confid").addEventListener("click", function (e) {
    e.preventDefault();
    if (typeof window.ouvrirModale === "function") window.ouvrirModale("confidentialite");
  });

  /* ---------- Fenêtre "Gérer mes cookies" (accessible à tout moment) ---------- */
  const modaleCookies = document.createElement("div");
  modaleCookies.className = "modale-legale";
  modaleCookies.id = "modale-gestion-cookies";
  modaleCookies.setAttribute("role", "dialog");
  modaleCookies.setAttribute("aria-modal", "true");
  modaleCookies.setAttribute("aria-label", "Gérer mes cookies");
  document.body.appendChild(modaleCookies);

  window.ouvrirGestionCookies = function () {
    const consent = lireConsentement() || { necessaires: true, stats: false, marketing: false };
    modaleCookies.innerHTML =
      '<div class="modale-boite">' +
      '<button class="modale-fermer" aria-label="Fermer">&times;</button>' +
      "<h2>Gérer mes cookies</h2>" +
      "<p>Choisissez les cookies que vous autorisez. Vos préférences sont enregistrées sur votre appareil.</p>" +
      '<div class="cookie-perso visible" style="color:var(--c-texte)">' +
      panneauOptionsHTML(consent).replace(/cookie-desc/g, "cookie-desc-sombre") +
      "</div>" +
      '<div class="mt-md"><button class="btn btn-primaire" id="cookie-modale-enregistrer">Enregistrer mes choix</button></div>' +
      "</div>";
    // Couleur de texte adaptée au fond clair de la modale
    modaleCookies.querySelectorAll(".cookie-desc-sombre").forEach(function (d) {
      d.style.color = "var(--c-texte-secondaire)";
    });
    modaleCookies.classList.add("ouverte");
    document.body.style.overflow = "hidden";

    modaleCookies.querySelector(".modale-fermer").addEventListener("click", fermer);
    modaleCookies.querySelector("#cookie-modale-enregistrer").addEventListener("click", function () {
      enregistrerConsentement({
        necessaires: true,
        stats: modaleCookies.querySelector("#opt-stats").checked,
        marketing: modaleCookies.querySelector("#opt-marketing").checked,
      });
      fermer();
    });
    modaleCookies.addEventListener("click", function (e) { if (e.target === modaleCookies) fermer(); });
    document.addEventListener("keydown", echapFermer);

    function echapFermer(e) { if (e.key === "Escape") fermer(); }
    function fermer() {
      modaleCookies.classList.remove("ouverte");
      document.body.style.overflow = "";
      document.removeEventListener("keydown", echapFermer);
    }
  };

  /* ---------- Initialisation ---------- */
  const dejaChoisi = lireConsentement();
  if (dejaChoisi) {
    appliquerConsentement(dejaChoisi); // applique sans réafficher le bandeau
  } else {
    afficherBanniere(); // premier passage : on demande le consentement
  }
})();
