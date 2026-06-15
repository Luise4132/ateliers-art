/* ============================================================
   admin.js
   Rôle : interface d'administration — connexion par mot de passe,
          ajout / modification / suppression des toiles et des ateliers,
          export des fichiers JSON mis à jour.
   ⚠️ Cette protection par mot de passe en JavaScript est LÉGÈRE : elle évite
      l'accès accidentel mais n'est pas une vraie sécurité (le code est visible
      côté client). La page /admin est aussi exclue des moteurs via robots.txt.
   Dépendances : data/toiles.json, data/ateliers.json. Chargé avec defer.
   ============================================================ */

(function () {
  "use strict";

  /* ============================================================
     ⚠️ TODO : changez ce mot de passe d'administration.
     Pour le modifier, remplacez simplement la valeur ci-dessous.
     ============================================================ */
  const MOT_DE_PASSE = "atelier2025";

  /* ---------- Connexion ---------- */
  const formLogin = document.getElementById("form-login");
  const champMdp = document.getElementById("champ-mdp");
  const erreurLogin = document.getElementById("erreur-login");
  const blocLogin = document.getElementById("admin-login");
  const panneau = document.getElementById("admin-panneau");

  formLogin.addEventListener("submit", function (e) {
    e.preventDefault();
    if (champMdp.value === MOT_DE_PASSE) {
      blocLogin.style.display = "none";
      panneau.classList.add("visible");
      chargerDonnees();
    } else {
      erreurLogin.textContent = "Mot de passe incorrect.";
      champMdp.value = "";
      champMdp.focus();
    }
  });

  /* ---------- Onglets ---------- */
  document.querySelectorAll(".admin-onglet").forEach(function (onglet) {
    onglet.addEventListener("click", function () {
      document.querySelectorAll(".admin-onglet").forEach(function (o) { o.classList.remove("actif"); });
      document.querySelectorAll(".admin-section").forEach(function (s) { s.classList.remove("actif"); });
      onglet.classList.add("actif");
      document.getElementById(onglet.dataset.cible).classList.add("actif");
    });
  });

  /* ---------- Données en mémoire ---------- */
  let toiles = [];
  let ateliers = [];
  let indexEditionToile = -1; // -1 = mode ajout, sinon index en cours de modification

  function chargerDonnees() {
    fetch("data/toiles.json")
      .then(function (r) { return r.json(); })
      .then(function (d) { toiles = (d && d.toiles) || []; rendreToiles(); })
      .catch(function (e) { console.error(e); });
    fetch("data/ateliers.json")
      .then(function (r) { return r.json(); })
      .then(function (d) { ateliers = (d && d.ateliers) || []; rendreAteliers(); })
      .catch(function (e) { console.error(e); });
  }

  /* ============================================================
     SECTION TOILES
     ============================================================ */
  const formToile = document.getElementById("form-toile");

  function lireFormulaireToile() {
    return {
      id: document.getElementById("t-id").value || genererId("0", toiles),
      titre: val("t-titre"),
      technique: val("t-technique"),
      dimensions: val("t-dimensions"),
      annee: parseInt(val("t-annee"), 10) || new Date().getFullYear(),
      prix: parseInt(val("t-prix"), 10) || 0,
      disponible: document.getElementById("t-disponible").checked,
      featured: document.getElementById("t-featured").checked,
      en_cours: document.getElementById("t-encours").checked,
      categorie: val("t-categorie"),
      description: val("t-description"),
      image: val("t-image"),
    };
  }

  formToile.addEventListener("submit", function (e) {
    e.preventDefault();
    const toile = lireFormulaireToile();
    if (indexEditionToile >= 0) {
      toiles[indexEditionToile] = toile; // modification
      indexEditionToile = -1;
      document.getElementById("btn-toile").textContent = "Ajouter la toile";
    } else {
      toiles.push(toile); // ajout
    }
    formToile.reset();
    document.getElementById("t-id").value = "";
    rendreToiles();
  });

  document.getElementById("btn-annuler-edition").addEventListener("click", function () {
    indexEditionToile = -1;
    formToile.reset();
    document.getElementById("t-id").value = "";
    document.getElementById("btn-toile").textContent = "Ajouter la toile";
  });

  function rendreToiles() {
    const liste = document.getElementById("liste-toiles");
    document.getElementById("compteur-toiles").textContent = toiles.length;
    liste.innerHTML = toiles
      .map(function (t, i) {
        return (
          '<div class="admin-item">' +
          '<img src="' + t.image + '" alt="" onerror="this.style.visibility=\'hidden\'">' +
          '<div class="item-infos">' +
          '<div class="item-titre">' + echapper(t.titre) +
          (t.featured ? " ⭐" : "") + (t.en_cours ? " 🎨" : "") + "</div>" +
          '<div class="item-meta">' + echapper(t.technique) + " · " + echapper(t.dimensions) +
          " · " + (t.prix ? t.prix + " €" : "—") +
          " · " + (t.disponible ? "Disponible" : "Vendue") + "</div>" +
          "</div>" +
          '<div class="item-actions">' +
          '<button class="btn-petit" data-edit="' + i + '">Modifier</button>' +
          '<button class="btn-petit btn-danger" data-del="' + i + '">Supprimer</button>' +
          "</div></div>"
        );
      })
      .join("");

    liste.querySelectorAll("[data-edit]").forEach(function (b) {
      b.addEventListener("click", function () { editerToile(+b.dataset.edit); });
    });
    liste.querySelectorAll("[data-del]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (confirm("Supprimer cette toile ?")) { toiles.splice(+b.dataset.del, 1); rendreToiles(); }
      });
    });
  }

  function editerToile(i) {
    const t = toiles[i];
    indexEditionToile = i;
    document.getElementById("t-id").value = t.id;
    set("t-titre", t.titre); set("t-technique", t.technique); set("t-dimensions", t.dimensions);
    set("t-annee", t.annee); set("t-prix", t.prix); set("t-categorie", t.categorie);
    set("t-description", t.description); set("t-image", t.image);
    document.getElementById("t-disponible").checked = !!t.disponible;
    document.getElementById("t-featured").checked = !!t.featured;
    document.getElementById("t-encours").checked = !!t.en_cours;
    document.getElementById("btn-toile").textContent = "Enregistrer les modifications";
    formToile.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  document.getElementById("export-toiles").addEventListener("click", function () {
    telecharger("toiles.json", JSON.stringify({ toiles: toiles }, null, 2));
  });

  /* ============================================================
     SECTION ATELIERS
     ============================================================ */
  const formAtelier = document.getElementById("form-atelier");

  formAtelier.addEventListener("submit", function (e) {
    e.preventDefault();
    const places = parseInt(val("a-places"), 10) || 0;
    ateliers.push({
      id: genererId("a", ateliers),
      date: val("a-date"),
      heure: val("a-heure"),
      duree: val("a-duree"),
      niveau: val("a-niveau"),
      theme: val("a-theme"),
      prix: parseInt(val("a-prix"), 10) || 0,
      places_total: places,
      places_restantes: places,
    });
    formAtelier.reset();
    rendreAteliers();
  });

  function rendreAteliers() {
    const liste = document.getElementById("liste-ateliers");
    document.getElementById("compteur-ateliers").textContent = ateliers.length;
    liste.innerHTML = ateliers
      .map(function (a, i) {
        return (
          '<div class="admin-item">' +
          '<div class="item-infos">' +
          '<div class="item-titre">' + echapper(a.theme) + "</div>" +
          '<div class="item-meta">' + echapper(a.date) + " · " + echapper(a.heure) +
          " · " + echapper(a.niveau) + " · " + a.prix + " € · " +
          a.places_restantes + "/" + a.places_total + " places</div>" +
          "</div>" +
          '<div class="item-actions">' +
          '<button class="btn-petit btn-danger" data-dela="' + i + '">Supprimer</button>' +
          "</div></div>"
        );
      })
      .join("");
    liste.querySelectorAll("[data-dela]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (confirm("Supprimer cet atelier ?")) { ateliers.splice(+b.dataset.dela, 1); rendreAteliers(); }
      });
    });
  }

  document.getElementById("export-ateliers").addEventListener("click", function () {
    telecharger("ateliers.json", JSON.stringify({ ateliers: ateliers }, null, 2));
  });

  /* ============================================================
     UTILITAIRES
     ============================================================ */
  function val(id) { return document.getElementById(id).value.trim(); }
  function set(id, v) { document.getElementById(id).value = v == null ? "" : v; }

  // Génère un identifiant unique simple (préfixe + numéro incrémenté).
  function genererId(prefixe, tableau) {
    let n = tableau.length + 1;
    let id;
    do {
      id = prefixe + String(n).padStart(3, "0");
      n++;
    } while (tableau.some(function (x) { return x.id === id; }));
    return id;
  }

  function echapper(txt) {
    const d = document.createElement("div");
    d.textContent = txt == null ? "" : String(txt);
    return d.innerHTML;
  }

  // Déclenche le téléchargement d'un fichier texte (JSON).
  function telecharger(nomFichier, contenu) {
    const blob = new Blob([contenu], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nomFichier;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
})();
