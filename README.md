# ContentAI Studio

Plateforme SaaS multi-tenant qui permet aux agences marketing de produire du contenu SEO assisté par IA : articles de blog, posts pour les réseaux sociaux, fiches produit et meta descriptions.

Le contenu généré s'appuie sur une veille concurrentielle curée (flux RSS) et se synchronise dans les deux sens avec Notion.

Projet annuel ESGI 2026, réalisé avec Jérémy Poulain.

## Fonctionnalités

- Connexion sans mot de passe (magic link) ou via OAuth Notion. Onboarding en trois étapes.
- Isolation multi-tenant par agence, avec deux rôles : propriétaire et collaborateur. Invitation des membres par e-mail.
- Génération de contenu en streaming (SSE), avec score SEO calculé pendant la génération et correction automatique si le score est inférieur à 70.
- Régénération ciblée d'une section et export en Markdown, HTML ou texte brut.
- Veille RSS : qualification des articles et injection des sources retenues dans le prompt de génération.
- Synchronisation bidirectionnelle avec Notion : export des pages, import de la veille, planning.
- Calendrier de publication avec glisser-déposer.
- Workflow de statuts : `DRAFT -> REVIEW -> VALIDATED -> SCHEDULED -> PUBLISHED`.
- Purge automatique du corps des articles 30 jours après publication.

## Choix techniques

| Domaine | Choix | Raison |
|---|---|---|
| Framework | Next.js 15 (App Router, Server Actions, RSC) | Un seul framework full-stack, sans backend séparé ; moins de JavaScript côté client |
| Langage | TypeScript strict | Typage de bout en bout, du domaine jusqu'à l'interface |
| Données | PostgreSQL 16, TypeORM 0.3 | Modèle relationnel multi-tenant, migrations versionnées |
| Authentification | Auth.js v5 (Resend, OAuth Notion) | Onboarding sans friction ; le token Notion est réutilisé pour l'intégration |
| IA | SDK Anthropic | Prompt engineering spécifique à chaque type de contenu |
| Validation | Zod | Toute entrée d'une Server Action est validée avant d'atteindre un cas d'usage |
| Interface | Tailwind CSS v4, shadcn/ui | Design system cohérent et composants accessibles |
| Qualité | Biome, Vitest, Playwright | Un seul outil de lint et de format ; TDD sur le domaine ; tests E2E des parcours critiques |
| CI/CD | GitHub Actions | Typecheck, lint et tests à chaque push ; déploiement sur Vercel |

Les erreurs métier attendues sont renvoyées avec un `Result<T, E>` plutôt que par des exceptions.

## Architecture

Architecture hexagonale (ports et adapters), découpée en modules correspondant aux bounded contexts.

```
app/**/page.tsx              Présentation, sans logique métier
actions/*.actions.ts         Server Actions : validation Zod, appel du cas d'usage
modules/<module>/
  application/               Cas d'usage (commands, queries, DTO)
  domain/                    Entités, value objects, ports, événements
  infrastructure/            Adapters TypeORM, Anthropic, Notion, RSS
shared/                      Noyau commun (base du domaine, configuration, injection de dépendances)
```

Le domaine ne dépend d'aucune bibliothèque externe : toute ressource externe passe par un port et son adapter.

| Module | Responsabilité |
|---|---|
| `auth` | Utilisateurs, rôles, connexion Notion |
| `agency` | Agences, membres, invitations, thématiques |
| `content` | Génération, SEO, workflow de publication |
| `notion` | Export et import Notion |
| `rss` | Flux, parsing, curation |

## Installation

Prérequis : Node.js 22, pnpm 9, Docker.

```bash
git clone https://github.com/leRourou/projet-annuel-esgi-2026.git
cd projet-annuel-esgi-2026
cp .env.example .env          # renseigner les clés Anthropic, Resend et Notion
pnpm install
docker compose up -d          # PostgreSQL (port 5433) et Redis
pnpm db:migrate
pnpm db:seed
pnpm dev                      # http://localhost:3000
```

## Scripts

| Commande | Rôle |
|---|---|
| `pnpm typecheck` | Vérification TypeScript |
| `pnpm lint` | Lint et format avec Biome |
| `pnpm test` | Tests unitaires (Vitest) |
| `pnpm test:e2e` | Tests end-to-end (Playwright) |

## Déploiement

Trois options sont décrites dans [DEPLOYMENT.md](DEPLOYMENT.md) :

- Vercel avec Neon ;
- Railway ;
- auto-hébergement Docker avec Caddy et HTTPS automatique (`docker-compose.prod.yml`).
