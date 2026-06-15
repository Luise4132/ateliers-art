/* ============================================================
   main.js
   Rôle : navigation globale — header au scroll, menu hamburger,
          lien actif, smooth scroll, animations d'apparition au scroll.
   Dépendances : aucune. Chargé sur toutes les pages (avec defer).
   ============================================================ */

(function () {
  "use strict";

  const header = document.querySelector(".site-header");
  const hero = document.querySelector(".hero");
  const hamburger = document.querySelector(".hamburger");
  const nav = document.querySelector(".nav-principale");

  /* ----- Header : transparent au-dessus du hero, solide ensuite ----- */
  function majHeader() {
    if (!header) return;
    // Si la page n'a pas de hero plein écran, le header est toujours solide.
    const seuil = hero ? 80 : 0;
    if (window.scrollY > seuil) {
      header.classList.add("header--solide");
    } else {
      header.classList.remove("header--solide");
    }
  }
  // Si pas de hero, fixer le header en mode solide dès le départ.
  if (!hero && header) header.classList.add("header--solide");
  window.addEventListener("scroll", majHeader, { passive: true });
  majHeader();

  /* ----- Menu hamburger (mobile / tablette) ----- */
  if (hamburger && nav) {
    hamburger.addEventListener("click", function () {
      const ouvert = nav.classList.toggle("ouvert");
      hamburger.classList.toggle("ouvert", ouvert);
      hamburger.setAttribute("aria-expanded", ouvert ? "true" : "false");
      // Bloquer le scroll du body quand le menu plein écran est ouvert
      document.body.style.overflow = ouvert ? "hidden" : "";
    });

    // Fermer le menu après un clic sur un lien
    nav.querySelectorAll("a").forEach(function (lien) {
      lien.addEventListener("click", function () {
        nav.classList.remove("ouvert");
        hamburger.classList.remove("ouvert");
        hamburger.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      });
    });
  }

  /* ----- Marquer le lien de la page active ----- */
  // Compare le nom de fichier courant avec le href de chaque lien.
  const pageActuelle = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-principale a").forEach(function (lien) {
    const cible = lien.getAttribute("href");
    if (cible === pageActuelle || (pageActuelle === "" && cible === "index.html")) {
      lien.classList.add("active");
      lien.setAttribute("aria-current", "page");
    }
  });

  /* ----- Animations d'apparition au scroll (Intersection Observer) ----- */
  const aAnimer = document.querySelectorAll(".apparition");
  if ("IntersectionObserver" in window && aAnimer.length) {
    const observer = new IntersectionObserver(
      function (entrees) {
        entrees.forEach(function (entree) {
          if (entree.isIntersecting) {
            entree.target.classList.add("visible");
            observer.unobserve(entree.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    aAnimer.forEach(function (el) { observer.observe(el); });
  } else {
    // Pas d'IntersectionObserver : tout afficher directement.
    aAnimer.forEach(function (el) { el.classList.add("visible"); });
  }

  /* ----- Année courante dans le footer (si élément présent) ----- */
  document.querySelectorAll(".annee-courante").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
