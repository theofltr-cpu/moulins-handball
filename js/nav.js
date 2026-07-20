/**
 * Menu de navigation mobile (burger). Ouvre/ferme le menu plein écran.
 */
(function () {
  function init() {
    var btn = document.querySelector(".nav-toggle");
    if (!btn) return;

    function close() {
      document.body.classList.remove("nav-open");
      btn.setAttribute("aria-expanded", "false");
      btn.setAttribute("aria-label", "Ouvrir le menu");
    }

    btn.addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    });

    // Fermer au clic sur un lien du menu ou sur le CTA
    document.querySelectorAll(".main-nav a, .header-cta").forEach(function (a) {
      a.addEventListener("click", close);
    });

    // Fermer avec la touche Échap
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
