# À faire — Site Moulins-lès-Metz Handball

## Phase 1 — Site HTML statique (en cours)

- [x] Créer la structure du projet
- [ ] Page d'accueil (squelette + design placeholder)
- [ ] Validation visuelle par Théo + ajustement couleurs/logo du club
- [ ] Page "Le Club" (histoire, valeurs, bureau)
- [ ] Page "Équipes" (seniors, jeunes, féminines, etc.)
- [ ] Page "Calendrier" (matchs à venir)
- [ ] Page "Actualités" (news + photos)
- [ ] Page "Contact" (adresse salle, formulaire, réseaux sociaux)
- [ ] Header + footer communs à toutes les pages
- [ ] Responsive mobile

## Phase 2 — Mise en ligne (plus tard)

- [ ] Acheter nom de domaine
- [ ] Choisir hébergement
- [ ] Uploader le site
- [ ] Configurer email pro (contact@…)

## Phase 3 — Migration WordPress (optionnel, plus tard)

- [ ] Si besoin de planning matchs dynamique / gestion par bénévoles
- [ ] Sinon rester en HTML statique (plus rapide, gratuit, suffisant)

## Infos à récupérer auprès de Théo

- [ ] Couleurs officielles du club (logo)
- [ ] Logo du club (fichier image)
- [ ] Liste des équipes
- [ ] Adresse de la salle / gymnase
- [ ] Réseaux sociaux du club (Facebook, Insta…)
- [ ] Personnes du bureau (président, secrétaire, trésorier)

## Phase 3 — Performance backoffice (2026-07-20)

- [x] Créer package.json + build.js (rendu statique au déploiement)
- [x] Tester le build en local (dist/ correct)
- [x] Vérifier visuellement les pages générées
- [x] Mettre à jour le workflow GitHub Actions (build avant deploy)
- [x] Push + vérifier l'Action et le site en ligne
- [ ] Test de bout en bout via /admin

## Phase 4 — Calendrier segmenté par équipe (2026-07-20)

- [x] Moteur de calendrier data-driven (build.js renderCalendar)
- [x] Filtres par équipe auto-générés + filtrage client (js/calendar-filter.js)
- [x] Sections « À venir » et « Résultats » avec scores victoire/défaite
- [x] Lien page Équipes -> calendrier filtré (?equipe=slug)
- [x] Vérifié en local + en ligne (déploiement auto OK)
- [x] Liste officielle des équipes intégrée dans admin/config.yml (8 catégories) + compétition Championnat/Coupe
- [ ] Remplacer les 4 matchs d'exemple par les vrais matchs via /admin

## Phase 5 — Fiches d'équipes (2026-07-20)

- [x] Schéma backoffice équipes enrichi (nom en select officiel, horaires, gymnase)
- [x] 8 fiches d'équipes créées, reliées chacune à son calendrier filtré
- [x] Page Équipes dynamique (plus de contenu factice) + vérifiée en ligne
- [ ] À FAIRE PAR THÉO via /admin : remplir coach / horaires / gymnase + ajouter les photos d'équipes

## Phase 6 — Tout éditable via backoffice (2026-07-20)

- [x] Réglages du site (bandeau, footer, coordonnées, réseaux, bouton) éditables
- [x] Page d'accueil (hero + 4 chiffres) éditable
- [x] Page Le Club (hero, histoire, bureau, chiffres) éditable
- [x] Page Contact (hero, coordonnées, président) éditable + formulaire prêt pour Formspree
- [x] Moteur de jetons + rendu listes (bureau, chiffres) vérifiés en local
- [ ] EN ATTENTE THÉO : créer un formulaire Formspree -> me donner l'URL (formulaire de contact)
- [ ] THÉO via /admin : corriger les chiffres réels (8 équipes, ~170 licenciés), remplir bureau, réseaux

## Phase 7 — Ajustements équipes/matchs/partenaires (2026-07-20)

- [x] Équipes : coach uniquement (retrait horaires + gymnase)
- [x] Matchs : 8 placeholders « à venir » (un par catégorie) en attendant les vrais calendriers
- [x] Partenaires : section accueil dynamique (logos ajoutables via /admin)
- [x] FIX injectCms (imbrication) — supprime les fausses actus/matchs résiduels
- [ ] THÉO : ajouter les logos partenaires via /admin (collection Partenaires)
- [ ] THÉO : donnera les vrais matchs quand les calendriers sortent
- [ ] THÉO : récupérer les anciennes actus de l'ancien site + composition du bureau (à me transmettre)

## Phase 8 — Responsive mobile (2026-07-20)

- [x] Audit mobile (375px) : aucun débordement, layout OK ; seul manque = navigation mobile
- [x] Menu burger plein écran sur toutes les pages (+ bouton Nous rejoindre)
- [x] js/nav.js (ouverture/fermeture) ; desktop inchangé
- [x] Vérifié mobile + desktop + en ligne
