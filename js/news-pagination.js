/**
 * Pagination de la liste des actualités : N articles par page (data-per-page),
 * 100% côté client (tous les articles sont déjà dans le HTML pour le SEO).
 */
(function () {
  function init() {
    const nav = document.querySelector("[data-news-pagination]");
    const grid = document.querySelector(".news-grid");
    if (!nav || !grid) return;

    const perPage = parseInt(nav.dataset.perPage || "6", 10);
    const items = [...grid.querySelectorAll(".news-item")];
    const pageCount = Math.ceil(items.length / perPage);
    if (pageCount <= 1) return; // pas de pagination nécessaire

    let current = 1;

    function render() {
      // Afficher uniquement les articles de la page courante
      items.forEach((el, i) => {
        const page = Math.floor(i / perPage) + 1;
        el.hidden = page !== current;
      });

      // Construire les liens de pagination
      nav.innerHTML = "";
      const link = (label, page, opts = {}) => {
        const a = document.createElement("a");
        a.href = "#actualites";
        a.className = "page-link" + (opts.active ? " active" : "") + (opts.disabled ? " disabled" : "");
        a.textContent = label;
        if (!opts.disabled) {
          a.addEventListener("click", (e) => {
            e.preventDefault();
            current = page;
            render();
            grid.scrollIntoView({ behavior: "smooth", block: "start" });
          });
        }
        nav.appendChild(a);
      };

      link("← Précédent", current - 1, { disabled: current === 1 });
      for (let p = 1; p <= pageCount; p++) link(String(p), p, { active: p === current });
      link("Suivant →", current + 1, { disabled: current === pageCount });
    }

    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
