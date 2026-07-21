# Leçons apprises — Projet Moulins-lès-Metz Handball

Notes pour ne pas refaire les mêmes erreurs.

---

## Communication / Choix techniques

### Ne pas pivoter de solution sans diagnostiquer l'objection

**Contexte :** l'utilisateur a dit "Refaire complètement le design → WordPress" puis immédiatement après "Non mais je veux pas de WordPress". Au lieu de demander **pourquoi**, j'allais enchaîner sur un plan WordPress complet (hébergeur o2switch, transfert domaine, etc.). Avant ça, on avait fait des allers-retours Wix ↔ WordPress pendant plusieurs messages sans jamais que je creuse le vrai blocage côté utilisateur.

**Règle :**
- Quand l'utilisateur **rejette une solution que je viens de proposer** : NE PAS pivoter immédiatement vers une autre option. **D'abord diagnostiquer** : "Pourquoi pas X ?"
- L'utilisateur peut dire "non" à WordPress pour 10 raisons différentes (mauvaise expérience, trop technique, trop lourd, prix, peur de la migration, etc.). Chaque raison appelle une réponse différente.
- Sans diagnostic, je tire dans le noir et je perds du temps à proposer Webflow/Squarespace/Framer en série jusqu'à tomber juste par hasard.

**Why :** proposer 5 solutions à la suite sans comprendre l'objection initiale = comportement de vendeur qui essaie d'écouler son stock, pas de conseiller. L'utilisateur se sent pas écouté et finit par décrocher.

**How to apply :** dès que l'utilisateur dit "non" / "je veux pas" / "pas ça" sur une recommandation → ma réponse suivante doit être **une seule question diagnostique**, pas un nouveau plan. Format type : "OK stop, pourquoi pas X ?".

---

## Communication / Sur-proposition

### Ne pas multiplier les options quand le besoin n'est pas cadré

**Contexte :** sur la question Wix vs WordPress, j'ai listé jusqu'à 4 options de coûts (Wix premium / WP+Elementor Pro / WP+Elementor gratuit / HTML statique Netlify) sans avoir d'abord clarifié les priorités réelles (qui édite ? à quelle fréquence ? quel niveau de redesign ?). Résultat : l'utilisateur a navigué dans les options et a fini par dire "je veux pas WP" sans qu'on sache pourquoi.

**Règle :**
- Avant de comparer plusieurs solutions techniques, **cadrer les 2-3 critères qui comptent vraiment** pour l'utilisateur (budget plafond, qui édite au quotidien, ampleur du redesign).
- Sans ces critères, tout comparatif est de la masturbation intellectuelle qui noie l'utilisateur.

**Why :** un débutant en dev n'a pas les repères pour trancher entre 4 stacks techniques. Il a besoin que je tranche pour lui après avoir compris ses contraintes — pas que je lui demande de choisir dans un menu.

**How to apply :** avant tout comparatif >2 options → poser **1 question de cadrage** sur le critère le plus discriminant. Exemple : "tu paies combien aujourd'hui sur Wix ?" trance entre "on reste / on migre" sans même lister d'alternatives.

---

## Migration / Validation end-to-end

### Ne pas lancer une migration de plateforme pour UNE fonctionnalité sans avoir vérifié toute la chaîne

**Contexte :** une fois le site Cloudflare + Sveltia CMS qui marchait bien, l'utilisateur a demandé une auth par email (pas GitHub) pour son bureau. J'ai proposé de migrer vers Netlify (qui propose "Netlify Identity") sans avoir vérifié :
1. que Netlify Identity est encore disponible facilement pour les nouveaux comptes (ils sont en train de le déprécier)
2. que la chaîne complète (Identity → Registration preferences → Services → Git Gateway → Invitation → test) tient en peu de clics
3. quel chemin alternatif on aurait sur Cloudflare (Cloudflare Access existait et était plus simple)

Résultat : l'utilisateur a créé un compte Netlify, importé son repo, et s'est perdu dans une UI où la moitié des options étaient absentes/cachées. Au bout de plusieurs allers-retours, il a dit "on arrête, retour Cloudflare". Du temps perdu, de la fatigue inutile, et la confiance entamée.

**Règle :**
- Avant de proposer une **migration de plateforme** pour résoudre un seul besoin → vérifier que **la chaîne complète tient debout** : auth, déploiement, contenu, sécurité, scaling, retour arrière.
- Tester soi-même le chemin de bout en bout (au moins en lecture des docs récentes) avant d'embarquer l'utilisateur. Une feature présente dans la doc ≠ une feature facile à activer en 2026.
- Pour un besoin auxiliaire (auth, formulaires, etc.), explorer d'abord les **solutions sur place** avant de proposer de tout déménager. Sur Cloudflare il y avait **Cloudflare Access** qui résolvait pareil sans rien casser — je n'y ai pas pensé en premier.

**Why :** migrer une plateforme = effort 10x supérieur à activer une feature sur la plateforme actuelle. Si je ne sais pas avec certitude que la nouvelle plateforme tient toutes les promesses, je condamne l'utilisateur à un parcours du combattant pour rien.

**How to apply :** dès que je propose "on déménage vers X pour avoir Y" → réponse à me poser AVANT d'envoyer :
1. Est-ce que Y est confirmé encore actif sur X **aujourd'hui** (pas dans la doc de 2022) ?
2. Combien d'étapes de config Y nécessite sur X ? (idéalement ≤3)
3. Existe-t-il une solution équivalente à Y sur la plateforme actuelle ? Si oui, proposer ÇA d'abord.
4. Si la réponse à (1) ou (2) est incertaine, dire à l'utilisateur "je vérifie d'abord, je reviens" — pas le faire créer un compte tout de suite.

---

## Technique / Sveltia CMS (admin/config.yml)

### Vérifier l'unicité des noms de collections AVANT d'en ajouter une

**Contexte :** en ajoutant une collection `- name: pages` (Club & Contact), je n'ai pas vu qu'une collection `pages` (« Pages fixes ») existait déjà dans admin/config.yml. Sveltia CMS refuse les noms de collection dupliqués → **tout le backoffice /admin tombe en erreur** (« Collection names must be unique »), pas juste la section concernée. L'utilisateur a signalé « l'accès admin ne fonctionne pas » ; ce n'était pas l'OAuth mais ce doublon.

**Règle :**
- Avant d'ajouter une collection dans admin/config.yml : `grep "name:" admin/config.yml` pour vérifier qu'aucune n'a déjà ce nom.
- Après toute modif de config.yml : valider avec un script Node qui charge le YAML ET vérifie l'unicité des `collections[].name` (fait dans cette session).
- Une erreur de config Sveltia casse TOUT l'écran, pas une partie → toujours ouvrir /admin (screenshot navigateur) après une modif de config, pas seulement vérifier le rendu du site.

**Why :** une config CMS invalide rend le backoffice totalement inutilisable pour l'utilisateur, même si le site public fonctionne. Le YAML « valide » ne suffit pas — il faut valider les règles métier de Sveltia (unicité des noms).

**How to apply :** après édition de admin/config.yml → 1) grep des noms, 2) script de validation unicité, 3) ouverture réelle de /admin dans le navigateur pour confirmer l'absence d'écran d'erreur.

---

## Technique / Déploiement (git push + GitHub Actions)

### Après un push qui passe par le fallback rebase, retrouver le run par son SHA (pas --limit 1)

**Contexte :** mon one-liner `git push || (git pull --rebase && git push)` a réécrit le SHA du commit. `gh run watch` lancé avec `gh run list --limit 1` s'est accroché à un ANCIEN run (commit précédent) déjà terminé « success », me faisant croire que c'était déployé. En réalité mon vrai commit n'était pas encore (ou pas) déployé — le site en ligne restait inchangé pendant plusieurs minutes.

**Règle :**
- Après push, récupérer le SHA local (`git rev-parse --short HEAD`) et trouver le run correspondant : `gh run list --json headSha,databaseId --jq 'select(.headSha startswith SHA)'`, PAS `--limit 1`.
- Vérifier la propagation en ligne avec un marqueur unique de la modif (cache-bust), et si le contenu ne bouge pas après ~1 min, soupçonner que le bon run n'a pas tourné (et non le cache).
- En cas de doute : commit vide `git commit --allow-empty` pour re-déclencher un déploiement propre du HEAD courant.

**Why :** croire à tort qu'un déploiement a eu lieu fait perdre du temps et donne une fausse validation « en ligne ».

---

## Vérification / Cache (2026-07-21)

### Ne jamais dire "ça marche" sans l'avoir vu dans le navigateur RÉEL de l'utilisateur
**Contexte :** j'ai affirmé plusieurs fois "la pagination marche / les chiffres sont à jour" en me basant sur `curl` ou le dist local. Théo, lui, voyait l'ancienne version (cache navigateur + propagation Cloudflare sur son edge). Résultat : "tout ce que tu m'as dit il n'y a rien" → perte de confiance.
**Règle :**
- Avant de dire "c'est fait/ça marche" : vérifier dans le navigateur connecté de l'utilisateur (claude-in-chrome) avec un rechargement forcé (URL ?v=timestamp), pas seulement en curl.
- Après un déploiement Cloudflare : attendre ~1-2 min ET re-tester depuis le navigateur de l'utilisateur (la propagation edge peut traîner localement même quand curl voit déjà la nouvelle version).
- Quand un bug est re-signalé 2+ fois alors que "ça marche" côté serveur : c'est du cache/propagation → régler la CAUSE (en-tête no-cache) au lieu de répéter "vide ton cache".
**Fait :** ajout d'un fichier `_headers` avec `Cache-Control: no-cache` pour que le navigateur revalide toujours.
