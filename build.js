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
