/**
 * Accueil — « Prochains matchs ».
 * Le build génère TOUS les matchs à venir (triés par date, avec data-date et
 * data-cat). Ici on n'affiche que le PROCHAIN match de CHAQUE catégorie
 * (une équipe = une carte), à partir d'aujourd'hui — comme ça toutes les
 * équipes sont représentées et la liste reste juste au fil des journées,
 * sans redéployer le site.
 */
(function () {
  function init() {
    var grid = document.querySelector(".matches-grid");
    if (!grid) return;
    var cards = [].slice.call(grid.querySelectorAll(".match-card[data-date]"));
    if (!cards.length) return;

    var start = new Date();
    start.setHours(0, 0, 0, 0); // début de la journée d'aujourd'hui
    var t0 = start.getTime();

    // Les cartes sont déjà triées par date croissante côté build : la première
    // rencontrée pour une catégorie est donc bien la plus proche.
    var vues = {};
    var affiches = 0;
    cards.forEach(function (c) {
      var t = new Date(c.getAttribute("data-date")).getTime();
      var cat = c.getAttribute("data-cat") || "";
      if (!isNaN(t) && t >= t0 && !vues[cat]) {
        c.style.display = "";
        vues[cat] = true;
        affiches++;
      } else {
        c.style.display = "none";
      }
    });

    if (affiches === 0) {
      var msg = document.createElement("p");
      msg.style.cssText = "grid-column:1/-1;text-align:center;color:#b8b8b8;";
      msg.textContent = "Aucun match programmé pour le moment.";
      grid.appendChild(msg);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
