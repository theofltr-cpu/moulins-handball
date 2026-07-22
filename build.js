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

/* ---------- Réglages (jetons {{site.*}} / {{accueil.*}}) ---------- */

function readSettings(file) {
  const p = path.join(ROOT, "content", "settings", file);
  if (!fs.existsSync(p)) return {};
  const m = fs.readFileSync(p, "utf8").match(/^---\r?\n([\s\S]+?)\r?\n---/);
  return m ? yaml.load(m[1]) || {} : {};
}

function flatten(prefix, obj, out) {
  for (const [k, v] of Object.entries(obj || {})) {
    if (v && typeof v === "object") continue; // les listes (bureau, chiffres) sont rendues à part
    out[`${prefix}.${k}`] = v == null ? "" : String(v);
  }
  return out;
}

function readPage(file) {
  const p = path.join(ROOT, "content", "pages", file);
  if (!fs.existsSync(p)) return {};
  const m = fs.readFileSync(p, "utf8").match(/^---\r?\n([\s\S]+?)\r?\n---/);
  return m ? yaml.load(m[1]) || {} : {};
}

function renderBureau(list) {
  if (!Array.isArray(list) || list.length === 0) return null;
  return list
    .map(
      (p) => `
        <article class="person-card">
          <div class="person-avatar"></div>
          <h3>${p.name || ""}</h3>
          <span class="person-role">${p.role || ""}</span>
          <p>${p.note || ""}</p>
        </article>`,
    )
    .join("");
}

function renderChiffres(list) {
  if (!Array.isArray(list) || list.length === 0) return null;
  return list
    .map(
      (c) => `
        <div class="info-card">
          <div class="info-num">${c.valeur || ""}</div>
          <div class="info-label">${c.label || ""}</div>
        </div>`,
    )
    .join("");
}

function applyTokens(html, map) {
  return html.replace(/\{\{([a-z0-9_.]+)\}\}/gi, (m, key) => (key in map ? map[key] : m));
}

function listHtml(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "admin") continue; // le backoffice n'utilise pas nos jetons
    const full = path.join(dir, e.name);
    if (e.isDirectory()) listHtml(full, acc);
    else if (e.name.endsWith(".html")) acc.push(full);
  }
  return acc;
}

/* ---------- Helpers identiques à cms-render.js ---------- */

function formatDate(iso, opts) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(
    "fr-FR",
    opts || { day: "numeric", month: "long", year: "numeric" },
  );
}

function esc(s) {
  return (s == null ? "" : "" + s).replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]),
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
      const teamSlug = slugifyTeam(fm.name || `${fm.category || ""} ${fm.gender || ""}`);
      const infos = fm.coach
        ? `<span class="team-tile-info"><strong>Coach</strong> ${fm.coach}</span>`
        : "";
      return `
        <a href="/equipe/${teamSlug}.html" class="team-tile" style="text-decoration:none;color:inherit;display:block;">
          <div class="team-tile-img" style="${imgBg(fm.photo, "linear-gradient(135deg, #F26522 0%, #c44d12 100%)")}"></div>
          <div class="team-tile-content">
            <span class="team-tile-cat">${fm.championship || ""}</span>
            <h3>${fm.name || ""}</h3>
            <div class="team-tile-infos">${infos}</div>
            <span class="team-tile-link">Voir l'équipe →</span>
          </div>
        </a>
      `;
    })
    .join("");
}

function renderPartenaires(items) {
  if (!items || items.length === 0) return null;
  const sorted = items
    .slice()
    .sort((a, b) => (a.frontmatter?.order || 0) - (b.frontmatter?.order || 0));
  return sorted
    .map((item) => {
      const fm = item.frontmatter || {};
      const inner = fm.logo
        ? `<img src="${encodeURI(fm.logo)}" alt="${(fm.name || "").replace(/"/g, "&quot;")}" loading="lazy">`
        : `<span>${fm.name || ""}</span>`;
      return fm.url
        ? `<a class="sponsor-card" href="${fm.url}" target="_blank" rel="noopener" title="${(fm.name || "").replace(/"/g, "&quot;")}">${inner}</a>`
        : `<div class="sponsor-card" title="${(fm.name || "").replace(/"/g, "&quot;")}">${inner}</div>`;
    })
    .join("");
}

const MATCHS_A_VENIR =
  '<p style="grid-column:1/-1;text-align:center;color:#b8b8b8;padding:20px 0;">Le calendrier de la saison arrive bientôt. <a href="calendrier.html" style="color:#F26522;">Voir toutes les équipes →</a></p>';

function renderMatchs(items) {
  const sorted = items
    .slice()
    .sort((a, b) => new Date(a.frontmatter?.date || 0) - new Date(b.frontmatter?.date || 0));
  const upcoming = sorted
    .filter((i) => i.frontmatter?.status !== "Joué" && i.frontmatter?.date)
    .slice(0, 3);
  if (upcoming.length === 0) return MATCHS_A_VENIR;
  return upcoming
    .map((item) => {
      const fm = item.frontmatter || {};
      const dateStr = formatDate(fm.date, { weekday: "short", day: "numeric", month: "short" });
      const time = fm.date
        ? new Date(fm.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
        : "";
      const { home, away, homeIsUs } = matchInfo(fm);
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
  if (!iso) return { day: "", num: "", month: "", time: "" };
  const d = new Date(iso);
  const day = d
    .toLocaleDateString("fr-FR", { weekday: "short" })
    .replace(".", "")
    .toUpperCase();
  const num = d.toLocaleDateString("fr-FR", { day: "numeric" });
  const month = d
    .toLocaleDateString("fr-FR", { month: "short" })
    .replace(".", "")
    .toUpperCase();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return { day, num, month, time: `${hh}H${mm}` };
}

/**
 * Équipes et scores d'un match, dans l'ordre domicile/extérieur.
 * Nouveau format (backoffice) : lieu_match (Domicile/Extérieur) + adversaire
 * + score_moulins / score_adversaire. Ancien format (home_team/away_team) accepté.
 */
function matchInfo(fm) {
  const nous = "Moulins-lès-Metz";
  if (fm.adversaire !== undefined || fm.lieu_match) {
    const ext = String(fm.lieu_match || "").toLowerCase().startsWith("ext");
    const adv = fm.adversaire || "À venir";
    return {
      home: ext ? adv : nous,
      away: ext ? nous : adv,
      homeIsUs: !ext,
      homeScore: ext ? fm.score_adversaire : fm.score_moulins,
      awayScore: ext ? fm.score_moulins : fm.score_adversaire,
    };
  }
  const home = fm.home_team || nous;
  const away = fm.away_team || "À venir";
  return {
    home,
    away,
    homeIsUs: home.toLowerCase().includes("moulins"),
    homeScore: fm.home_score,
    awayScore: fm.away_score,
  };
}

function renderCalRow(item, { showScore }) {
  const fm = item.frontmatter || {};
  const { day, num, month, time } = calDateParts(fm.date);
  const { home, away, homeIsUs, homeScore, awayScore } = matchInfo(fm);
  const slug = slugifyTeam(fm.team_category);
  const dateBlock = fm.date
    ? `<span class="cal-day">${day}</span>
            <span class="cal-num">${num}</span>
            <span class="cal-month">${month}</span>
            <span class="cal-time">${time}</span>`
    : `<span class="cal-tbd">À venir</span>`;

  let middle;
  if (showScore && homeScore != null && awayScore != null) {
    const usScore = homeIsUs ? homeScore : awayScore;
    const themScore = homeIsUs ? awayScore : homeScore;
    const outcome =
      usScore > themScore ? "win" : usScore < themScore ? "loss" : "draw";
    middle = `
            <span class="cal-team${homeIsUs ? " home" : ""}">${home}</span>
            <span class="cal-score cal-score-${outcome}">${homeScore}<span class="cal-score-sep">–</span>${awayScore}</span>
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
            ${dateBlock}
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

// Regroupe des matchs par journée (J1, J2… puis Coupe, puis À programmer)
function renderJourneeGroups(matchs) {
  const isPlayed = (i) => i.frontmatter?.status === "Joué";
  const groups = new Map();
  for (const m of matchs) {
    const fm = m.frontmatter || {};
    const j = parseInt(fm.journee, 10);
    let key, label, rank;
    if (!isNaN(j) && j > 0) {
      key = "j" + j;
      label = "Journée " + j;
      rank = j;
    } else if ((fm.competition || "") === "Coupe") {
      key = "coupe";
      label = "Coupe";
      rank = 1000;
    } else {
      key = "aprog";
      label = "À programmer";
      rank = 2000;
    }
    if (!groups.has(key)) groups.set(key, { label, rank, items: [] });
    groups.get(key).items.push(m);
  }
  return [...groups.values()]
    .sort((a, b) => a.rank - b.rank)
    .map((g) => {
      const rows = g.items
        .slice()
        .sort((a, b) => new Date(a.frontmatter?.date || 0) - new Date(b.frontmatter?.date || 0))
        .map((r) => renderCalRow(r, { showScore: isPlayed(r) }))
        .join("");
      return `
        <div class="cal-group" data-cal-group>
          <h3 class="cal-group-title">${g.label}</h3>
          <div class="cal-list">${rows}
          </div>
        </div>`;
    })
    .join("");
}

// Calendrier d'UNE équipe (page équipe) : uniquement ses matchs, par journée
function renderTeamCalendar(matchs, teamSlug) {
  const mine = matchs.filter((m) => slugifyTeam(m.frontmatter?.team_category) === teamSlug);
  if (mine.length === 0) return null;
  return renderJourneeGroups(mine);
}

function renderCalendar(matchs) {
  if (matchs.length === 0) return null;
  return `
    <section class="section" data-cal-section>
      <div class="container">
        ${renderJourneeGroups(matchs)}
      </div>
    </section>
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
  const open = new RegExp(`<(article|div)[^>]*\\bdata-cms="${name}"[^>]*>`);
  const m = open.exec(pageHtml);
  if (!m) {
    console.warn(`Conteneur data-cms="${name}" introuvable`);
    return pageHtml;
  }
  const tag = m[1];
  const openEnd = m.index + m[0].length;
  // Trouver la balise fermante correspondante en comptant l'imbrication
  // (le contenu de secours peut contenir des <div> imbriqués).
  const scan = new RegExp(`<${tag}\\b[^>]*>|</${tag}>`, "g");
  scan.lastIndex = openEnd;
  let depth = 1;
  let closeStart = -1;
  let t;
  while ((t = scan.exec(pageHtml))) {
    if (t[0][1] === "/") {
      if (--depth === 0) {
        closeStart = t.index;
        break;
      }
    } else {
      depth++;
    }
  }
  if (closeStart === -1) {
    console.warn(`Conteneur data-cms="${name}" mal fermé`);
    return pageHtml;
  }
  return pageHtml.slice(0, openEnd) + html + pageHtml.slice(closeStart);
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
  const partenaires = loadCollection("partenaires");
  const clubPage = readPage("club.md");
  console.log(
    `Contenus : ${actualites.length} actu(s), ${equipes.length} équipe(s), ${matchs.length} match(s)`,
  );

  // 3. Injection dans les pages
  const pages = {
    "actualites.html": (html) => {
      const featured = actualites.find((i) => i.frontmatter?.featured) || actualites[0];
      html = injectCms(html, "actualites-featured", renderActualitesFeatured(actualites));
      html = injectCms(html, "actualites-grid", renderActualitesGrid(actualites.filter((i) => i !== featured)));
      return html;
    },
    "equipes.html": (html) => injectCms(html, "equipes", renderEquipes(equipes)),
    "club.html": (html) => {
      html = injectCms(html, "bureau", renderBureau(clubPage.bureau));
      html = injectCms(html, "chiffres", renderChiffres(clubPage.chiffres));
      html = injectCms(html, "partenaires", renderPartenaires(partenaires));
      return html;
    },
    "photos.html": (html) => html,
  };
  // Section "Nos équipes" de l'accueil : dynamique comme la page Équipes
  pages["index.html"] = (html) => {
    html = injectCms(html, "actualites-mosaic", renderHomeNewsMosaic(actualites));
    html = injectCms(html, "matchs", renderMatchs(matchs));
    html = injectCms(html, "partenaires", renderPartenaires(partenaires));
    return html;
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

  // 4b. Une page par équipe (grande photo + son calendrier), depuis equipe.html
  const equipeTpl = fs.readFileSync(path.join(ROOT, "equipe.html"), "utf8");
  fs.mkdirSync(path.join(DIST, "equipe"), { recursive: true });
  for (const item of equipes) {
    const fm = item.frontmatter || {};
    const teamSlug = slugifyTeam(fm.name || "");
    const photoStyle = fm.photo
      ? `background-image:linear-gradient(180deg,rgba(10,10,10,.35),rgba(10,10,10,.85)),url('${encodeURI(fm.photo)}');background-size:cover;background-position:center;`
      : "background:linear-gradient(135deg,#1a1a1a,#2a1a0a);";
    let page = equipeTpl
      .replace(/(href|src)="(css|img|js)\//g, '$1="/$2/')
      .replace(/(href)="([a-z-]+\.html)(#[a-z-]+)?"/g, '$1="/$2$3"')
      .replaceAll("%%NOM%%", esc(fm.name || "Équipe"))
      .replaceAll("%%CHAMP%%", esc(fm.championship || ""))
      .replaceAll("%%COACH%%", fm.coach ? "Coach : " + esc(fm.coach) : "")
      .replace("%%PHOTO_STYLE%%", photoStyle);
    page = injectCms(page, "equipe-calendrier", renderTeamCalendar(matchs, teamSlug));
    fs.writeFileSync(path.join(DIST, "equipe", `${teamSlug}.html`), page);
    console.log(`✓ equipe/${teamSlug}.html`);
  }

  // 5. Fichiers/pages qui ne sont plus servis (gabarits + ancienne page Calendrier)
  fs.rmSync(path.join(DIST, "actualite.html"), { force: true });
  fs.rmSync(path.join(DIST, "equipe.html"), { force: true });
  fs.rmSync(path.join(DIST, "calendrier.html"), { force: true });
  fs.rmSync(path.join(DIST, "js", "cms-render.js"), { force: true });

  // 6. Jetons de réglages remplacés sur TOUTES les pages (footer, bandeau, hero, stats)
  const tokenMap = {};
  flatten("site", readSettings("site.md"), tokenMap);
  flatten("accueil", readSettings("accueil.md"), tokenMap);
  tokenMap["stats.equipes"] = String(equipes.length); // nombre réel d'équipes (connecté)
  flatten("club", clubPage, tokenMap);
  tokenMap["club.histoire"] = marked.parse(clubPage.histoire || "");

  const contactPage = readPage("contact.md");
  flatten("contact", contactPage, tokenMap);
  const email = tokenMap["site.email"] || "";
  tokenMap["contact.form_open"] = contactPage.formspree
    ? `<form class="contact-form" action="${contactPage.formspree}" method="POST">`
    : `<form class="contact-form" onsubmit="event.preventDefault(); alert('Le formulaire sera bientôt actif. En attendant, écrivez-nous à ${email}.');">`;
  let tokenPages = 0;
  for (const file of listHtml(DIST)) {
    const before = fs.readFileSync(file, "utf8");
    const after = applyTokens(before, tokenMap);
    if (after !== before) {
      fs.writeFileSync(file, after);
      tokenPages++;
    }
  }
  console.log(`✓ Réglages appliqués sur ${tokenPages} page(s)`);

  console.log("Build terminé → dist/");
}

build();
