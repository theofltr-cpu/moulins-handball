/**
 * Rendu client-side des contenus markdown publiés via Sveltia CMS.
 * Récupère les fichiers depuis l'API GitHub puis les injecte dans le DOM.
 */
(function () {
  const REPO = "theofltr-cpu/moulins-handball";
  const BRANCH = "main";

  async function ghList(path) {
    const r = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}?ref=${BRANCH}`);
    if (!r.ok) return [];
    const data = await r.json();
    if (!Array.isArray(data)) return [];
    return data.filter((f) => f.name.endsWith(".md"));
  }

  async function fetchMd(url, slug) {
    const r = await fetch(url);
    if (!r.ok) return null;
    const text = await r.text();
    const m = text.match(/^---\n([\s\S]+?)\n---\n?([\s\S]*)$/);
    if (!m) return null;
    try {
      return {
        slug,
        frontmatter: jsyaml.load(m[1]),
        body: marked.parse(m[2] || ""),
      };
    } catch (e) {
      console.error("Parse error for", slug, e);
      return null;
    }
  }

  async function loadCollection(collection) {
    const files = await ghList(`content/${collection}`);
    const items = await Promise.all(
      files.map((f) => fetchMd(f.download_url, f.name.replace(/\.md$/, ""))),
    );
    return items.filter(Boolean);
  }

  function formatDate(iso, opts) {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("fr-FR", opts || { day: "numeric", month: "long", year: "numeric" });
  }

  function imgBg(image, fallback) {
    if (image) {
      const enc = encodeURI(image);
      return `background-image: linear-gradient(0deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.15) 60%, transparent 100%), url('${enc}'); background-size: cover; background-position: center;`;
    }
    return `background: ${fallback};`;
  }

  function renderNewsCard(item, large) {
    const fm = item.frontmatter || {};
    const date = formatDate(fm.date);
    const fallback = large
      ? "linear-gradient(135deg, #2a1a0a 0%, #4a2a10 100%)"
      : "linear-gradient(135deg, #1a1a1a 0%, #2a1a0a 100%)";
    const link = `actualite.html?slug=${encodeURIComponent(item.slug)}`;
    return `
      <a href="${link}" class="news-card${large ? " news-card-large" : ""}" style="text-decoration:none;color:inherit;display:block;">
        <div class="news-img" style="${imgBg(fm.image, fallback)}"></div>
        <div class="news-overlay">
          <span class="news-cat">${fm.category || "Actualité"}</span>
          <h3>${fm.title || ""}</h3>
          ${large && fm.excerpt ? `<p>${fm.excerpt}</p>` : ""}
          <span class="news-date">${date}</span>
        </div>
      </a>
    `;
  }

  function sortByDateDesc(items) {
    return items.slice().sort((a, b) => {
      const da = new Date(a.frontmatter?.date || 0).getTime();
      const db = new Date(b.frontmatter?.date || 0).getTime();
      return db - da;
    });
  }

  async function renderHomeNewsMosaic(container) {
    const items = sortByDateDesc(await loadCollection("actualites"));
    if (items.length === 0) return;

    const featured = items.find((i) => i.frontmatter?.featured) || items[0];
    const others = items.filter((i) => i !== featured).slice(0, 3);

    let html = renderNewsCard(featured, true);
    others.forEach((i) => (html += renderNewsCard(i, false)));
    container.innerHTML = html;
  }

  async function renderActualitesGrid(container) {
    const items = sortByDateDesc(await loadCollection("actualites"));
    if (items.length === 0) return;

    container.innerHTML = items
      .map(
        (item) => `
        <a href="actualite.html?slug=${encodeURIComponent(item.slug)}" class="news-item" style="text-decoration:none;color:inherit;display:block;">
          <div class="news-item-img" style="${imgBg(item.frontmatter?.image, "linear-gradient(135deg, #1a1a1a 0%, #2a1a0a 100%)")}"></div>
          <div class="news-item-body">
            <span class="news-cat">${item.frontmatter?.category || "Actualité"}</span>
            <h3>${item.frontmatter?.title || ""}</h3>
            <p>${item.frontmatter?.excerpt || ""}</p>
            <span class="news-date">${formatDate(item.frontmatter?.date)}</span>
          </div>
        </a>
      `,
      )
      .join("");
  }

  async function renderActualiteSingle(container) {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("slug");
    if (!slug) {
      container.innerHTML = `<div class="container" style="padding: 80px 0; text-align: center;"><p style="color:#b8b8b8;">Article introuvable.</p><a href="actualites.html" class="btn btn-primary" style="margin-top: 20px;">Retour aux actualités</a></div>`;
      return;
    }
    const url = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/content/actualites/${slug}.md`;
    const item = await fetchMd(url, slug);
    if (!item) {
      container.innerHTML = `<div class="container" style="padding: 80px 0; text-align: center;"><p style="color:#b8b8b8;">Article introuvable.</p><a href="actualites.html" class="btn btn-primary" style="margin-top: 20px;">Retour aux actualités</a></div>`;
      return;
    }
    const fm = item.frontmatter || {};
    const date = formatDate(fm.date);
    document.title = `${fm.title || "Actualité"} — Moulins-lès-Metz Handball`;
    const imageBlock = fm.image
      ? `<figure class="article-cover"><img src="${encodeURI(fm.image)}" alt="${(fm.title || "").replace(/"/g, "&quot;")}"></figure>`
      : "";
    container.innerHTML = `
      <section class="article-head">
        <div class="container" style="max-width: 1000px;">
          <span class="news-cat">${fm.category || "Actualité"}</span>
          <h1>${fm.title || ""}</h1>
          <div class="news-meta">
            <span class="news-date">${date}</span>
            ${fm.author ? `<span class="news-author">Par ${fm.author}</span>` : ""}
          </div>
        </div>
      </section>
      <section class="article-body">
        <div class="container" style="max-width: 1000px;">
          ${imageBlock}
          <div class="prose">${item.body}</div>
          <div style="margin-top: 48px; padding-top: 32px; border-top: 1px solid rgba(255,255,255,0.08);">
            <a href="actualites.html" class="link-arrow">← Retour aux actualités</a>
          </div>
        </div>
      </section>
    `;
  }

  async function renderActualitesFeatured(container) {
    const items = sortByDateDesc(await loadCollection("actualites"));
    const featured = items.find((i) => i.frontmatter?.featured) || items[0];
    if (!featured) return;
    const fm = featured.frontmatter;
    const link = `actualite.html?slug=${encodeURIComponent(featured.slug)}`;
    container.innerHTML = `
      <div class="news-featured-img" style="${imgBg(fm.image, "linear-gradient(135deg, #2a1a0a 0%, #4a2a10 100%)")}"></div>
      <div class="news-featured-content">
        <span class="news-cat">${fm.category || "Actualité"}</span>
        <h2>${fm.title || ""}</h2>
        <p class="news-featured-sub">${fm.excerpt || ""}</p>
        <div class="news-meta">
          <span class="news-date">${formatDate(fm.date)}</span>
          ${fm.author ? `<span class="news-author">Par ${fm.author}</span>` : ""}
        </div>
        <a href="${link}" class="btn btn-primary" style="margin-top: 24px;">Lire l'article</a>
      </div>
    `;
  }

  async function renderEquipes(container) {
    const items = await loadCollection("equipes");
    if (items.length === 0) return;
    const sorted = items.sort((a, b) => (a.frontmatter?.order || 0) - (b.frontmatter?.order || 0));
    container.innerHTML = sorted
      .map((item) => {
        const fm = item.frontmatter || {};
        return `
        <article class="team-tile">
          <div class="team-tile-img" style="${imgBg(fm.photo, "linear-gradient(135deg, #F26522 0%, #c44d12 100%)")}"></div>
          <div class="team-tile-content">
            <span class="team-tile-cat">${fm.championship || fm.category || ""}</span>
            <h3>${fm.name || ""}</h3>
            <p class="team-tile-meta">${fm.coach ? "Coach : " + fm.coach : ""}</p>
            <span class="team-tile-link">Voir l'équipe →</span>
          </div>
        </article>
      `;
      })
      .join("");
  }

  async function renderMatchs(container) {
    const items = await loadCollection("matchs");
    if (items.length === 0) return;
    const sorted = items.sort(
      (a, b) => new Date(a.frontmatter?.date || 0) - new Date(b.frontmatter?.date || 0),
    );
    const upcoming = sorted.filter((i) => i.frontmatter?.status !== "Joué").slice(0, 3);
    if (upcoming.length === 0) return;
    container.innerHTML = upcoming
      .map((item) => {
        const fm = item.frontmatter || {};
        const dateStr = formatDate(fm.date, { weekday: "short", day: "numeric", month: "short" });
        const time = fm.date ? new Date(fm.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "";
        const home = fm.home_team || "Moulins-lès-Metz";
        const away = fm.away_team || "?";
        const homeIsUs = home.toLowerCase().includes("moulins");
        const awayBadge = (away.match(/\b[A-Z]/g) || []).slice(0, 3).join("") || "?";
        const homeBadge = (home.match(/\b[A-Z]/g) || []).slice(0, 3).join("") || "?";
        return `
        <article class="match-card">
          <div class="match-card-head">
            <span class="match-comp">${fm.competition || ""}</span>
            <span class="match-date">${dateStr}${time ? " · " + time : ""}</span>
          </div>
          <div class="match-teams">
            <div class="match-team home">
              <div class="team-badge${homeIsUs ? "" : " away-badge"}">${homeBadge}</div>
              <span>${home}</span>
            </div>
            <div class="match-vs">VS</div>
            <div class="match-team away">
              <div class="team-badge${!homeIsUs ? "" : " away-badge"}">${awayBadge}</div>
              <span>${away}</span>
            </div>
          </div>
          <div class="match-card-foot">
            <span class="match-place">${fm.venue || ""}</span>
            <span class="match-link">${fm.team_category || ""}</span>
          </div>
        </article>
      `;
      })
      .join("");
  }

  function showError(container, msg) {
    container.innerHTML = `<p style="color: #b8b8b8; padding: 20px; text-align: center;">${msg}</p>`;
  }

  async function init() {
    // Attendre que js-yaml et marked soient chargés
    if (typeof jsyaml === "undefined" || typeof marked === "undefined") {
      setTimeout(init, 100);
      return;
    }

    const handlers = {
      "actualites-mosaic": renderHomeNewsMosaic,
      "actualites-grid": renderActualitesGrid,
      "actualites-featured": renderActualitesFeatured,
      "actualite-single": renderActualiteSingle,
      equipes: renderEquipes,
      matchs: renderMatchs,
    };

    const placeholders = document.querySelectorAll("[data-cms]");
    for (const el of placeholders) {
      const handler = handlers[el.dataset.cms];
      if (handler) {
        try {
          await handler(el);
        } catch (e) {
          console.error("CMS render error", e);
          showError(el, "Contenu temporairement indisponible.");
        }
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
