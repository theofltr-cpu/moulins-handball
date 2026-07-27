/**
 * Serveur de connexion + API du backoffice — Moulins-lès-Metz Handball.
 *
 * Gère : authentification e-mail/mot de passe (KV USERS), sessions, lecture/écriture
 * du contenu du site via l'API GitHub, envoi d'images, et gestion des accès.
 *
 * Bindings requis :
 *   - KV  USERS                (utilisateurs + sessions)
 *   - secret GITHUB_SERVICE_TOKEN  (PAT fine-grained, accès contenu du repo)
 *
 * IMPORTANT : ce fichier est versionné dans le dépôt du site pour ne plus jamais
 * être perdu. Déploiement : `npx wrangler deploy` depuis le dossier worker/.
 */

const REPO = "theofltr-cpu/moulins-handball";
const BRANCH = "main";
const ORIGIN = "https://moulins-handball.pages.dev";
const SESSION_TTL = 60 * 60 * 24 * 30; // 30 jours

const CORS = {
  "Access-Control-Allow-Origin": ORIGIN,
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...CORS },
  });
}

/* ---------- Crypto (mots de passe / jetons) ---------- */
async function sha256hex(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function randHex(n) {
  const a = new Uint8Array(n);
  crypto.getRandomValues(a);
  return [...a].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function hashPassword(pw, salt) {
  return sha256hex(salt + ":" + pw);
}
const emailKey = (e) => "user:" + (e || "").trim().toLowerCase();

/* ---------- Sessions ---------- */
async function currentUser(request, env) {
  const t = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!t) return null;
  const email = await env.USERS.get("session:" + t);
  return email ? { email, token: t } : null;
}

/* ---------- Base64 UTF-8 (pour l'API GitHub) ---------- */
function b64encodeUtf8(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function b64decodeUtf8(b64) {
  const bin = atob((b64 || "").replace(/\s/g, ""));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

/* ---------- GitHub ---------- */
function gh(path, env, opts = {}) {
  return fetch("https://api.github.com" + path, {
    ...opts,
    headers: {
      Authorization: "Bearer " + env.GITHUB_SERVICE_TOKEN,
      Accept: "application/vnd.github+json",
      "User-Agent": "mlm-backoffice",
      ...(opts.headers || {}),
    },
  });
}
async function ghList(dir, env) {
  const r = await gh(`/repos/${REPO}/contents/${encodeURI(dir)}?ref=${BRANCH}`, env);
  if (!r.ok) return [];
  const arr = await r.json();
  return Array.isArray(arr) ? arr.filter((f) => f.name.endsWith(".md")) : [];
}
async function ghGetFile(path, env) {
  const r = await gh(`/repos/${REPO}/contents/${encodeURI(path)}?ref=${BRANCH}`, env);
  if (!r.ok) return null;
  const d = await r.json();
  return { content: b64decodeUtf8(d.content), sha: d.sha };
}
async function ghPut(path, content, message, env) {
  const existing = await ghGetFile(path, env);
  const body = { message, content: b64encodeUtf8(content), branch: BRANCH };
  if (existing) body.sha = existing.sha;
  const r = await gh(`/repos/${REPO}/contents/${encodeURI(path)}`, env, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return r.ok;
}
async function ghPutRaw(path, base64, message, env) {
  const existing = await ghGetFile(path, env);
  const body = { message, content: base64, branch: BRANCH };
  if (existing) body.sha = existing.sha;
  const r = await gh(`/repos/${REPO}/contents/${encodeURI(path)}`, env, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return r.ok;
}
async function ghDel(path, message, env) {
  const existing = await ghGetFile(path, env);
  if (!existing) return true;
  const r = await gh(`/repos/${REPO}/contents/${encodeURI(path)}`, env, {
    method: "DELETE",
    body: JSON.stringify({ message, sha: existing.sha, branch: BRANCH }),
  });
  return r.ok;
}

/* ---------- Frontmatter (pour la liste des éléments) ---------- */
function parseFm(text) {
  const m = (text || "").match(/^---\r?\n([\s\S]+?)\r?\n---/);
  const d = {};
  if (m) {
    for (const line of m[1].split(/\r?\n/)) {
      const mm = line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
      if (mm) {
        let v = mm[2].trim();
        if ((v[0] === '"' && v.endsWith('"')) || (v[0] === "'" && v.endsWith("'"))) v = v.slice(1, -1);
        d[mm[1]] = v;
      }
    }
  }
  return d;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const p = url.pathname;
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

    try {
      /* --- Connexion (pas d'auth requise) --- */
      if (p === "/api/login" && request.method === "POST") {
        const { email, password } = await request.json();
        const rec = await env.USERS.get(emailKey(email));
        if (!rec) return json({ error: "E-mail ou mot de passe incorrect." }, 401);
        const { salt, hash } = JSON.parse(rec);
        if ((await hashPassword(password || "", salt)) !== hash)
          return json({ error: "E-mail ou mot de passe incorrect." }, 401);
        const token = randHex(24);
        await env.USERS.put("session:" + token, (email || "").trim().toLowerCase(), {
          expirationTtl: SESSION_TTL,
        });
        return json({ token, email: (email || "").trim().toLowerCase() });
      }

      /* --- À partir d'ici : authentification obligatoire --- */
      if (p.startsWith("/api/")) {
        const me = await currentUser(request, env);
        if (!me) return json({ error: "Session expirée." }, 401);

        if (p === "/api/me") return json({ email: me.email });
        if (p === "/api/logout" && request.method === "POST") {
          await env.USERS.delete("session:" + me.token);
          return json({ ok: true });
        }

        /* Liste d'une collection : /api/list/<dossier> */
        const mList = p.match(/^\/api\/list\/(.+)$/);
        if (mList && request.method === "GET") {
          const files = await ghList("content/" + mList[1], env);
          const items = [];
          for (const f of files) {
            const file = await ghGetFile(f.path, env);
            items.push({ slug: f.name.replace(/\.md$/, ""), path: f.path, fields: parseFm(file ? file.content : "") });
          }
          return json({ items });
        }

        /* Lire un fichier */
        if (p === "/api/file" && request.method === "GET") {
          const file = await ghGetFile(url.searchParams.get("path"), env);
          if (!file) return json({ error: "Fichier introuvable." }, 404);
          return json({ content: file.content });
        }
        /* Écrire / créer un fichier */
        if (p === "/api/file" && request.method === "PUT") {
          const { path, content } = await request.json();
          const ok = await ghPut(path, content, `Édition ${path} via backoffice`, env);
          return ok ? json({ ok: true }) : json({ error: "Échec de l'enregistrement." }, 500);
        }
        /* Supprimer un fichier */
        if (p === "/api/file" && request.method === "DELETE") {
          const path = url.searchParams.get("path");
          const ok = await ghDel(path, `Suppression ${path} via backoffice`, env);
          return ok ? json({ ok: true }) : json({ error: "Échec de la suppression." }, 500);
        }

        /* Envoi d'image */
        if (p === "/api/upload" && request.method === "POST") {
          const { filename, dataBase64 } = await request.json();
          if (!filename || !dataBase64) return json({ error: "Fichier manquant." }, 400);
          const clean = filename
            .normalize("NFD").replace(/[̀-ͯ]/g, "")
            .toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "");
          const dot = clean.lastIndexOf(".");
          const base = dot > 0 ? clean.slice(0, dot) : clean;
          const ext = dot > 0 ? clean.slice(dot) : ".jpg";
          let target = `img/uploads/${base}${ext}`;
          if (await ghGetFile(target, env)) target = `img/uploads/${base}-${Date.now().toString(36)}${ext}`;
          const ok = await ghPutRaw(target, dataBase64, `Photo ${target} via backoffice`, env);
          return ok ? json({ path: "/" + target }) : json({ error: "Échec de l'envoi de l'image." }, 500);
        }

        /* --- Gestion des accès --- */
        if (p === "/api/users" && request.method === "GET") {
          const list = await env.USERS.list({ prefix: "user:" });
          const emails = list.keys.map((k) => k.name.replace(/^user:/, ""));
          return json({ users: emails, me: me.email });
        }
        if (p === "/api/users" && request.method === "POST") {
          const { email, password } = await request.json();
          const e = (email || "").trim().toLowerCase();
          if (!e || !/.+@.+\..+/.test(e)) return json({ error: "E-mail invalide." }, 400);
          if (!password || password.length < 6) return json({ error: "Mot de passe : 6 caractères minimum." }, 400);
          const salt = randHex(8);
          await env.USERS.put(emailKey(e), JSON.stringify({ salt, hash: await hashPassword(password, salt) }));
          return json({ ok: true });
        }
        if (p === "/api/users" && request.method === "DELETE") {
          const e = (url.searchParams.get("email") || "").trim().toLowerCase();
          if (e === me.email) return json({ error: "Vous ne pouvez pas supprimer votre propre compte." }, 400);
          await env.USERS.delete(emailKey(e));
          return json({ ok: true });
        }

        return json({ error: "Route inconnue." }, 404);
      }

      return new Response("Moulins-lès-Metz Handball — API backoffice.", {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    } catch (e) {
      return json({ error: e.message || "Erreur serveur." }, 500);
    }
  },
};
