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
