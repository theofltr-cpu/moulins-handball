/**
 * Accueil — « Prochains matchs ».
 * Le build génère TOUS les matchs à venir (triés, avec data-date). Ici on
 * n'affiche que les 3 prochains à partir d'aujourd'hui, côté navigateur —
 * comme ça la liste reste correcte au fil des journées sans redéployer le site.
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

    var shown = 0;
    cards.forEach(function (c) {
      var t = new Date(c.getAttribute("data-date")).getTime();
      if (!isNaN(t) && t >= t0 && shown < 3) {
        c.style.display = "";
        shown++;
      } else {
        c.style.display = "none";
      }
    });

    if (shown === 0) {
      var msg = document.createElement("p");
      msg.style.cssText = "grid-column:1/-1;text-align:center;color:#b8b8b8;";
      msg.textContent = "Aucun match programmé pour le moment.";
      grid.appendChild(msg);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
