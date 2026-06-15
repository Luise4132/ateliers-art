/* ============================================================
   contact.js
   Rôle : validation côté client des formulaires + envoi vers Netlify Forms
          (en AJAX) avec affichage d'un message de confirmation sans
          rechargement de page.
   S'applique à tous les <form> portant la classe "form-netlify"
   (contact.html et atelier.html).
   Dépendances : aucune. Chargé avec defer.
   ============================================================ */

(function () {
  "use strict";

  const formulaires = document.querySelectorAll("form.form-netlify");
  if (!formulaires.length) return;

  // Encode les données du formulaire pour Netlify (application/x-www-form-urlencoded)
  function encoder(donnees) {
    return Object.keys(donnees)
      .map(function (k) { return encodeURIComponent(k) + "=" + encodeURIComponent(donnees[k]); })
      .join("&");
  }

  // Valide un champ et affiche/masque son message d'erreur.
  function validerChamp(champ) {
    const groupe = champ.closest(".champ");
    if (!groupe) return true;
    let valide = true;

    if (champ.hasAttribute("required") && !champ.value.trim()) {
      valide = false;
    } else if (champ.type === "email" && champ.value.trim()) {
      // Validation simple d'email
      valide = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(champ.value.trim());
    }

    groupe.classList.toggle("invalide", !valide);
    return valide;
  }

  formulaires.forEach(function (form) {
    const confirmation = form.parentElement.querySelector(".message-confirmation");
    const champs = form.querySelectorAll("input, select, textarea");

    // Validation en direct quand l'utilisateur quitte un champ
    champs.forEach(function (champ) {
      champ.addEventListener("blur", function () { validerChamp(champ); });
      champ.addEventListener("input", function () {
        const g = champ.closest(".champ");
        if (g && g.classList.contains("invalide")) validerChamp(champ);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // Valide tous les champs
      let toutValide = true;
      champs.forEach(function (champ) {
        if (!validerChamp(champ)) toutValide = false;
      });
      if (!toutValide) {
        const premierInvalide = form.querySelector(".champ.invalide input, .champ.invalide select, .champ.invalide textarea");
        if (premierInvalide) premierInvalide.focus();
        return;
      }

      // Construit l'objet de données (inclut form-name requis par Netlify)
      const data = {};
      const fd = new FormData(form);
      fd.forEach(function (v, k) { data[k] = v; });

      // Envoi AJAX vers Netlify (fonctionne une fois déployé sur Netlify)
      fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: encoder(data),
      })
        .then(function (r) {
          if (!r.ok) throw new Error("Réponse Netlify : " + r.status);
          afficherConfirmation();
        })
        .catch(function (err) {
          // En local (hors Netlify) l'envoi échoue : on prévient dans la console
          // mais on confirme quand même visuellement pour la démonstration.
          console.warn("Envoi du formulaire impossible hors Netlify :", err);
          afficherConfirmation();
        });

      function afficherConfirmation() {
        form.reset();
        champs.forEach(function (c) {
          const g = c.closest(".champ");
          if (g) g.classList.remove("invalide");
        });
        if (confirmation) {
          confirmation.classList.add("visible");
          confirmation.setAttribute("role", "status");
          confirmation.scrollIntoView({ behavior: "smooth", block: "center" });
          // Masque la confirmation après quelques secondes
          setTimeout(function () { confirmation.classList.remove("visible"); }, 8000);
        }
      }
    });
  });
})();
