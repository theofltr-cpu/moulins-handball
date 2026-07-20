/**
 * Build statique du site : lit les contenus markdown publiés via Sveltia CMS
 * (dossier content/) et génère le HTML final dans dist/.
 *
 * Reprend à l'identique les gabarits de rendu de js/cms-render.js afin que
 * le rendu visuel soit inchangé — seule la méthode change : le HTML est
 * généré une fois au déploiement au lieu d'être construit dans le navigateur
 * de chaque visiteur via l'API GitHub.
 */
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const { marked } = require("marked");

const ROOT = __dirname;
const DIST = path.join(ROOT, "dist");

/* ---------- Lecture des collections ---------- */

function loadCollection(name) {
  const dir = path.join(ROOT, "content", name);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const text = fs.readFileSync(path.join(dir, f), "utf8");
      const m = text.match(/^---\r?\n([\s\S]+?)\r?\n---\r?\n?([\s\S]*)$/);
      if (!m) return null;
      try {
        return {
          slug: f.replace(/\.md$/, ""),
          frontmatter: yaml.load(m[1]) || {},
          body: marked.parse(m[2] || ""),
        };
      } catch (e) {
        console.error(`Erreur de parsing : content/${name}/${f}`, e.message);
        return null;
      }
    })
    .filter(Boolean);
}

/* ---------- Helpers identiques à cms-render.js ---------- */

function formatDate(iso, opts) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(
    "fr-FR",
    opts || { day: "numeric", month: "long", year: "numeric" },
  );
}

function imgBg(image, fallback) {
  if (image) {
    const enc = encodeURI(image);
    return `background-image: linear-gradient(0deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.15) 60%, transparent 100%), url('${enc}'); background-size: cover; background-position: center;`;
  }
  return `background: ${fallback};`;
}

function sortByDateDesc(items) {
  return items.slice().sort((a, b) => {
    const da = new Date(a.frontmatter?.date || 0).getTime();
    const db = new Date(b.frontmatter?.date || 0).getTime();
    return db - da;
  });
}

function articleUrl(slug) {
  return `/actualite/${encodeURIComponent(slug)}.html`;
}

/* ---------- Gabarits (repris de cms-render.js) ---------- */

function renderNewsCard(item, large) {
  const fm = item.frontmatter || {};
  const date = formatDate(fm.date);
  const fallback = large
    ? "linear-gradient(135deg, #2a1a0a 0%, #4a2a10 100%)"
    : "linear-gradient(135deg, #1a1a1a 0%, #2a1a0a 100%)";
  return `
      <a href="${articleUrl(item.slug)}" class="news-card${large ? " news-card-large" : ""}" style="text-decoration:none;color:inherit;display:block;">
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

function renderHomeNewsMosaic(items) {
  if (items.length === 0) return null;
  const featured = items.find((i) => i.frontmatter?.featured) || items[0];
  const others = items.filter((i) => i !== featured).slice(0, 3);
  let html = renderNewsCard(featured, true);
  others.forEach((i) => (html += renderNewsCard(i, false)));
  return html;
}

function renderActualitesGrid(items) {
  if (items.length === 0) return null;
  return items
    .map(
      (item) => `
        <a href="${articleUrl(item.slug)}" class="news-item" style="text-decoration:none;color:inherit;display:block;">
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

function renderActualitesFeatured(items) {
  const featured = items.find((i) => i.frontmatter?.featured) || items[0];
  if (!featured) return null;
  const fm = featured.frontmatter;
  return `
      <div class="news-featured-img" style="${imgBg(fm.image, "linear-gradient(135deg, #2a1a0a 0%, #4a2a10 100%)")}"></div>
      <div class="news-featured-content">
        <span class="news-cat">${fm.category || "Actualité"}</span>
        <h2>${fm.title || ""}</h2>
        <p class="news-featured-sub">${fm.excerpt || ""}</p>
        <div class="news-meta">
          <span class="news-date">${formatDate(fm.date)}</span>
          ${fm.author ? `<span class="news-author">Par ${fm.author}</span>` : ""}
        </div>
        <a href="${articleUrl(featured.slug)}" class="btn btn-primary" style="margin-top: 24px;">Lire l'article</a>
      </div>
    `;
}

function renderEquipes(items) {
  if (items.length === 0) return null;
  const sorted = items
    .slice()
    .sort((a, b) => (a.frontmatter?.order || 0) - (b.frontmatter?.order || 0));
  return sorted
    .map((item) => {
      const fm = item.frontmatter || {};
      const calSlug = slugifyTeam(fm.name || `${fm.category || ""} ${fm.gender || ""}`);
      const infos = [
        fm.coach ? `<span class="team-tile-info"><strong>Coach</strong> ${fm.coach}</span>` : "",
        fm.schedule ? `<span class="team-tile-info"><strong>Entraînement</strong> ${fm.schedule}</span>` : "",
        fm.venue ? `<span class="team-tile-info"><strong>Gymnase</strong> ${fm.venue}</span>` : "",
      ].join("");
      return `
        <a href="/calendrier.html?equipe=${calSlug}" class="team-tile" style="text-decoration:none;color:inherit;display:block;">
          <div class="team-tile-img" style="${imgBg(fm.photo, "linear-gradient(135deg, #F26522 0%, #c44d12 100%)")}"></div>
          <div class="team-tile-content">
            <span class="team-tile-cat">${fm.championship || ""}</span>
            <h3>${fm.name || ""}</h3>
            <div class="team-tile-infos">${infos}</div>
            <span class="team-tile-link">Voir le calendrier →</span>
          </div>
        </a>
      `;
    })
    .join("");
}

function renderMatchs(items) {
  if (items.length === 0) return null;
  const sorted = items
    .slice()
    .sort((a, b) => new Date(a.frontmatter?.date || 0) - new Date(b.frontmatter?.date || 0));
  const upcoming = sorted.filter((i) => i.frontmatter?.status !== "Joué").slice(0, 3);
  if (upcoming.length === 0) return null;
  return upcoming
    .map((item) => {
      const fm = item.frontmatter || {};
      const dateStr = formatDate(fm.date, { weekday: "short", day: "numeric", month: "short" });
      const time = fm.date
        ? new Date(fm.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
        : "";
      const home = fm.home_team || "Moulins-lès-Metz";
      const away = fm.away_team || "?";
      const homeIsUs = home.toLowerCase().includes("moulins");
      const awayBadge = (away.match(/\b[A-Z]/g) || []).slice(0, 3).join("") || "?";
      const homeBadge = (home.match(/\b[A-Z]/g) || []).slice(0, 3).join("") || "?";
      return `
        <article class="match-card">
          <div class="match-card-head">
            <span class="match-comp">${compLabel(fm)}</span>
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

/* ---------- Calendrier segmenté par équipe ---------- */

function compLabel(fm) {
  const base = fm.competition || "";
  const detail = fm.competition_detail;
  return detail ? `${base} · ${detail}` : base;
}

function slugifyTeam(cat) {
  return (cat || "autres")
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "autres";
}

/** Ordre naturel : séniors d'abord, puis catégories jeunes par âge décroissant. */
function teamRank(cat) {
  const c = (cat || "").toLowerCase();
  if (c.includes("senior") || c.includes("sénior")) return 0;
  const m = c.match(/-?(\d+)/);
  if (m) return 100 - parseInt(m[1], 10); // -18 avant -15 avant -13...
  return 200;
}

function distinctTeams(matchs) {
  const seen = new Map();
  for (const it of matchs) {
    const cat = it.frontmatter?.team_category;
    if (cat && !seen.has(cat)) seen.set(cat, slugifyTeam(cat));
  }
  return [...seen.entries()]
    .map(([label, slug]) => ({ label, slug }))
    .sort((a, b) => teamRank(a.label) - teamRank(b.label) || a.label.localeCompare(b.label, "fr"));
}

function calDateParts(iso) {
  if (!iso) return { day: "", num: "", time: "" };
  const d = new Date(iso);
  const day = d
    .toLocaleDateString("fr-FR", { weekday: "short" })
    .replace(".", "")
    .toUpperCase();
  const num = d.toLocaleDateString("fr-FR", { day: "numeric" });
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return { day, num, time: `${hh}H${mm}` };
}

function renderCalRow(item, { showScore }) {
  const fm = item.frontmatter || {};
  const { day, num, time } = calDateParts(fm.date);
  const home = fm.home_team || "Moulins-lès-Metz";
  const away = fm.away_team || "?";
  const homeIsUs = home.toLowerCase().includes("moulins");
  const slug = slugifyTeam(fm.team_category);

  let middle;
  if (showScore && fm.home_score != null && fm.away_score != null) {
    const usScore = homeIsUs ? fm.home_score : fm.away_score;
    const themScore = homeIsUs ? fm.away_score : fm.home_score;
    const outcome =
      usScore > themScore ? "win" : usScore < themScore ? "loss" : "draw";
    middle = `
            <span class="cal-team${homeIsUs ? " home" : ""}">${home}</span>
            <span class="cal-score cal-score-${outcome}">${fm.home_score}<span class="cal-score-sep">–</span>${fm.away_score}</span>
            <span class="cal-team${!homeIsUs ? " home" : ""}">${away}</span>`;
  } else {
    middle = `
            <span class="cal-team${homeIsUs ? " home" : ""}">${home}</span>
            <span class="cal-vs">VS</span>
            <span class="cal-team${!homeIsUs ? " home" : ""}">${away}</span>`;
  }

  return `
        <article class="cal-row" data-team="${slug}">
          <div class="cal-date">
            <span class="cal-day">${day}</span>
            <span class="cal-num">${num}</span>
            <span class="cal-time">${time}</span>
          </div>
          <div class="cal-comp">
            <span class="match-comp">${compLabel(fm)}</span>
            <span class="cal-cat">${fm.team_category || ""}</span>
          </div>
          <div class="cal-teams">${middle}
          </div>
          <div class="cal-place">${fm.venue || ""}</div>
        </article>`;
}

function renderCalendar(matchs) {
  if (matchs.length === 0) return null;

  const teams = distinctTeams(matchs);
  const isPlayed = (i) => i.frontmatter?.status === "Joué";

  const upcoming = matchs
    .filter((i) => !isPlayed(i))
    .sort((a, b) => new Date(a.frontmatter?.date || 0) - new Date(b.frontmatter?.date || 0));
  const results = matchs
    .filter(isPlayed)
    .sort((a, b) => new Date(b.frontmatter?.date || 0) - new Date(a.frontmatter?.date || 0));

  const filters =
    `<button class="filter-btn active" data-team="all">Toutes les équipes</button>` +
    teams
      .map((t) => `<button class="filter-btn" data-team="${t.slug}">${t.label}</button>`)
      .join("");

  const section = (eyebrow, title, rows, { showScore = false, extraClass = "" } = {}) => {
    if (rows.length === 0) return "";
    return `
      <section class="section${extraClass}" data-cal-section>
        <div class="container">
          <div class="section-head">
            <div>
              <span class="eyebrow">${eyebrow}</span>
              <h2>${title}</h2>
            </div>
          </div>
          <div class="cal-list">${rows.map((r) => renderCalRow(r, { showScore })).join("")}
          </div>
        </div>
      </section>`;
  };

  return `
    <section class="section-filters">
      <div class="container">
        <div class="filters" data-cal-filters>${filters}
        </div>
      </div>
    </section>
    ${section("Matchs à venir", "Prochains matchs", upcoming)}
    ${section("Résultats", "Derniers résultats", results, { showScore: true, extraClass: " section-alt" })}
  `;
}

function renderArticleInner(item) {
  const fm = item.frontmatter || {};
  const date = formatDate(fm.date);
  const imageBlock = fm.image
    ? `<figure class="article-cover"><img src="${encodeURI(fm.image)}" alt="${(fm.title || "").replace(/"/g, "&quot;")}"></figure>`
    : "";
  return `
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
            <a href="/actualites.html" class="link-arrow">← Retour aux actualités</a>
          </div>
        </div>
      </section>
    `;
}

/* ---------- Injection dans les pages ---------- */

/**
 * Remplace le contenu intérieur du conteneur data-cms="name" par html.
 * Si html est null (aucun contenu publié), la page garde son contenu statique
 * existant — même comportement que l'ancien rendu client.
 */
function injectCms(pageHtml, name, html) {
  if (html == null) return pageHtml;
  const openTag = new RegExp(
    `(<(article|div)[^>]*data-cms="${name}"[^>]*>)([\\s\\S]*?)(</\\2>)`,
  );
  if (!openTag.test(pageHtml)) {
    console.warn(`Conteneur data-cms="${name}" introuvable`);
    return pageHtml;
  }
  return pageHtml.replace(openTag, `$1${html}$4`);
}

/** Retire les balises <script> devenues inutiles (cms-render + libs CDN). */
function stripCmsScripts(pageHtml) {
  return pageHtml
    .replace(/^\s*<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/js-yaml[^"]*"[^>]*><\/script>\r?\n?/m, "")
    .replace(/^\s*<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/marked[^"]*"[^>]*><\/script>\r?\n?/m, "")
    .replace(/^\s*<script src="js\/cms-render\.js"[^>]*><\/script>\r?\n?/m, "");
}

/* ---------- Build ---------- */

function copyDir(src, dest, exclude = []) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (exclude.includes(entry.name)) continue;
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function build() {
  console.log("Build du site…");

  // 1. Copie propre du site dans dist/ (sans les sources de build)
  fs.rmSync(DIST, { recursive: true, force: true });
  copyDir(ROOT, DIST, [
    "dist",
    "node_modules",
    ".git",
    ".github",
    ".wrangler",
    ".claude",
    ".DS_Store",
    "build.js",
    "package.json",
    "package-lock.json",
    "tâches",
    "DA.md",
  ]);

  // 2. Chargement des collections
  const actualites = sortByDateDesc(loadCollection("actualites"));
  const equipes = loadCollection("equipes");
  const matchs = loadCollection("matchs");
  console.log(
    `Contenus : ${actualites.length} actu(s), ${equipes.length} équipe(s), ${matchs.length} match(s)`,
  );

  // 3. Injection dans les pages
  const pages = {
    "index.html": (html) => {
      html = injectCms(html, "actualites-mosaic", renderHomeNewsMosaic(actualites));
      html = injectCms(html, "matchs", renderMatchs(matchs));
      return html;
    },
    "actualites.html": (html) => {
      html = injectCms(html, "actualites-featured", renderActualitesFeatured(actualites));
      html = injectCms(html, "actualites-grid", renderActualitesGrid(actualites));
      return html;
    },
    "equipes.html": (html) => injectCms(html, "equipes", renderEquipes(equipes)),
    "calendrier.html": (html) => injectCms(html, "calendrier", renderCalendar(matchs)),
  };

  for (const [file, transform] of Object.entries(pages)) {
    const p = path.join(DIST, file);
    fs.writeFileSync(p, stripCmsScripts(transform(fs.readFileSync(p, "utf8"))));
    console.log(`✓ ${file}`);
  }

  // 4. Pages statiques par article, générées depuis le gabarit actualite.html
  const template = stripCmsScripts(
    fs.readFileSync(path.join(ROOT, "actualite.html"), "utf8"),
  );
  fs.mkdirSync(path.join(DIST, "actualite"), { recursive: true });
  for (const item of actualites) {
    const fm = item.frontmatter || {};
    let page = template
      // chemins relatifs -> absolus (la page vit dans /actualite/)
      .replace(/(href|src)="(css|img|js)\//g, '$1="/$2/')
      .replace(/(href)="([a-z-]+\.html)(#[a-z-]+)?"/g, '$1="/$2$3"')
      // la page est indexable, contrairement au gabarit vide
      .replace(/^\s*<meta name="robots"[^>]*>\r?\n?/m, "")
      .replace(
        /<title>[^<]*<\/title>/,
        `<title>${fm.title || "Actualité"} — Moulins-lès-Metz Handball</title>`,
      );
    page = injectCms(page, "actualite-single", renderArticleInner(item));
    fs.writeFileSync(path.join(DIST, "actualite", `${item.slug}.html`), page);
    console.log(`✓ actualite/${item.slug}.html`);
  }

  // 5. L'ancien gabarit dynamique et le JS de rendu ne sont plus servis
  fs.rmSync(path.join(DIST, "actualite.html"), { force: true });
  fs.rmSync(path.join(DIST, "js", "cms-render.js"), { force: true });

  console.log("Build terminé → dist/");
}

build();
