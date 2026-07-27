/**
 * Visionneuse plein écran (lightbox) pour la page d'un album.
 * Chaque .album-photo ouvre la photo en grand, avec navigation ‹ ›, fermeture
 * (croix, clic sur le fond, Échap) et flèches clavier.
 */
(function () {
  function init() {
    var photoBtns = [].slice.call(document.querySelectorAll(".album-photo"));
    if (!photoBtns.length) return;

    var list = photoBtns.map(function (p) { return p.getAttribute("data-full"); });
    var idx = 0;

    var box = document.createElement("div");
    box.className = "lightbox";
    box.innerHTML =
      '<button class="lightbox-close" aria-label="Fermer">✕</button>' +
      '<button class="lightbox-nav lightbox-prev" aria-label="Photo précédente">‹</button>' +
      '<img class="lightbox-img" alt="">' +
      '<button class="lightbox-nav lightbox-next" aria-label="Photo suivante">›</button>';
    document.body.appendChild(box);
    var imgEl = box.querySelector(".lightbox-img");

    function show(i) { idx = (i + list.length) % list.length; imgEl.src = list[idx]; }
    function open(i) { show(i); box.classList.add("open"); document.body.style.overflow = "hidden"; }
    function close() { box.classList.remove("open"); document.body.style.overflow = ""; imgEl.src = ""; }

    photoBtns.forEach(function (p, i) {
      p.addEventListener("click", function () { open(i); });
    });
    box.querySelector(".lightbox-close").addEventListener("click", close);
    box.querySelector(".lightbox-prev").addEventListener("click", function (e) { e.stopPropagation(); show(idx - 1); });
    box.querySelector(".lightbox-next").addEventListener("click", function (e) { e.stopPropagation(); show(idx + 1); });
    box.addEventListener("click", function (e) { if (e.target === box) close(); });
    document.addEventListener("keydown", function (e) {
      if (!box.classList.contains("open")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") show(idx - 1);
      else if (e.key === "ArrowRight") show(idx + 1);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
