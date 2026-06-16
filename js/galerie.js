/* ============================================================
   galerie.js
   Rôle : contenu dynamique du site à partir des fichiers JSON.
          - Galerie complète (galerie.html) : grille, filtres, lightbox.
          - Toiles "à la une" et "en cours" (index.html).
          - "En cours de création" + calendrier ateliers (atelier.html).
          - Prochain atelier (index.html) + remplissage du menu déroulant
            d'inscription (atelier.html).
   Chaque bloc s'exécute uniquement si les éléments correspondants existent
   dans la page (chargement défensif), afin que ce fichier puisse être
   inclus sur plusieurs pages sans erreur.
   Dépendances : data/toiles.json, data/ateliers.json. Chargé avec defer.
   ============================================================ */

(function () {
  "use strict";

  /* ============================================================
     ⚠️ TODO IMPORTANT : remplacer par le vrai numéro WhatsApp de l'artiste.
     Format international SANS "+" ni espaces. Ex. France : 33612345678
     ============================================================ */
  const NUMERO_WHATSAPP = "33631744897";

  /* ---------- Helpers ---------- */

  // Construit le lien WhatsApp pré-rempli pour une toile donnée.
  function construireLienWhatsApp(toile) {
    const message =
      'Bonjour, je suis intéressé(e) par l\'oeuvre "' +
      toile.titre +
      '" (' + toile.technique + ", " + toile.dimensions + ") au prix de " +
      toile.prix + " €. Pouvez-vous me donner plus d'informations ?";
    return "https://wa.me/" + NUMERO_WHATSAPP + "?text=" + encodeURIComponent(message);
  }

  // Icône WhatsApp en SVG inline (aucune librairie d'icônes).
  const SVG_WHATSAPP =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413z"/>' +
    "</svg>";

  // Renvoie le bloc d'achat : bouton WhatsApp si dispo, sinon badge "Vendue".
  function blocAchat(toile) {
    if (toile.disponible) {
      return (
        '<a class="btn btn-whatsapp" href="' + construireLienWhatsApp(toile) +
        '" target="_blank" rel="noopener" aria-label="Acheter ' + toile.titre + ' via WhatsApp">' +
        SVG_WHATSAPP + "Acheter via WhatsApp</a>"
      );
    }
    return '<span class="badge-vendue">Vendue</span>';
  }

  // Échappe le texte injecté en HTML (sécurité minimale).
  function echapper(txt) {
    const d = document.createElement("div");
    d.textContent = txt == null ? "" : String(txt);
    return d.innerHTML;
  }

  // Formate un prix (0 ou absent = mention spéciale).
  function formatPrix(toile) {
    if (!toile.disponible && (!toile.prix || toile.prix === 0)) return "Non disponible";
    if (!toile.prix || toile.prix === 0) return "Sur demande";
    return toile.prix + " €";
  }

  /* ---------- Chargement des données ---------- */
  let TOILES = [];

  fetch("data/toiles.json")
    .then(function (r) { if (!r.ok) throw new Error("toiles.json introuvable"); return r.json(); })
    .then(function (data) {
      TOILES = (data && data.toiles) || [];
      initGalerieComplete();
      initFeatured();
      initEnCours();
    })
    .catch(function (e) { console.error("Erreur chargement toiles :", e); });

  fetch("data/ateliers.json")
    .then(function (r) { if (!r.ok) throw new Error("ateliers.json introuvable"); return r.json(); })
    .then(function (data) {
      const ateliers = (data && data.ateliers) || [];
      initProchainAtelier(ateliers);
      initCalendrierAteliers(ateliers);
      initSelectAteliers(ateliers);
    })
    .catch(function (e) { console.error("Erreur chargement ateliers :", e); });

  /* ============================================================
     1) GALERIE COMPLÈTE (galerie.html)
     ============================================================ */
  function initGalerieComplete() {
    const grille = document.getElementById("grille-toiles");
    if (!grille) return;

    const filtresTechnique = document.getElementById("filtres-technique");
    const filtresDispo = document.getElementById("filtres-dispo");

    let filtreTechnique = "Toutes";
    let filtreDispo = "Toutes";
    let toilesAffichees = []; // pour la navigation dans la lightbox

    // Génère dynamiquement les boutons de filtre par technique (catégorie).
    if (filtresTechnique) {
      const categories = ["Toutes"].concat(
        Array.from(new Set(TOILES.map(function (t) { return t.categorie; }))).sort()
      );
      filtresTechnique.innerHTML = categories
        .map(function (c, i) {
          return '<button type="button" class="btn-filtre' + (i === 0 ? " actif" : "") +
            '" data-valeur="' + echapper(c) + '">' + echapper(c) + "</button>";
        })
        .join("");
      filtresTechnique.addEventListener("click", function (e) {
        const b = e.target.closest(".btn-filtre");
        if (!b) return;
        filtreTechnique = b.dataset.valeur;
        majActif(filtresTechnique, b);
        rendre();
      });
    }

    if (filtresDispo) {
      filtresDispo.addEventListener("click", function (e) {
        const b = e.target.closest(".btn-filtre");
        if (!b) return;
        filtreDispo = b.dataset.valeur;
        majActif(filtresDispo, b);
        rendre();
      });
    }

    function majActif(groupe, bouton) {
      bouton.parentElement.querySelectorAll(".btn-filtre").forEach(function (x) {
        x.classList.remove("actif");
      });
      bouton.classList.add("actif");
    }

    function rendre() {
      toilesAffichees = TOILES.filter(function (t) {
        const okTech = filtreTechnique === "Toutes" || t.categorie === filtreTechnique;
        const okDispo =
          filtreDispo === "Toutes" ||
          (filtreDispo === "Disponibles" && t.disponible) ||
          (filtreDispo === "Vendues" && !t.disponible);
        return okTech && okDispo;
      });

      if (!toilesAffichees.length) {
        grille.innerHTML = '<p class="aucun-resultat">Aucune œuvre ne correspond à ces filtres.</p>';
        return;
      }

      grille.innerHTML = toilesAffichees
        .map(function (t, index) {
          return (
            '<article class="carte-galerie apparition" tabindex="0" role="button" ' +
            'aria-label="Voir le détail de ' + echapper(t.titre) + '" data-index="' + index + '">' +
            '<div class="carte-image"><img src="' + echapper(t.image) + '" alt="' +
            echapper(t.titre + " — " + t.technique) + '" loading="lazy"></div>' +
            '<div class="carte-corps">' +
            "<h3>" + echapper(t.titre) + "</h3>" +
            '<p class="carte-meta">' + echapper(t.technique) + " · " + echapper(t.dimensions) + "</p>" +
            '<div class="carte-bas"><span class="carte-prix">' + echapper(formatPrix(t)) + "</span></div>" +
            '<div class="carte-achat">' + blocAchat(t) + "</div>" +
            "</div></article>"
          );
        })
        .join("");

      // Animation d'apparition (réutilise le mécanisme de main.js)
      observerCartes(grille);

      // Ouverture de la lightbox au clic / clavier
      grille.querySelectorAll(".carte-galerie").forEach(function (carte) {
        carte.addEventListener("click", function () { ouvrirLightbox(+carte.dataset.index); });
        carte.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); ouvrirLightbox(+carte.dataset.index); }
        });
        // Le clic sur le bouton "Acheter" ne doit pas ouvrir la fenêtre de détail
        var lienAchat = carte.querySelector(".carte-achat a");
        if (lienAchat) lienAchat.addEventListener("click", function (e) { e.stopPropagation(); });
      });
    }

    /* ----- Lightbox ----- */
    const lightbox = document.getElementById("lightbox");
    let indexCourant = 0;
    let dernierFocus = null;

    function ouvrirLightbox(i) {
      if (!lightbox) return;
      indexCourant = i;
      dernierFocus = document.activeElement;
      majLightbox();
      lightbox.classList.add("ouverte");
      document.body.style.overflow = "hidden"; // bloque le scroll de fond
      const fermer = lightbox.querySelector(".lightbox-fermer");
      if (fermer) fermer.focus();
    }

    function fermerLightbox() {
      lightbox.classList.remove("ouverte");
      document.body.style.overflow = ""; // restaure le scroll
      if (dernierFocus) dernierFocus.focus();
    }

    function naviguer(pas) {
      indexCourant = (indexCourant + pas + toilesAffichees.length) % toilesAffichees.length;
      majLightbox();
    }

    function majLightbox() {
      const t = toilesAffichees[indexCourant];
      if (!t) return;
      lightbox.querySelector(".lightbox-image img").src = t.image;
      lightbox.querySelector(".lightbox-image img").alt = t.titre + " — " + t.technique;
      lightbox.querySelector(".lb-titre").textContent = t.titre;
      lightbox.querySelector(".lb-meta").textContent =
        t.technique + " · " + t.dimensions + (t.annee ? " · " + t.annee : "");
      lightbox.querySelector(".lb-prix").textContent = formatPrix(t);
      lightbox.querySelector(".lb-description").textContent = t.description || "";
      const badge = lightbox.querySelector(".lb-badge");
      badge.textContent = t.disponible ? "Disponible" : "Vendue";
      badge.className = "lb-badge " + (t.disponible ? "dispo" : "vendue");
      lightbox.querySelector(".lb-actions").innerHTML = blocAchat(t);
    }

    if (lightbox) {
      lightbox.querySelector(".lightbox-fermer").addEventListener("click", fermerLightbox);
      lightbox.querySelector(".lightbox-prev").addEventListener("click", function () { naviguer(-1); });
      lightbox.querySelector(".lightbox-next").addEventListener("click", function () { naviguer(1); });
      // Clic sur l'overlay (hors de la boîte) ferme la modale
      lightbox.addEventListener("click", function (e) {
        if (e.target === lightbox) fermerLightbox();
      });
      // Clavier : Echap ferme, flèches naviguent, Tab piégé dans la modale
      document.addEventListener("keydown", function (e) {
        if (!lightbox.classList.contains("ouverte")) return;
        if (e.key === "Escape") fermerLightbox();
        else if (e.key === "ArrowLeft") naviguer(-1);
        else if (e.key === "ArrowRight") naviguer(1);
        else if (e.key === "Tab") piegerFocus(e, lightbox);
      });
    }

    rendre();
  }

  /* ============================================================
     2) TOILES "À LA UNE" (index.html)
     ============================================================ */
  function initFeatured() {
    const cible = document.getElementById("featured-grille");
    if (!cible) return;
    const featured = TOILES.filter(function (t) { return t.featured; }).slice(0, 3);
    cible.innerHTML = featured
      .map(function (t) {
        return (
          '<article class="carte-toile apparition">' +
          '<div class="carte-image"><img src="' + echapper(t.image) + '" alt="' +
          echapper(t.titre + " — " + t.technique) + '" loading="lazy"></div>' +
          '<div class="carte-corps">' +
          "<h3>" + echapper(t.titre) + "</h3>" +
          '<p class="carte-meta">' + echapper(t.technique) + " · " + echapper(t.dimensions) + "</p>" +
          '<p class="carte-prix">' + echapper(formatPrix(t)) + "</p>" +
          '<div class="carte-actions">' + blocAchat(t) + "</div>" +
          "</div></article>"
        );
      })
      .join("");
    observerCartes(cible);
  }

  /* ============================================================
     3) "EN COURS DE CRÉATION" (index.html + atelier.html)
     ============================================================ */
  function initEnCours() {
    const bloc = document.getElementById("en-cours-bloc");
    if (!bloc) return;
    const toile = TOILES.find(function (t) { return t.en_cours; });
    if (!toile) {
      // Aucune œuvre en cours : on masque proprement la section.
      bloc.style.display = "none";
      return;
    }
    const img = bloc.querySelector(".en-cours-image img");
    const titre = bloc.querySelector(".en-cours-titre");
    const desc = bloc.querySelector(".en-cours-desc");
    if (img) { img.src = toile.image; img.alt = "Œuvre en cours : " + toile.titre; }
    if (titre) titre.textContent = toile.titre;
    if (desc) desc.textContent = toile.description || "";
  }

  /* ============================================================
     4) PROCHAIN ATELIER (index.html)
     ============================================================ */
  function initProchainAtelier(ateliers) {
    const cible = document.getElementById("prochain-atelier");
    if (!cible) return;
    const futurs = trierAteliersFuturs(ateliers);
    if (!futurs.length) {
      cible.innerHTML = '<p class="intro-texte">De nouvelles dates d\'ateliers seront bientôt annoncées.</p>';
      return;
    }
    cible.innerHTML = carteAtelierHTML(futurs[0], true);
  }

  /* ============================================================
     5) CALENDRIER COMPLET DES ATELIERS (atelier.html)
     ============================================================ */
  function initCalendrierAteliers(ateliers) {
    const cible = document.getElementById("calendrier-ateliers");
    if (!cible) return;
    const futurs = trierAteliersFuturs(ateliers);
    if (!futurs.length) {
      cible.innerHTML = '<p class="intro-texte">De nouvelles dates seront bientôt proposées. Revenez prochainement !</p>';
      return;
    }
    cible.innerHTML = futurs.map(function (a) { return carteAtelierHTML(a, false); }).join("");
  }

  /* ============================================================
     6) MENU DÉROULANT DES DATES (formulaire inscription atelier)
     ============================================================ */
  function initSelectAteliers(ateliers) {
    const select = document.getElementById("select-atelier-date");
    if (!select) return;
    const futurs = trierAteliersFuturs(ateliers);
    futurs.forEach(function (a) {
      const opt = document.createElement("option");
      const libelle = formaterDate(a.date) + " · " + a.theme;
      opt.value = libelle;
      opt.textContent = libelle;
      select.appendChild(opt);
    });
  }

  /* ---------- Helpers ateliers ---------- */
  function trierAteliersFuturs(ateliers) {
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);
    return ateliers
      .filter(function (a) { return new Date(a.date) >= aujourdhui; })
      .sort(function (x, y) { return new Date(x.date) - new Date(y.date); });
  }

  function formaterDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }

  function carteAtelierHTML(a, miseEnAvant) {
    const complet = a.places_restantes <= 0;
    const placesTxt = complet
      ? '<span class="places-restantes complet">Complet</span>'
      : '<span class="places-restantes">' + a.places_restantes + " place" + (a.places_restantes > 1 ? "s" : "") + " restante" + (a.places_restantes > 1 ? "s" : "") + "</span>";
    const bouton = complet
      ? ""
      : '<a class="btn btn-primaire" href="atelier.html#inscription">S\'inscrire</a>';
    return (
      '<div class="carte-atelier apparition">' +
      '<p class="atelier-date">' + echapper(formaterDate(a.date)) + "</p>" +
      "<h3>" + echapper(a.theme) + "</h3>" +
      '<div class="atelier-infos">' +
      "<span>🕒 " + echapper(a.heure) + " (" + echapper(a.duree) + ")</span>" +
      "<span>🎨 " + echapper(a.niveau) + "</span>" +
      "<span>💶 " + echapper(a.prix) + " €</span>" +
      "</div>" +
      "<p>" + placesTxt + "</p>" +
      (miseEnAvant || bouton ? '<div class="mt-md">' + bouton + "</div>" : "") +
      "</div>"
    );
  }

  /* ---------- Utilitaires partagés ---------- */
  function observerCartes(conteneur) {
    const cartes = conteneur.querySelectorAll(".apparition");
    if ("IntersectionObserver" in window) {
      const obs = new IntersectionObserver(function (entrees) {
        entrees.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add("visible"); obs.unobserve(e.target); }
        });
      }, { threshold: 0.1 });
      cartes.forEach(function (c) { obs.observe(c); });
    } else {
      cartes.forEach(function (c) { c.classList.add("visible"); });
    }
  }

  // Piège le focus à l'intérieur d'un conteneur (accessibilité modale).
  function piegerFocus(e, conteneur) {
    const focusables = conteneur.querySelectorAll(
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables.length) return;
    const premier = focusables[0];
    const dernier = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === premier) { e.preventDefault(); dernier.focus(); }
    else if (!e.shiftKey && document.activeElement === dernier) { e.preventDefault(); premier.focus(); }
  }
})();
