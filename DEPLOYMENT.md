# ContentAI Studio — Guide de déploiement

## Option 1 : Vercel + Neon (recommandée — gratuit pour la démo)

**Coût estimé :** 0 €/mois sur les tiers gratuits

### Infrastructure
| Service | Rôle | Coût |
|---------|------|------|
| [Vercel](https://vercel.com) | Hébergement Next.js (Hobby plan) | Gratuit |
| [Neon](https://neon.tech) | PostgreSQL serverless | Gratuit (0,5 GB) |
| [Upstash](https://upstash.com) | Redis (sessions) | Gratuit (10 000 req/jour) |

### Étapes

1. **Neon — base de données**
   ```
   1. Créer un compte sur neon.tech
   2. Nouveau projet → copier la DATABASE_URL
   3. Lancer les migrations :
      DATABASE_URL=<neon-url> pnpm db:migrate
   4. Lancer le seed :
      DATABASE_URL=<neon-url> pnpm db:seed
   ```

2. **Vercel — déploiement**
   ```bash
   pnpm dlx vercel login
   pnpm dlx vercel --prod
   ```

3. **Variables d'environnement sur Vercel**
   Depuis le dashboard Vercel → Settings → Environment Variables :
   ```
   DATABASE_URL          → URL Neon copiée ci-dessus
   AUTH_SECRET           → openssl rand -base64 32
   AUTH_URL              → https://votre-app.vercel.app
   ANTHROPIC_API_KEY     → sk-ant-...
   AUTH_NOTION_ID        → (optionnel pour la démo)
   AUTH_NOTION_SECRET    → (optionnel pour la démo)
   AUTH_RESEND_KEY       → (optionnel — magic link désactivé sans clé)
   NEXT_PUBLIC_APP_URL   → https://votre-app.vercel.app
   NODE_ENV              → production
   ```

4. **CI/CD GitHub Actions** (optionnel)
   Ajouter les secrets GitHub :
   - `VERCEL_TOKEN` — depuis vercel.com/account/tokens
   - `VERCEL_ORG_ID` — depuis `.vercel/project.json` après `vercel link`
   - `VERCEL_PROJECT_ID` — idem
   - `ANTHROPIC_API_KEY` — pour les tests

### Avantages / Limites
- ✅ Déploiement en < 5 minutes
- ✅ HTTPS automatique, CDN mondial
- ✅ Preview deployments sur chaque PR
- ⚠️ Neon gratuit limité à 0,5 GB et se met en veille après inactivité
- ⚠️ Vercel Hobby interdit l'usage commercial

---

## Option 2 : Railway (tout-en-un — ~5 €/mois)

**Coût estimé :** 5–15 €/mois selon l'usage

### Infrastructure
| Service | Rôle | Coût |
|---------|------|------|
| [Railway](https://railway.app) | Next.js + PostgreSQL + Redis | ~5 €/mois |

Railway héberge l'app, la base de données et Redis dans un seul environnement.

### Étapes

1. **Créer un projet Railway**
   ```
   1. Aller sur railway.app → New Project
   2. Deploy from GitHub repo → sélectionner le repo
   3. Add Plugin → PostgreSQL → copier DATABASE_URL
   4. Add Plugin → Redis → copier REDIS_URL
   ```

2. **Configurer les variables d'environnement**
   Dans Railway → Variables → ajouter les mêmes vars que l'option Vercel.

3. **Lancer les migrations**
   ```bash
   # En local avec la DATABASE_URL Railway
   DATABASE_URL=<railway-url> pnpm db:migrate
   DATABASE_URL=<railway-url> pnpm db:seed
   ```

4. **Déploiement**
   Railway déploie automatiquement à chaque push sur `main`.

### Avantages / Limites
- ✅ Tout-en-un (app + BDD + Redis)
- ✅ Pas de cold start (contrairement à Vercel Hobby + Neon gratuit)
- ✅ PostgreSQL persistant sans limite de stockage sur les plans payants
- ⚠️ Pas de plan gratuit permanent (5 $ de crédit offerts à l'inscription)
- ⚠️ Moins adapté au scaling horizontal massif

---

## Option 3 : Self-hosted 100% Docker (VPS) — ~4–6 €/mois

**Coût estimé :** prix d'un petit VPS (Hetzner, OVH, Scaleway…), aucun service tiers requis.

### Infrastructure
Tout tourne dans `docker-compose.prod.yml` sur un unique VPS :

| Service | Rôle |
|---------|------|
| `app` | Next.js buildé via `Dockerfile` (build multi-stage, sortie `standalone`) |
| `postgres` | Base de données |
| `redis` | Sessions |
| `caddy` | Reverse proxy + HTTPS automatique (Let's Encrypt) |
| `migrate` / `seed` | Services one-off (profil `tools`), ne tournent pas en continu |

### Prérequis
- Un VPS avec Docker + Docker Compose installés
- Un nom de domaine dont le DNS pointe vers l'IP du VPS (requis pour que Caddy obtienne un certificat HTTPS)

### Étapes

1. **Cloner le repo sur le VPS et créer `.env`**
   ```bash
   git clone <repo> && cd contentai-studio
   cp .env.example .env
   # Remplir : DATABASE_URL n'a pas besoin d'être rempli (surchargé par le compose),
   # remplir POSTGRES_*, AUTH_SECRET, AUTH_URL, ANTHROPIC_API_KEY, DOMAIN, etc.
   ```
   - `AUTH_URL` et `NEXT_PUBLIC_APP_URL` → `https://<DOMAIN>`
   - `DOMAIN` → le nom de domaine pointé vers le VPS (utilisé par Caddy)

2. **Builder et démarrer l'app + l'infra**
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```
   Caddy obtient automatiquement un certificat HTTPS pour `DOMAIN` au premier démarrage.

3. **Lancer les migrations**
   ```bash
   docker compose -f docker-compose.prod.yml --profile tools run --rm migrate
   ```

4. **Lancer le seed jury (optionnel)**
   ```bash
   docker compose -f docker-compose.prod.yml --profile tools run --rm seed
   ```

5. **Mises à jour ultérieures**
   ```bash
   git pull
   docker compose -f docker-compose.prod.yml up -d --build app
   docker compose -f docker-compose.prod.yml --profile tools run --rm migrate
   ```

### Avantages / Limites
- ✅ Aucune dépendance à un service tiers (Vercel/Neon/Railway) — tout est reproductible localement avec le même `Dockerfile`
- ✅ Pas de cold start, pas de limite de usage commercial
- ✅ HTTPS géré automatiquement par Caddy (renouvellement inclus)
- ⚠️ Vous gérez vous-même les sauvegardes de `postgres_data` (volume Docker)
- ⚠️ Pas de scaling horizontal automatique — un seul VPS

---

## Seed de démo pour le jury

```bash
# Avec les variables d'env de production configurées :
pnpm db:seed

# Compte de démo créé :
# Email : demo@contentai.studio
# (utiliser le magic link sur la page login)
```

Le seed crée :
- 1 agence "Agence Démo" avec contexte métier configuré
- 3 thématiques, 3 tags
- 4 articles aux statuts variés (draft, review, validated, published)
- 2 flux RSS + 4 articles curés (avec statuts de curation)

---

## Checklist de mise en production

- [ ] `AUTH_SECRET` généré avec `openssl rand -base64 32`
- [ ] `DATABASE_URL` pointe vers la BDD de production
- [ ] Migrations lancées (`pnpm db:migrate`)
- [ ] Seed jury lancé (`pnpm db:seed`)
- [ ] `ANTHROPIC_API_KEY` configurée
- [ ] `AUTH_URL` et `NEXT_PUBLIC_APP_URL` pointent vers le domaine public
- [ ] HTTPS actif (automatique sur Vercel/Railway, ou via Caddy sur l'option 3)
- [ ] Test du magic link email fonctionnel
- [ ] Test de génération d'un article via l'IA
