# AR2 Wiki Admin API — Cloudflare Workers

## Secrets à configurer (jamais dans Git)
Dans le dossier `admin-worker` :
```bash
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put SESSION_SECRET
npx wrangler secret put GITHUB_TOKEN
```
- `ADMIN_PASSWORD` : code de connexion choisi par le propriétaire.
- `SESSION_SECRET` : chaîne aléatoire longue (32 caractères minimum).
- `GITHUB_TOKEN` : fine-grained GitHub token limité à ce dépôt, avec **Contents: Read and write**.

Les variables non sensibles sont dans `wrangler.toml`. Adapter `SITE_ORIGIN` à l'origine exacte du site publié.

## Déploiement
```bash
npm install -g wrangler
npx wrangler login
npx wrangler deploy
```
Après le déploiement, copier l'URL `workers.dev` dans `API_BASE` au début de `admin.html`, puis publier cette modification sur GitHub Pages.

## Limites actuelles
Le panneau gère les armes, explosifs, soins, accessoires, sacs, nourriture et catégories du catalogue. Les lieux et marqueurs de carte demandent une intégration dédiée au modèle de carte et ne sont pas modifiés par ce premier module.
