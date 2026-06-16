# Ateliers d'Art — Site galerie d'art

Site statique (HTML / CSS / JavaScript vanilla, zéro framework). Prévu pour Netlify.

## Lancer le site en local
Le site charge ses données via `fetch()` : il faut un petit serveur HTTP (ouvrir le
fichier en `file://` ne fonctionne pas). Dans ce dossier :

```
python -m http.server 8123
```

Puis ouvrir http://localhost:8123/

## Déploiement Netlify
1. Déposer ce dossier sur Netlify (glisser-déposer ou via Git).
2. Aucun build nécessaire : « Publish directory » = la racine du projet.
3. Rediriger le nom de domaine (acheté sur Wix) vers Netlify via les DNS.

## Administration
- Accès : `/admin` (ou `admin.html`).
- Mot de passe par défaut : **atelier2025** — à changer dans `js/admin.js`
  (constante `MOT_DE_PASSE` en haut du fichier).
- L'admin permet d'ajouter/modifier/supprimer toiles et ateliers, puis **d'exporter**
  les fichiers JSON. ⚠️ Il faut ensuite remplacer `data/toiles.json` /
  `data/ateliers.json` dans le projet et **redéployer** (l'export ne modifie pas
  le site en ligne tout seul).

## À personnaliser (rechercher « TODO » dans le code)
- **Numéro WhatsApp** : `js/galerie.js`, constante `NUMERO_WHATSAPP` (format `33XXXXXXXXX`).
- **Mot de passe admin** : `js/admin.js`, constante `MOT_DE_PASSE`.
- **Google Analytics** (facultatif) : `js/cookies.js`, constante `GA_ID`.
- **Coordonnées, adresse, réseaux sociaux** : dans le footer de chaque page HTML
  et dans `js/modales.js` (mentions légales / confidentialité).
- **Nom de domaine** : balises `canonical` / Open Graph des pages, `robots.txt`, `sitemap.xml`.
- **Photos de l'atelier / portrait de l'artiste** : remplacer les images placeholder
  (dossiers `images/atelier/` et `images/ui/`), actuellement des toiles servent de substitut.
- **Favicon** : ajouter `images/ui/favicon.ico`.

## Structure des œuvres
Les 19 toiles sont dans `data/toiles.json`, images dans `images/toiles/`.
Catégories utilisées pour les filtres : Acrylique, Aquarelle, Dessin.

## Note
Les images originales `1.jpg` … `19.jpg` à la racine ont été copiées (renommées)
dans `images/toiles/`. Vous pouvez supprimer les fichiers numérotés de la racine.
