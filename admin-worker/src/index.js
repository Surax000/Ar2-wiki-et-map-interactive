const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const DATA_PATH = "admin-data.js";
const DATA_PREFIX = "window.AR2_ADMIN_DATA = ";
const DATA_SUFFIX = ";";

function response(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), { status, headers: { ...JSON_HEADERS, ...extra } });
}
function cors(request, env) {
  const origin = request.headers.get("Origin");
  const allowed = origin && origin === env.SITE_ORIGIN;
  return {
    "access-control-allow-origin": allowed ? origin : env.SITE_ORIGIN,
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type, authorization",
    "vary": "Origin"
  };
}
function b64url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function fromB64url(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  return Uint8Array.from(atob(padded), c => c.charCodeAt(0));
}
async function sign(payload, secret) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload))));
}
async function issueToken(env) {
  const payload = b64url(new TextEncoder().encode(JSON.stringify({ exp: Date.now() + 60 * 60 * 1000, scope: "admin" })));
  return payload + "." + await sign(payload, env.SESSION_SECRET);
}
async function validToken(request, env) {
  const token = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const expected = await sign(parts[0], env.SESSION_SECRET);
  if (expected !== parts[1]) return false;
  try {
    const payload = JSON.parse(new TextDecoder().decode(fromB64url(parts[0])));
    return payload.scope === "admin" && payload.exp > Date.now();
  } catch { return false; }
}
function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
function validateData(data) {
  if (!data || typeof data !== "object" || !Array.isArray(data.items) || !Array.isArray(data.categories)) throw new Error("Format de données invalide.");
  if (data.items.length > 1000 || data.categories.length > 100) throw new Error("Limite de données dépassée.");
  const allowed = new Set(["weapons", "explosives", "heals", "attachments", "backpacks", "food"]);
  const ids = new Set();
  for (const item of data.items) {
    if (!item || typeof item !== "object" || !allowed.has(item.dataset)) throw new Error("Type d'objet invalide.");
    if (!/^[a-z0-9][a-z0-9-]{1,79}$/.test(item.id || "")) throw new Error("Identifiant invalide.");
    if (typeof item.name !== "string" || !item.name.trim() || item.name.length > 100) throw new Error("Nom d'objet invalide.");
    if (typeof item.category !== "string" || !item.category.trim() || item.category.length > 80) throw new Error("Catégorie invalide.");
    if (ids.has(item.dataset + ":" + item.id)) throw new Error("Identifiant en double : " + item.id);
    ids.add(item.dataset + ":" + item.id);
  }
  for (const category of data.categories) {
    if (typeof category !== "string" || !category.trim() || category.length > 80) throw new Error("Nom de catégorie invalide.");
  }
  return { version: 1, items: data.items, categories: [...new Set(data.categories.map(x => x.trim()))] };
}
async function readGitHubData(env) {
  const url = `https://raw.githubusercontent.com/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/${env.GITHUB_BRANCH}/${DATA_PATH}`;
  const res = await fetch(url, { headers: { "cache-control": "no-cache" } });
  if (!res.ok) throw new Error("Impossible de lire les données publiques GitHub.");
  const source = await res.text();
  const start = source.indexOf(DATA_PREFIX);
  const end = source.lastIndexOf(DATA_SUFFIX);
  if (start !== 0 || end < DATA_PREFIX.length) throw new Error("Fichier admin-data.js illisible.");
  return JSON.parse(source.slice(DATA_PREFIX.length, end));
}
async function publishGitHubData(data, env) {
  const api = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${DATA_PATH}`;
  const headers = { authorization: `Bearer ${env.GITHUB_TOKEN}`, accept: "application/vnd.github+json", "content-type": "application/json", "x-github-api-version": "2022-11-28", "user-agent": "AR2-Wiki-Admin" };
  const current = await fetch(api + "?ref=" + encodeURIComponent(env.GITHUB_BRANCH), { headers });
  if (!current.ok) throw new Error("Lecture GitHub impossible (" + current.status + "). Vérifie le token et ses droits Contents.");
  const file = await current.json();
  const source = DATA_PREFIX + JSON.stringify(data, null, 2) + DATA_SUFFIX + "\n";
  const bytes = new TextEncoder().encode(source);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const update = await fetch(api, {
    method: "PUT", headers,
    body: JSON.stringify({ message: "Admin Panel: mise à jour du catalogue communautaire", content: btoa(binary), sha: file.sha, branch: env.GITHUB_BRANCH })
  });
  if (!update.ok) {
    const detail = await update.text();
    throw new Error("Publication GitHub refusée (" + update.status + "): " + detail.slice(0, 250));
  }
  return await update.json();
}
export default {
  async fetch(request, env) {
    const headers = cors(request, env);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    const url = new URL(request.url);
    try {
      if (url.pathname === "/api/login" && request.method === "POST") {
        const body = await request.json();
        if (!safeEqual(body.code, env.ADMIN_PASSWORD)) return response({ error: "Code incorrect." }, 401, headers);
        return response({ token: await issueToken(env), expiresIn: 3600 }, 200, headers);
      }
      if (url.pathname === "/api/data" && request.method === "GET") {
        const data = await readGitHubData(env);
        return response(data, 200, headers);
      }
      if (url.pathname === "/api/publish" && request.method === "POST") {
        if (!(await validToken(request, env))) return response({ error: "Session expirée. Reconnecte-toi." }, 401, headers);
        const data = validateData(await request.json());
        const result = await publishGitHubData(data, env);
        return response({ ok: true, commit: result.commit && result.commit.sha, message: "Données publiées sur GitHub." }, 200, headers);
      }
      return response({ error: "Route introuvable." }, 404, headers);
    } catch (error) {
      return response({ error: error.message || "Erreur serveur." }, 500, headers);
    }
  }
};
