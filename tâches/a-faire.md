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
