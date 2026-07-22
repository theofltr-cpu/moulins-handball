/**
 * Bandeau d'information cookies.
 * Le site ne dépose AUCUN cookie de suivi/publicité : ce bandeau est purement
 * informatif (pas de consentement requis). Il est masqué après acceptation.
 */
(function () {
  var KEY = "mlm-cookies-ok";

  function init() {
    try {
      if (localStorage.getItem(KEY)) return;
    } catch (e) {}

    var bar = document.createElement("div");
    bar.className = "cookie-bar";
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", "Information sur les cookies");
    bar.innerHTML =
      '<p class="cookie-text">🍪 Ce site n’utilise <strong>aucun cookie publicitaire ni de suivi</strong>. Seuls des cookies techniques nécessaires à son bon fonctionnement peuvent être déposés. <a href="/confidentialite.html#cookies">En savoir plus</a>.</p>' +
      '<button type="button" class="cookie-btn">J’ai compris</button>';

    var btn = bar.querySelector(".cookie-btn");
    btn.addEventListener("click", function () {
      try {
        localStorage.setItem(KEY, "1");
      } catch (e) {}
      bar.classList.remove("cookie-bar--visible");
      setTimeout(function () {
        bar.remove();
      }, 400);
    });

    document.body.appendChild(bar);
    requestAnimationFrame(function () {
      bar.classList.add("cookie-bar--visible");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
