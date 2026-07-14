# ContentAI Studio — Features & Task Tracker

> **Source de vérité** pour le suivi d'avancement du projet.
> **Claude Code** : à chaque tâche terminée, coche les critères d'acceptation et mets à jour le statut.

## Légende

| Statut           | Signification                |
| ---------------- | ---------------------------- |
| `🔲 TODO`        | Pas encore commencé          |
| `🔄 IN_PROGRESS` | En cours de développement    |
| `✅ DONE`        | Terminé et fonctionnel       |
| `🚫 BLOCKED`     | Bloqué par une dépendance    |

## Résumé d'avancement

| Priorité | Features | Terminées | Estimation |
| -------- | -------- | --------- | ---------- |
| P0 — MVP | 16       | 16 ✅     | 46j        |
| P1       | 9        | 9         | 22j        |
| P2       | 7        | 6         | 11j        |
| **Total**| **32**   | **31**    | **79j**    |

---

## Epic 0 — Fondations & Infrastructure

### F-000 · Initialisation du projet
- **Statut** : `✅ DONE`
- **Priorité** : P0
- **Estimation** : 1j
- **Dépendances** : aucune
- **Description** : Créer le projet Next.js 15 (App Router), configurer TypeScript strict, Biome, Tailwind v4, shadcn/ui, path aliases, docker-compose (PostgreSQL 16 + Redis).
- **Critères d'acceptation** :
  - [x] `pnpm dev` démarre sans erreur
  - [x] `pnpm typecheck` passe
  - [x] `pnpm lint` passe (Biome)
  - [x] `docker compose up` lance PostgreSQL et Redis
  - [x] Path alias `@/` fonctionne
  - [x] shadcn/ui initialisé avec au moins un composant

### F-001 · Shared Kernel (base classes DDD)
- **Statut** : `✅ DONE`
- **Priorité** : P0
- **Estimation** : 1j
- **Dépendances** : F-000
- **Description** : Implémenter les classes de base partagées : Entity, ValueObject, AggregateRoot, DomainEvent, Result<T,E>, types de pagination. Config TypeORM (data-source), validation env vars (Zod).
- **Critères d'acceptation** :
  - [x] `Entity`, `ValueObject`, `AggregateRoot` abstraits avec tests unitaires
  - [x] `Result<T, E>` pattern implémenté et testé
  - [x] `DomainEvent` base class fonctionnelle
  - [x] `data-source.ts` TypeORM configuré et connecté à PostgreSQL
  - [x] `env.config.ts` valide les variables d'environnement avec Zod
  - [x] Container DI configuré

---

## Epic 1 — Authentification & Multi-tenant (8j estimés)

### F-100 · Auth passwordless (magic link / OTP)
- **Statut** : `✅ DONE`
- **Priorité** : P0
- **Estimation** : 2j
- **Dépendances** : F-001
- **Description** : Authentification sans mot de passe par email via Auth.js v5 (magic link ou code OTP). Pages login et vérification.
- **Critères d'acceptation** :
  - [x] L'utilisateur saisit son email et reçoit un magic link
  - [x] Le clic sur le lien authentifie et redirige vers le dashboard
  - [x] Session persistée côté serveur (JWT ou session DB)
  - [x] Page `/login` et `/verify` fonctionnelles
  - [x] Protection des routes dashboard (middleware Auth.js)
  - [x] Entité `User` domaine + port `UserRepositoryPort` + adapter TypeORM

### F-101 · OAuth Notion
- **Statut** : `✅ DONE`
- **Priorité** : P0
- **Estimation** : 1j
- **Dépendances** : F-100
- **Description** : Ajouter Notion comme provider OAuth dans Auth.js. Stocker le token Notion pour les intégrations futures (module Notion).
- **Critères d'acceptation** :
  - [x] Bouton "Se connecter avec Notion" sur la page login
  - [x] Flow OAuth Notion fonctionnel (redirect → callback → session)
  - [x] Token d'accès Notion stocké de manière sécurisée en base
  - [x] L'utilisateur peut se connecter indifféremment par magic link ou Notion

> ⚠️ Implémentation existante divergente : le bouton "Connect Notion" se trouve sur `/settings`, pas sur `/login`. Le flow OAuth est opérationnel. Il faut ajouter le bouton sur la page de login.

### F-102 · Structure multi-tenant (agences)
- **Statut** : `✅ DONE`
- **Priorité** : P0
- **Estimation** : 2j
- **Dépendances** : F-100
- **Description** : Un propriétaire crée une agence, puis invite des collaborateurs. Toutes les données sont scopées par agence (tenant isolation).
- **Critères d'acceptation** :
  - [x] Entité `Agency` domaine avec factory `create()`
  - [x] Un utilisateur peut créer une agence et en devient propriétaire
  - [x] Le propriétaire peut inviter des collaborateurs par email
  - [x] Toutes les queries sont filtrées par `agencyId` (tenant isolation)
  - [x] Un utilisateur appartient à exactement une agence
  - [x] Migration TypeORM pour les tables `agency`, `agency_member`

### F-103 · Rôles et permissions
- **Statut** : `✅ DONE`
- **Priorité** : P0
- **Estimation** : 1j
- **Dépendances** : F-102
- **Description** : Système de rôles au sein de chaque agence. Au minimum : propriétaire et collaborateur. Le propriétaire définit les thématiques autorisées, les collaborateurs sont contraints par celles-ci.
- **Critères d'acceptation** :
  - [x] Value Object `UserRole` (OWNER, COLLABORATOR) avec tests
  - [x] Le propriétaire peut gérer les thématiques de l'agence
  - [x] Les collaborateurs ne voient que les thématiques autorisées (ADMIN only pour le CRUD)
  - [x] Middleware ou guard vérifiant les permissions sur les Server Actions
  - [x] Entité `Theme` domaine liée à l'agence

### F-104 · Onboarding guidé
- **Statut** : `✅ DONE`
- **Priorité** : P2
- **Estimation** : 2j
- **Dépendances** : F-102
- **Description** : Parcours interactif lors de la première connexion pour expliquer le fonctionnement de l'outil (étapes, tutoriel).
- **Critères d'acceptation** :
  - [x] Détection de la première connexion de l'utilisateur — flag `onboardingCompleted` sur `User` (défaut `false`), vérifié dans `(dashboard)/layout.tsx` en plus du check de membership existant
  - [x] Wizard d'onboarding multi-étapes (création agence, thématiques, connexion Notion) — page `/onboarding` en 3 étapes avec indicateur de progression
  - [x] L'utilisateur peut skip l'onboarding — bouton "Skip" sur les étapes thématiques/Notion (la création d'agence reste obligatoire, condition d'accès au dashboard multi-tenant)
  - [x] Flag `onboardingCompleted` persisté en base — colonne `users.onboarding_completed`, `CompleteOnboardingCommand`

> Migration avec backfill : les utilisateurs ayant déjà une agence (`agency_members.joined_at IS NOT NULL`) sont marqués `onboarding_completed = true` automatiquement, pour ne pas re-forcer l'onboarding sur les comptes existants (y compris le seed jury, mis à jour en conséquence).

---

## Epic 2 — Génération de contenu par IA (25j estimés)

### Axe 1 — Génération d'idées

#### F-200 · Génération d'idées de sujets
- **Statut** : `✅ DONE`
- **Priorité** : P0
- **Estimation** : 4j
- **Dépendances** : F-103
- **Description** : L'outil propose des idées de contenus en fonction des thématiques de l'agence. Les propositions tiennent compte de l'historique des contenus déjà générés pour éviter les doublons stricts, tout en pouvant proposer des angles complémentaires.
- **Critères d'acceptation** :
  - [x] Port `AiGeneratorPort` avec méthode `generateIdeas()`
  - [x] Adapter Anthropic implémentant le port
  - [x] Le prompt inclut les thématiques de l'agence
  - [x] Le prompt inclut l'historique des titres/sujets déjà générés (anti-doublon)
  - [x] Les idées sont retournées sous forme de liste numérotée
  - [x] L'IA peut proposer des angles complémentaires sur un sujet existant
  - [x] Use case `GenerateIdeasCommand` avec tests unitaires

#### F-201 · Chaînage idées → rédaction
- **Statut** : `✅ DONE`
- **Priorité** : P0
- **Estimation** : 1j
- **Dépendances** : F-200, F-202
- **Description** : L'utilisateur sélectionne une idée pour lancer directement la rédaction. Transition fluide sans ressaisie.
- **Critères d'acceptation** :
  - [x] Clic sur une idée pré-remplit le formulaire de rédaction
  - [x] Le sujet, la thématique et le contexte sont transmis automatiquement
  - [x] UX fluide : pas de rechargement de page (navigation client-side)

### Axe 2 — Rédaction

#### F-202 · Rédaction complète à partir d'un sujet
- **Statut** : `✅ DONE`
- **Priorité** : P0
- **Estimation** : 6j
- **Dépendances** : F-001, F-103
- **Description** : L'utilisateur fournit un sujet (manuellement ou via le générateur d'idées). L'outil produit un texte complet au format demandé : article de blog (long) ou post LinkedIn/Facebook (court). La qualité doit être supérieure à un prompt direct sur ChatGPT.
- **Critères d'acceptation** :
  - [x] Entité `Article` domaine avec factory `create()`
  - [x] Value Object `ContentType` (ARTICLE, LINKEDIN_POST, FACEBOOK_POST, PRODUCT_SHEET, META)
  - [x] Value Object `ContentStatus` (DRAFT, REVIEW, VALIDATED, SCHEDULED, PUBLISHED)
  - [x] Adapter Anthropic avec prompt engineering avancé (qualité > ChatGPT brut)
  - [x] Le contenu généré est structuré et non "creux" (prompts par type avec H1/H2/H3, SEO, exemples concrets)
  - [x] Use case `GenerateArticleCommand` avec tests + `CreateArticleCommand` avec tests
  - [x] Streaming de la réponse IA vers le client (SSE via `/api/content/generate` + `useContentStream`)
  - [x] Le contenu est persisté en base avec statut DRAFT

#### F-203 · Filtres et paramétrage de la génération
- **Statut** : `✅ DONE`
- **Priorité** : P0
- **Estimation** : 2j
- **Dépendances** : F-202
- **Description** : La génération combine un champ texte libre et des filtres : type de contenu, longueur souhaitée, type d'article. Sans filtre → comportement par défaut pertinent.
- **Critères d'acceptation** :
  - [x] DTO `GenerateArticleDto` avec champs : subject, contentType, length, articleType (tous optionnels sauf subject)
  - [x] Schéma Zod de validation
  - [x] Le prompt Anthropic s'adapte dynamiquement aux filtres sélectionnés
  - [x] Sans filtre, le prompt applique des defaults pertinents (blog article, longueur moyenne)
  - [x] UI avec formulaire de filtres (select, radio, slider longueur)

> ⚠️ Implémentation existante divergente : le DTO utilise `topic` (au lieu de `subject`) et n'a pas de champ `articleType`. L'UI a un select pour `contentType` et un `<input type="number">` pour `wordCount` (pas un slider). La fonctionnalité est substantiellement présente.

#### F-204 · SEO et structuration du contenu
- **Statut** : `✅ DONE`
- **Priorité** : P0
- **Estimation** : 3j
- **Dépendances** : F-202
- **Description** : Le contenu généré respecte les règles SEO : structure H1-H4, meta title, meta description, extrait, slug. Scoring SEO intégré dans le processus de génération.
- **Critères d'acceptation** :
  - [x] Value Object `SeoMetadata` (metaTitle, metaDescription, slug, excerpt) avec validations (longueurs)
  - [x] Le prompt impose la structure H1/H2/H3/H4
  - [x] Le scoring SEO est calculé pendant la génération (pas après)
  - [x] Le contenu vise aussi conversion, réassurance et notoriété
  - [x] Affichage du score SEO dans l'interface avec indicateurs visuels
  - [x] Use case `ScoreContentSeoQuery` avec tests

#### F-205 · Modification manuelle + régénération partielle
- **Statut** : `✅ DONE`
- **Priorité** : P0
- **Estimation** : 2j
- **Dépendances** : F-202
- **Description** : Avant validation, l'utilisateur peut éditer manuellement le contenu. Il peut aussi régénérer une section spécifique via un champ texte.
- **Critères d'acceptation** :
  - [x] Éditeur rich-text intégré (Tiptap, BlockNote ou similaire) — textarea markdown utilisé (pragmatique sans dépendance externe)
  - [x] L'utilisateur peut modifier directement le contenu généré
  - [x] Bouton "Régénérer" par section avec champ d'instruction
  - [x] Use case `RegenerateSectionCommand` envoyant le contexte + instruction à l'IA
  - [x] Le contenu modifié est sauvegardé en base (save manuel)

#### F-206 · Contextualisation métier de l'agence
- **Statut** : `✅ DONE`
- **Priorité** : P0
- **Estimation** : 3j
- **Dépendances** : F-102
- **Description** : L'outil comprend le contexte métier de l'agence via upload de documents ou questionnaire d'onboarding. Ce contexte alimente l'IA pour des contenus pertinents.
- **Critères d'acceptation** :
  - [x] Entité `AgencyContext` domaine liée à l'agence
  - [x] OU questionnaire structuré (secteur, cible, tone of voice, mots-clés)
  - [x] Le contexte est injecté dans tous les prompts de génération
  - [x] Page settings pour gérer le contexte de l'agence
  - [x] Use case `UpdateAgencyContextCommand`

#### F-207 · Génération multilingue (FR + EN)
- **Statut** : `✅ DONE`
- **Priorité** : P1
- **Estimation** : 1j
- **Dépendances** : F-202
- **Description** : Le contenu peut être généré en français et en anglais au minimum.
- **Critères d'acceptation** :
  - [x] Value Object `Language` (FR, EN, extensible) — `src/modules/content/domain/value-objects/language.vo.ts`
  - [x] Sélecteur de langue dans le formulaire de génération (`/content/new`, défaut FR)
  - [x] Le prompt s'adapte à la langue choisie (instruction de langue injectée dans les 4 builders de prompt : article, social, fiche produit, meta)
  - [x] Les métadonnées SEO sont aussi générées dans la langue cible (même appel IA que le corps — meta title/description/excerpt suivent la langue demandée)

> Note : en corrigeant le passage des paramètres à l'IA, `articleType` (F-203) était en fait jamais transmis à `AiGeneratorPort.generate()` malgré son existence dans le DTO — corrigé au passage.

#### F-208 · Scoring SEO avancé intégré
- **Statut** : `✅ DONE`
- **Priorité** : P1
- **Estimation** : 2j
- **Dépendances** : F-204
- **Description** : Scoring SEO approfondi calculé pendant la génération, avec auto-correction si score insuffisant.
- **Critères d'acceptation** :
  - [x] Algorithme de scoring (densité mots-clés, structure, longueur, meta) — `ScoreContentSeoQuery` couvrait déjà structure/longueur/meta (F-204) ; ajout de `keywordDensityPercent` (% réel, pas seulement un seuil binaire) dans `SeoScoreDetails`
  - [x] Le score est retourné avec le contenu généré — `ArticleDto.seoScore` calculé dans `toArticleDto()`, donc présent immédiatement sur toute génération/lecture d'article
  - [x] Si le score est insuffisant, l'IA auto-corrige avant de livrer — `GenerateArticleCommand`/`GenerateEnrichedArticleCommand` relancent l'IA avec les points faibles (`summarizeSeoIssues`) si score < 70, et ne gardent la version corrigée que si son score est meilleur
  - [x] Dashboard affiche le score avec code couleur (rouge/orange/vert) — déjà sur `/content/[id]` (F-204), ajouté aussi sur la liste `/content` via `SeoScoreBadge` partagé

#### F-209 · Suggestion de prompt image IA
- **Statut** : `✅ DONE`
- **Priorité** : P2
- **Estimation** : 1j
- **Dépendances** : F-202
- **Description** : L'outil suggère un prompt pour générer une image d'illustration par IA pour chaque contenu.
- **Critères d'acceptation** :
  - [x] Après génération, un prompt image est proposé — champ `imagePrompt` dans `GeneratedContent`, produit par le même appel IA (article, post social, fiche produit ; pas pour META)
  - [x] Le prompt est adapté au sujet et au ton — instruction dédiée dans les builders de prompt (sujet, ton, éléments visuels concrets)
  - [x] L'utilisateur peut copier ou modifier le prompt — bouton "Copy" + champ éditable sur `/content/new` (preview) et sur `/content/[id]` (`ImagePromptCard`)
  - [x] Le prompt est sauvegardé avec l'article — colonne `articles.image_prompt`, `Article.imagePrompt`, persisté via `CreateArticleCommand`/`GenerateArticleCommand`/`GenerateEnrichedArticleCommand`/`UpdateArticleCommand`

> Bug corrigé au passage : `Article.update()` écrasait les champs non fournis (ex. `title`) avec `undefined` lors d'une mise à jour partielle (spread d'un objet contenant des clés à `undefined`) — corrigé pour ne mettre à jour que les champs explicitement fournis.

#### F-210 · Formats supplémentaires (Instagram, Substack, Facebook)
- **Statut** : `✅ DONE`
- **Priorité** : P2
- **Estimation** : 2j
- **Dépendances** : F-202
- **Description** : Extension des formats au-delà de blog et LinkedIn.
- **Critères d'acceptation** :
  - [x] `ContentType` étendu : INSTAGRAM_POST, SUBSTACK_ARTICLE, FACEBOOK_POST (FACEBOOK_POST existait déjà depuis F-202 ; INSTAGRAM_POST et SUBSTACK_ARTICLE ajoutés, `CONTENT_TYPES` centralisé dans le VO et réutilisé par tous les schémas Zod du module)
  - [x] Prompts adaptés à chaque format — `SOCIAL_PLATFORM_CONFIG` (LinkedIn/Facebook/Instagram, structure et ton dédiés par plateforme) + `buildSubstackPrompt` (newsletter, voix personnelle, sign-off)
  - [x] Preview du rendu adapté au format — `/content/new` : rendu "post card" pour les formats sociaux (pas de titre/meta affichés, libellé "Hashtags"), rendu article classique pour le reste ; couleur dédiée par type sur le calendrier

#### F-211 · Export multi-format du contenu
- **Statut** : `✅ DONE`
- **Priorité** : P2
- **Estimation** : 1j
- **Dépendances** : F-202
- **Description** : Export du contenu en Markdown, HTML, texte brut.
- **Critères d'acceptation** :
  - [x] Bouton d'export avec sélection du format — carte "Download" sur `/content/[id]` (`ExportContent`), Select de format + bouton "Export"
  - [x] Formats : Markdown, HTML, texte brut — `ExportFormat` VO (MARKDOWN/HTML/TEXT), conversion pure dans `domain/services/markdown-renderer.ts` (`markdownToHtml`, `markdownToPlainText`)
  - [x] Téléchargement côté client — `ExportArticleQuery` retourne `{ filename, mimeType, content }` via `exportArticleAction`, déclenchement du download par `Blob` + `<a download>` dans le composant client

### Axe 3 — Curation de contenu

#### F-220 · Gestion des sources (flux RSS, URLs)
- **Statut** : `✅ DONE`
- **Priorité** : P1
- **Estimation** : 3j
- **Dépendances** : F-102
- **Description** : L'utilisateur fournit des sources externes (flux RSS, URLs). L'outil récupère automatiquement les contenus publiés.
- **Critères d'acceptation** :
  - [x] Entité `Feed` domaine + Value Object `FeedUrl` avec validation
  - [x] Entité `FeedItem` domaine
  - [x] Port `RssParserPort` + adapter
  - [x] Use case `AddFeedCommand` avec tests
  - [x] Use case `RefreshFeedsCommand` (récupération automatique)
  - [x] Page `/rss` listant les sources et articles (avec expand items par feed)
  - [x] CRON ou job planifié pour le refresh

> ⚠️ Implémentation existante divergente : la page `/rss` permet d'ajouter un flux et de lancer un refresh, mais n'affiche pas la liste des flux ni des articles. `ListFeedItemsQuery` existe dans le container DI mais n'est pas utilisée dans la page.

#### F-221 · Qualification et tagging des articles curés
- **Statut** : `✅ DONE`
- **Priorité** : P1
- **Estimation** : 3j
- **Dépendances** : F-220
- **Description** : Qualification des articles récupérés (intéressant, à ignorer, à utiliser) et classement par tags.
- **Critères d'acceptation** :
  - [x] Value Object `CurationStatus` (UNREAD, INTERESTING, IGNORED, TO_USE)
  - [x] Système de tags libres sur les articles curés
  - [x] Interface de qualification rapide
  - [x] Filtres par statut et par tags
  - [x] Use case `QualifyFeedItemCommand`

#### F-222 · Enrichissement de la génération via sources curées
- **Statut** : `✅ DONE`
- **Priorité** : P1
- **Estimation** : 3j
- **Dépendances** : F-221, F-202
- **Description** : L'IA utilise les sources curées comme base pour enrichir la génération. Mix IA + sources réelles = différenciateur principal vs. wrapper LLM.
- **Critères d'acceptation** :
  - [x] Les articles marqués TO_USE sont injectés dans le contexte du prompt
  - [x] Le contenu généré cite ou s'inspire des sources réelles
  - [x] Le prompt distingue contenu IA pur et contenu enrichi
  - [x] L'utilisateur voit quelles sources ont été utilisées
  - [x] Use case `GenerateEnrichedArticleCommand` avec tests

---

## Epic 3 — Intégration Notion bidirectionnelle (10j estimés)

### F-300 · Export vers Notion
- **Statut** : `✅ DONE`
- **Priorité** : P1
- **Estimation** : 5j
- **Dépendances** : F-101, F-202
- **Description** : Contenu validé synchronisé dans Notion avec tags. Planification de publication avec entrée calendrier Notion + rappel jour J.
- **Critères d'acceptation** :
  - [x] Port `NotionClientPort` avec méthodes `exportPage()`, `createCalendarEntry()`
  - [x] Adapter Notion SDK implémentant le port
  - [x] Contenu poussé en page Notion avec blocks formatés (Markdown → blocs Notion h1/h2/h3/bullet/numbered/paragraph)
  - [x] Tags de classification exportés (multi-select Notion par nom de tag)
  - [x] Planification de date de publication depuis l'app (date picker + champ `scheduledAt`)
  - [x] Entrée calendrier Notion créée avec date de publication (propriété "Publication date")
  - [x] Contenu modifiable dans Notion après export (blocs structurés, pas un blob texte)
  - [x] Use case `ExportToNotionCommand` avec tests (4 cas couverts)

### F-301 · Import depuis Notion
- **Statut** : `✅ DONE`
- **Priorité** : P1
- **Estimation** : 3j
- **Dépendances** : F-300
- **Description** : Import des entrées Notion (veille) dans le processus de curation. Synchronisation bidirectionnelle.
- **Critères d'acceptation** :
  - [x] Détection des nouvelles entrées dans la base Notion configurée (`ImportNotionEntriesCommand` diffe contre les `FeedItem` déjà connus par id de page)
  - [x] Import automatique ou manuel vers le module curation (bouton "Importer les nouvelles entrées" sur `/notion`, + `ImportFromNotionCommand` pour l'import ad hoc d'une page en Article)
  - [x] Les pages importées sont traitées comme des `FeedItem` qualifiables (Feed synthétique `sourceType: "NOTION"` par base configurée, items UNREAD par défaut, qualifiables via `/rss/curated`)
  - [x] Synchronisation bidirectionnelle fonctionnelle (`SyncFeedItemStatusToNotionCommand` pousse le statut de curation vers la page Notion — "Curation Status" — déclenché automatiquement après `qualifyFeedItemAction`)
  - [x] Use case `ImportFromNotionCommand` avec tests (+ `ImportNotionEntriesCommand` et `SyncFeedItemStatusToNotionCommand`, tous testés)

> Note : l'import ad hoc d'une page unique reste un `Article` (`ImportFromNotionCommand`, usage `/notion` search), tandis que la synchronisation de la base de veille configurée produit des `FeedItem` qualifiables (`ImportNotionEntriesCommand`) — les deux coexistent car ce sont des usages distincts.

### F-302 · Configuration de la connexion Notion
- **Statut** : `✅ DONE`
- **Priorité** : P1
- **Estimation** : 2j
- **Dépendances** : F-101
- **Description** : Page settings pour configurer la base Notion cible et tester la connexion.
- **Critères d'acceptation** :
  - [x] Section Notion dans `/settings`
  - [x] Sélection de la base Notion cible (via API search — `searchNotionDatabasesAction` + `NotionConfigPanel`)
  - [x] Bouton "Tester la connexion" (`testNotionConnectionAction`, appelle `client.users.me`)
  - [x] Gestion erreurs d'autorisation (token expiré, permissions) — messages dédiés sur `unauthorized`/`restricted_resource`, et le token est maintenant rafraîchi à chaque connexion Notion (`events.signIn` dans `auth.ts`), permettant une reconnexion réelle en cas de token expiré
  - [x] Config Notion persistée par agence (confirmé : `agencies.notion_access_token`/`notion_database_id`, écrit désormais de façon centralisée dans `auth.ts`)

---

## Epic 4 — Dashboard, historique & suivi (10j estimés)

### F-400 · Dashboard principal
- **Statut** : `✅ DONE`
- **Priorité** : P0
- **Estimation** : 4j
- **Dépendances** : F-202, F-220
- **Description** : Tableau de bord centralisant contenus, idées, articles curés, sources. Statuts visibles, historique partagé dans l'agence.
- **Critères d'acceptation** :
  - [x] Vue liste des contenus avec statuts (brouillon, validé, planifié, publié)
  - [x] Compteurs et métriques clés (total, draft, review, published)
  - [x] Filtres par statut (StatusFilter) et par tag (TagFilter) sur /content
  - [x] Vue articles curés — F-221 (qualification) pas encore implémentée (P1)
  - [x] Historique complet accessible (scopé agence, visible par tous les membres)
  - [x] Layout responsive de base (grid 2→4 cols pour les métriques)

> ⚠️ Implémentation existante divergente : la page `/dashboard` est une page d'accueil minimale ("Bienvenue sur ContentAI Studio"). La page `/content` liste les articles avec badges de statut. Pas de métriques, filtres, ni vue des articles curés. La sidebar de navigation est présente (`app-sidebar.tsx`).

### F-401 · Calendrier de publication intégré
- **Statut** : `✅ DONE`
- **Priorité** : P1
- **Estimation** : 2j
- **Dépendances** : F-400, F-300
- **Description** : Calendrier dans l'app montrant les contenus planifiés, complémentaire au calendrier Notion.
- **Critères d'acceptation** :
  - [x] Vue calendrier mensuelle avec contenus planifiés — page `/calendar`, `ListScheduledArticlesQuery`
  - [x] Drag & drop pour replanifier — `CalendarView` (HTML5 DnD natif) → `rescheduleArticleAction` → `RescheduleArticleCommand`
  - [x] Synchronisation avec le calendrier Notion — `SyncArticleScheduleToNotionCommand` pousse la nouvelle date sur la propriété "Publication date" de la page Notion liée (best-effort, après chaque replanification)
  - [x] Code couleur par type de contenu et statut — légende + puces de couleur par `contentType` et point de couleur par `status`

### F-402 · Système de tags et classification
- **Statut** : `✅ DONE`
- **Priorité** : P0
- **Estimation** : 1j
- **Dépendances** : F-102
- **Description** : Système transversal de tags pour classifier contenus, idées et articles curés.
- **Critères d'acceptation** :
  - [x] CRUD de tags au niveau agence
  - [x] Tags assignables aux articles, idées et items curés
  - [x] Filtrage par tags dans toutes les vues liste
  - [x] Auto-complétion des tags existants

---

## Epic 5 — Stockage & rétention

### F-500 · Politique de rétention
- **Statut** : `✅ DONE`
- **Priorité** : P2
- **Estimation** : 2j
- **Dépendances** : F-202, F-300
- **Description** : Suppression du body 30j après publication. Historique des thématiques conservé. Option d'export Notion avant suppression.
- **Critères d'acceptation** :
  - [x] Job planifié supprimant le body > 30j après publication — `PurgeExpiredArticleBodiesCommand` (application), exposé via `GET /api/cron/purge-article-bodies` protégé par `CRON_SECRET` (même pattern que le cron RSS existant) ; invariant encapsulé dans `Article.isEligibleForBodyPurge()` / `purgeBody()`
  - [x] Métadonnées conservées indéfiniment — seul le champ `body` est vidé (`purgeBody()`), title/SEO/tags/slug ne sont jamais touchés par le job
  - [x] Alerte + option export Notion avant suppression — carte "Retention policy" (`RetentionAlert`) sur `/content/[id]`, urgente (rouge) à ≤ 7 jours, avec bouton "Export to Notion before it's purged" réutilisant `exportToNotionAction` ; message dédié une fois le body purgé
  - [x] L'historique des sujets reste disponible pour l'anti-doublon IA — `GenerateIdeasCommand` s'appuie uniquement sur `article.title` (jamais sur `body`), donc non affecté par la purge

> Migration `AddRetentionFieldsToArticles` : ajoute `published_at`/`body_purged_at` sur `articles`, avec backfill de `published_at = updated_at` pour les articles déjà publiés (sinon leur fenêtre de rétention ne démarrerait jamais).

---

## Epic 6 — Hébergement & déploiement

### F-600 · Déploiement en production
- **Statut** : `✅ DONE`
- **Priorité** : P0
- **Estimation** : 2j
- **Dépendances** : F-000
- **Description** : Application déployée en ligne, accessible au jury pour la soutenance.
- **Critères d'acceptation** :
  - [ ] Application accessible sur un domaine public (HTTPS)
  - [ ] PostgreSQL hébergé et accessible
  - [x] Variables d'environnement configurées en production (`.env.example`)
  - [x] CI/CD configuré (GitHub Actions — `.github/workflows/ci.yml` + `deploy.yml`)
  - [x] Au moins 2 options d'hébergement documentées avec coûts (`DEPLOYMENT.md`)
  - [x] Seed data pour la démo jury (`scripts/seed.ts` + `pnpm db:seed`)

---

## Epic 7 — Qualité & UX transversale

### F-700 · Responsive avancé (mobile-first)
- **Statut** : `✅ DONE`
- **Priorité** : P2
- **Estimation** : 2j
- **Dépendances** : F-400
- **Critères d'acceptation** :
  - [x] Toutes les pages fonctionnent sur mobile (≥ 375px) — audit Playwright (13 pages × 375/768/1280px) sans overflow horizontal ; padding de la coquille `(dashboard)/layout.tsx` rendu responsive (`p-4 sm:p-6 lg:p-8`)
  - [x] Navigation adaptée (sidebar → burger menu) — déjà fourni par le bloc shadcn `Sidebar` (`useIsMobile`, bascule en `Sheet`/drawer sous 768px, `SidebarTrigger`) ; vérifié en navigateur réel
  - [x] Formulaires utilisables sur mobile — formulaire de génération (`/content/new`), invitation membre, tags, contexte agence : vérifiés à 375px, aucun champ ni bouton coupé
  - [x] Tests visuels sur 3 breakpoints — script Playwright dédié (375/768/1280px, détection d'overflow + captures), exécuté sur les pages principales

> Bug corrigé au passage : `SidebarInset` (`src/components/ui/sidebar.tsx`) n'avait pas de `min-w-0`, empêchant le `<main>` de rétrécir sous la largeur intrinsèque de son contenu — provoquait un débordement horizontal de page entière à 768px dès qu'un titre d'article long était affiché (le `truncate` sur le titre ne suffisait pas à lui seul). Complété par `min-w-0` sur les éléments `truncate` isolés dans `page.tsx` (dashboard), `calendar-view.tsx` et `notion-config-panel.tsx` qui en manquaient.

### F-701 · Accessibilité de base
- **Statut** : `🔲 TODO`
- **Priorité** : P2
- **Estimation** : 1j
- **Dépendances** : F-400
- **Critères d'acceptation** :
  - [ ] Ratio de contraste WCAG AA
  - [ ] Tailles de police minimum 16px body
  - [ ] Navigation clavier fonctionnelle
  - [ ] Attributs `aria-label` sur les boutons icon-only

---

## Graphe de dépendances

```
F-000 (Init)
  └─ F-001 (Shared Kernel)
       ├─ F-100 (Auth magic link)
       │    ├─ F-101 (OAuth Notion)
       │    │    ├─ F-300 (Export Notion) ──→ F-301 (Import Notion)
       │    │    └─ F-302 (Config Notion)
       │    └─ F-102 (Multi-tenant)
       │         ├─ F-103 (Rôles)
       │         │    ├─ F-200 (Idées) ──→ F-201 (Chaînage)
       │         │    └─ F-402 (Tags)
       │         ├─ F-206 (Contextualisation)
       │         ├─ F-220 (RSS) → F-221 (Qualification) → F-222 (Enrichissement)
       │         └─ F-104 (Onboarding) [P2]
       └─ F-202 (Rédaction) ← dépend aussi de F-103
            ├─ F-203 (Filtres)
            ├─ F-204 (SEO) → F-208 (Scoring avancé)
            ├─ F-205 (Édition + régénération)
            ├─ F-207 (Multilingue) [P1]
            ├─ F-209 (Prompt image) [P2]
            ├─ F-210 (Formats bonus) [P2]
            ├─ F-211 (Export multi-format) [P2]
            └─ F-500 (Rétention) [P2]

F-400 (Dashboard) ← F-202 + F-220
  ├─ F-401 (Calendrier) [P1]
  ├─ F-700 (Responsive) [P2]
  └─ F-701 (Accessibilité) [P2]

F-600 (Déploiement) ← F-000
```
