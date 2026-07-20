/**
 * Filtrage du calendrier par équipe (100% côté client, sans réseau).
 * Tous les matchs sont déjà présents dans le HTML (générés au build) ;
 * ce script ne fait que montrer/masquer les lignes selon l'équipe choisie.
 */
(function () {
  function apply(team) {
    document.querySelectorAll(".cal-row").forEach((row) => {
      const match = team === "all" || row.dataset.team === team;
      row.hidden = !match;
    });

    // Masquer une section qui n'a plus aucun match visible
    document.querySelectorAll("[data-cal-section]").forEach((section) => {
      const hasVisible = section.querySelector(".cal-row:not([hidden])");
      section.hidden = !hasVisible;
    });

    // État actif des boutons
    document.querySelectorAll("[data-cal-filters] .filter-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.team === team);
    });
  }

  function init() {
    const filters = document.querySelector("[data-cal-filters]");
    if (!filters) return;

    filters.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-btn");
      if (!btn) return;
      const team = btn.dataset.team || "all";
      apply(team);
      // Refléter le filtre dans l'URL sans recharger
      const url = new URL(window.location);
      if (team === "all") url.searchParams.delete("equipe");
      else url.searchParams.set("equipe", team);
      history.replaceState(null, "", url);
    });

    // Pré-filtre depuis ?equipe=<slug> (lien depuis la page Équipes)
    const wanted = new URLSearchParams(window.location.search).get("equipe");
    const exists =
      wanted &&
      document.querySelector(`[data-cal-filters] .filter-btn[data-team="${wanted}"]`);
    apply(exists ? wanted : "all");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
