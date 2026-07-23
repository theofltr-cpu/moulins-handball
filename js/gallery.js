/**
 * Photothèque : ouverture/fermeture des albums + visionneuse plein écran (lightbox).
 */
(function () {
  function init() {
    // Ouvrir / fermer un album
    document.querySelectorAll("[data-album-toggle]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var album = btn.closest(".album");
        var photos = album.querySelector(".album-photos");
        var open = album.classList.toggle("open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
        if (photos) photos.hidden = !open;
      });
    });

    var photoBtns = document.querySelectorAll(".album-photo");
    if (!photoBtns.length) return;

    // Visionneuse
    var box = document.createElement("div");
    box.className = "lightbox";
    box.innerHTML =
      '<button class="lightbox-close" aria-label="Fermer">✕</button>' +
      '<button class="lightbox-nav lightbox-prev" aria-label="Photo précédente">‹</button>' +
      '<img class="lightbox-img" alt="">' +
      '<button class="lightbox-nav lightbox-next" aria-label="Photo suivante">›</button>';
    document.body.appendChild(box);
    var imgEl = box.querySelector(".lightbox-img");
    var list = [], idx = 0;

    function show(i) { idx = (i + list.length) % list.length; imgEl.src = list[idx]; }
    function open(all, i) {
      list = all; show(i);
      box.classList.add("open");
      document.body.style.overflow = "hidden";
    }
    function close() {
      box.classList.remove("open");
      document.body.style.overflow = "";
      imgEl.src = "";
    }

    photoBtns.forEach(function (p) {
      p.addEventListener("click", function () {
        var album = p.closest(".album");
        var all = [].map.call(album.querySelectorAll(".album-photo"), function (x) {
          return x.getAttribute("data-full");
        });
        open(all, all.indexOf(p.getAttribute("data-full")));
      });
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
