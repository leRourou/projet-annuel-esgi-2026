# ContentAI Studio — Vue d'ensemble du projet

> Document de référence unique : après lecture, on doit connaître le projet par cœur — sa raison d'être, ses choix techniques, et ce que peut faire un utilisateur de bout en bout.

## 1. Pitch

ContentAI Studio est une plateforme SaaS **multi-tenant** destinée aux agences marketing pour produire du contenu SEO assisté par IA (Claude/Anthropic) : articles de blog, posts réseaux sociaux, fiches produit, meta descriptions. Le contenu est enrichi par de la **veille concurrentielle curée** (flux RSS) et synchronisé avec **Notion**, outil de travail central du client.

Trois convictions produit structurent tout le reste :
1. **Qualité IA > prompt direct ChatGPT** — le prompt engineering est le cœur de la valeur, pas un détail technique.
2. **Curation = différenciateur** — mixer génération IA et sources réelles vérifiées évite l'effet "wrapper LLM creux".
3. **Notion est central**, pas une intégration bonus — l'export/import bidirectionnel doit être fluide.

---

## 2. Stack technique et justifications

| Couche | Choix | Pourquoi |
|---|---|---|
| Framework | **Next.js 15** (App Router, Server Actions, RSC) | Un seul framework full-stack : pages, API, mutations (Server Actions) sans backend séparé ; RSC réduit le JS client. |
| Langage | **TypeScript 5** strict (`any` interdit) | Sécurité de type de bout en bout, du domaine métier jusqu'à l'UI. |
| Base de données | **PostgreSQL 16** via **TypeORM 0.3** | SGBD relationnel robuste pour données multi-tenant fortement structurées (agences, rôles, contenus, statuts) ; TypeORM = migrations versionnées + repositories typés. |
| Auth | **Auth.js v5** — magic link (Resend) + OAuth Notion | Passwordless = friction d'onboarding minimale ; OAuth Notion permet de récupérer directement le token d'intégration Notion nécessaire aux exports/imports. |
| IA | **Anthropic SDK** (`claude-opus-4-6`) | Modèle Claude pour la génération de contenu, avec prompt engineering avancé par type de contenu (structuré, SEO, ton adapté). |
| Notion | `@notionhq/client` | Lecture/écriture de pages et de bases Notion (export contenu, import veille). |
| RSS | `rss-parser` | Parsing des flux de veille concurrentielle. |
| Styling | **Tailwind CSS v4** + **shadcn/ui** (thème "zinc" sobre, pas de bleu) | Design system cohérent, composants accessibles, personnalisables via variants plutôt que classes ad hoc. |
| Tests | **Vitest** (unitaire) + **Playwright** (e2e) | TDD sur le domaine/use cases ; e2e pour les parcours critiques et le responsive. |
| Lint/format | **Biome** | Un seul outil rapide pour lint + format, remplace ESLint/Prettier. |
| Paiement | Stripe (webhooks scaffoldés) | Prévu pour la monétisation SaaS, non prioritaire pour le MVP jury. |
| Infra locale | Docker Compose (PostgreSQL + Redis) | Environnement de dev reproductible ; Redis prévu pour les sessions en prod. |
| Déploiement | Vercel + Neon (gratuit, recommandé) **ou** Docker self-hosted (Caddy + HTTPS auto Let's Encrypt) | Deux options documentées avec coûts (`DEPLOYMENT.md`) pour flexibilité démo vs. prod réelle. |

### Architecture : hexagonale (Ports & Adapters) adaptée à Next.js

```
Browser / RSC
  → app/**/page.tsx            présentation pure, zéro logique métier
  → actions/*.actions.ts        Server Action : validation Zod + appel use case
  → modules/*/application/      use case (Command ou Query)
  → modules/*/domain/           entités, value objects, règles métier — ne connaît rien du framework
  → modules/*/infrastructure/   adapters TypeORM / Anthropic / Notion / RSS
```

Règles non négociables :
- Le domaine ne dépend jamais de TypeORM/Anthropic/Notion (dépendance inversée via les `ports/`).
- Toute ressource externe passe par un port + un adapter.
- Toute entrée Server Action est validée par Zod avant d'atteindre un use case.
- Result pattern (`Result<T, E>`) au lieu d'exceptions pour les erreurs métier attendues.
- Tests écrits en TDD, en particulier sur domaine et use cases (mocks des ports).

### Modules (Bounded Contexts)

| Module | Responsabilité |
|---|---|
| `auth` | Utilisateurs, rôles (OWNER/COLLABORATOR), connexion Notion OAuth |
| `agency` | Agences multi-tenant, membres, invitations, thématiques |
| `content` | Articles/posts/fiches produit — génération IA, SEO, workflow DRAFT→REVIEW→VALIDATED→SCHEDULED→PUBLISHED |
| `notion` | Export/import bidirectionnel Notion |
| `rss` | Flux RSS : abonnement, parsing, curation, qualification |

---

## 3. État d'avancement

31 des 32 features planifiées sont **✅ DONE** (seule F-701 « Accessibilité de base » reste `TODO`). Chemin critique MVP (P0) intégralement livré et déployé (F-600).

| Priorité | Total | Terminées |
|---|---|---|
| P0 (MVP) | 16 | 16 |
| P1 | 9 | 9 |
| P2 | 7 | 6 |

---

## 4. Fonctionnalités et parcours utilisateur

### 4.1 Authentification & onboarding
- Connexion **sans mot de passe** : email → magic link (Resend), ou **OAuth Notion** (bouton sur `/settings`, dont le token est réutilisé pour les intégrations).
- Première connexion → **wizard d'onboarding** en 3 étapes (création de l'agence obligatoire, thématiques, connexion Notion optionnelle, skippable sauf l'agence).
- Une agence = un tenant. Un utilisateur appartient à **exactement une agence**. Toutes les requêtes sont scopées par `agencyId` — aucune fuite de données entre tenants.
- Rôles : **OWNER** (gère thématiques, membres, contexte agence) et **COLLABORATOR** (contraint aux thématiques autorisées).
- Le propriétaire invite des collaborateurs par email (`/settings/members`, `/invite/[token]`).

### 4.2 Contextualisation métier de l'agence
- Page settings pour renseigner le contexte de l'agence (secteur, cible, tone of voice, mots-clés).
- Ce contexte est injecté dans **tous** les prompts de génération pour des contenus cohérents avec la marque.

### 4.3 Génération d'idées de sujets (`/ideas`)
- L'IA propose des idées basées sur les thématiques de l'agence, en évitant les doublons avec l'historique des titres déjà générés, tout en pouvant proposer des angles complémentaires.
- Clic sur une idée → **pré-remplit directement** le formulaire de rédaction (navigation client-side, sans ressaisie).

### 4.4 Rédaction assistée par IA (`/content/new`)
- Champ sujet libre + filtres optionnels : type de contenu, longueur, langue (FR/EN).
- Types de contenu supportés : **article de blog, LinkedIn, Facebook, Instagram, Substack, fiche produit, meta description**.
- Streaming de la génération en temps réel (SSE).
- Chaque génération produit aussi :
  - une structure SEO complète (H1-H4, meta title/description, slug, excerpt) ;
  - un **score SEO** calculé pendant la génération (pas après-coup), avec auto-correction si le score est insuffisant (< 70), codé couleur rouge/orange/vert ;
  - un **prompt d'image d'illustration** suggéré, copiable/éditable.
- Édition manuelle du contenu (markdown) avant validation, + **régénération ciblée** d'une section via une instruction texte.
- Export du contenu final en **Markdown, HTML ou texte brut**.

### 4.5 Curation de contenu (veille concurrentielle) (`/rss`, `/rss/curated`)
- Ajout de flux RSS, récupération automatique des articles (job planifié/CRON).
- Qualification rapide de chaque article : `UNREAD`, `INTERESTING`, `IGNORED`, `TO_USE`, avec tags libres et filtres par statut/tag.
- **Enrichissement** : les articles marqués `TO_USE` sont injectés dans le prompt de génération — le contenu produit s'inspire ou cite les sources réelles, et l'utilisateur voit quelles sources ont été utilisées. C'est le différenciateur clé vs. un simple wrapper LLM.

### 4.6 Intégration Notion bidirectionnelle (`/notion`)
- **Export** : contenu validé poussé en page Notion avec blocs formatés (H1/H2/H3, listes), tags multi-select, et planification de date de publication créant une entrée calendrier Notion.
- **Import** : détection des nouvelles entrées d'une base Notion de veille → traitées comme `FeedItem` qualifiables ; import ad hoc d'une page unique → devient un `Article`.
- **Synchronisation bidirectionnelle** : le statut de curation et les changements de planning sont repoussés vers Notion automatiquement.
- Configuration dans `/settings` : sélection de la base cible, test de connexion, gestion des erreurs d'autorisation (token expiré → reconnexion).

### 4.7 Dashboard & suivi (`/dashboard`, `/content`, `/calendar`)
- Vue liste des contenus avec statuts, filtres par statut/tag.
- **Calendrier de publication** mensuel avec drag & drop pour replanifier (synchronisé vers Notion), code couleur par type de contenu et statut.
- Système de **tags transversal** (CRUD au niveau agence, auto-complétion, filtrage sur toutes les vues).

### 4.8 Rétention des données
- Le corps (`body`) d'un article est automatiquement purgé **30 jours après publication** (job planifié), mais les métadonnées (titre, SEO, tags, slug) sont conservées indéfiniment — l'historique des sujets reste disponible pour l'anti-doublon IA.
- Alerte visuelle avant suppression, avec bouton d'export Notion de dernière chance.

### 4.9 Qualité transversale
- **Responsive mobile-first** validé sur 3 breakpoints (375/768/1280px), sidebar → menu burger sous 768px.
- Accessibilité de base (contraste WCAG AA, navigation clavier, aria-labels) : **non encore faite** (F-701, seule feature restante).

---

## 5. Workflow de contenu (statuts)

```
DRAFT → REVIEW → VALIDATED → SCHEDULED → PUBLISHED
```

Génération IA → édition/régénération manuelle → validation → (optionnel) planification calendrier + export Notion → publication → purge du body à J+30.

---

## 6. Déploiement

Deux options documentées dans `DEPLOYMENT.md` :
1. **Vercel + Neon + Upstash** (recommandé pour la démo) — gratuit, HTTPS auto, déploiement en < 5 min, mais Neon gratuit se met en veille après inactivité.
2. **Docker self-hosted** (`docker-compose.prod.yml` + Caddy) — HTTPS automatique via Let's Encrypt, contrôle total, adapté à une prod réelle.

CI/CD via GitHub Actions (`.github/workflows/ci.yml`, `deploy.yml`). Seed de démonstration disponible (`pnpm db:seed`).
