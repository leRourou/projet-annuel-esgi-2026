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
| P0 — MVP | 16       | 8         | 46j        |
| P1       | 9        | 0         | 22j        |
| P2       | 7        | 0         | 11j        |
| **Total**| **32**   | **7**     | **79j**    |

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
- **Statut** : `🔄 IN_PROGRESS`
- **Priorité** : P0
- **Estimation** : 1j
- **Dépendances** : F-100
- **Description** : Ajouter Notion comme provider OAuth dans Auth.js. Stocker le token Notion pour les intégrations futures (module Notion).
- **Critères d'acceptation** :
  - [ ] Bouton "Se connecter avec Notion" sur la page login
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
- **Statut** : `🔄 IN_PROGRESS`
- **Priorité** : P2
- **Estimation** : 2j
- **Dépendances** : F-102
- **Description** : Parcours interactif lors de la première connexion pour expliquer le fonctionnement de l'outil (étapes, tutoriel).
- **Critères d'acceptation** :
  - [ ] Détection de la première connexion de l'utilisateur
  - [ ] Wizard d'onboarding multi-étapes (création agence, thématiques, connexion Notion)
  - [ ] L'utilisateur peut skip l'onboarding
  - [ ] Flag `onboardingCompleted` persisté en base

> ⚠️ Implémentation existante divergente : la page `/onboarding` existe et permet la création d'agence (première étape), mais il n'y a pas de wizard multi-étapes, pas de détection de première connexion, pas de bouton skip, et pas de flag `onboardingCompleted`.

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
- **Statut** : `🔲 TODO`
- **Priorité** : P0
- **Estimation** : 1j
- **Dépendances** : F-200, F-202
- **Description** : L'utilisateur sélectionne une idée pour lancer directement la rédaction. Transition fluide sans ressaisie.
- **Critères d'acceptation** :
  - [ ] Clic sur une idée pré-remplit le formulaire de rédaction
  - [ ] Le sujet, la thématique et le contexte sont transmis automatiquement
  - [ ] UX fluide : pas de rechargement de page (navigation client-side)

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
- **Statut** : `🔄 IN_PROGRESS`
- **Priorité** : P0
- **Estimation** : 3j
- **Dépendances** : F-202
- **Description** : Le contenu généré respecte les règles SEO : structure H1-H4, meta title, meta description, extrait, slug. Scoring SEO intégré dans le processus de génération.
- **Critères d'acceptation** :
  - [x] Value Object `SeoMetadata` (metaTitle, metaDescription, slug, excerpt) avec validations (longueurs)
  - [ ] Le prompt impose la structure H1/H2/H3/H4
  - [ ] Le scoring SEO est calculé pendant la génération (pas après)
  - [ ] Le contenu vise aussi conversion, réassurance et notoriété
  - [ ] Affichage du score SEO dans l'interface avec indicateurs visuels
  - [ ] Use case `ScoreContentSeoQuery` avec tests

> ⚠️ Implémentation existante divergente : `SeoMetadata` valide metaTitle (≤70 chars), metaDescription (≤160 chars), slug, keywords. Le champ `excerpt` est absent. Le scoring SEO n'est pas implémenté. L'affichage de metaTitle/metaDescription/keywords est présent dans la vue article.

#### F-205 · Modification manuelle + régénération partielle
- **Statut** : `🔲 TODO`
- **Priorité** : P0
- **Estimation** : 2j
- **Dépendances** : F-202
- **Description** : Avant validation, l'utilisateur peut éditer manuellement le contenu. Il peut aussi régénérer une section spécifique via un champ texte.
- **Critères d'acceptation** :
  - [ ] Éditeur rich-text intégré (Tiptap, BlockNote ou similaire)
  - [ ] L'utilisateur peut modifier directement le contenu généré
  - [ ] Bouton "Régénérer" par section avec champ d'instruction
  - [ ] Use case `RegenerateSectionCommand` envoyant le contexte + instruction à l'IA
  - [ ] Le contenu modifié est sauvegardé en base (auto-save ou save manuel)

#### F-206 · Contextualisation métier de l'agence
- **Statut** : `🔲 TODO`
- **Priorité** : P0
- **Estimation** : 3j
- **Dépendances** : F-102
- **Description** : L'outil comprend le contexte métier de l'agence via upload de documents ou questionnaire d'onboarding. Ce contexte alimente l'IA pour des contenus pertinents.
- **Critères d'acceptation** :
  - [ ] Entité `AgencyContext` domaine liée à l'agence
  - [ ] Upload de documents de contexte (textes, PDF) stockés et indexés
  - [ ] OU questionnaire structuré (secteur, cible, tone of voice, mots-clés)
  - [ ] Le contexte est injecté dans tous les prompts de génération
  - [ ] Page settings pour gérer le contexte de l'agence
  - [ ] Use case `UpdateAgencyContextCommand`

#### F-207 · Génération multilingue (FR + EN)
- **Statut** : `🔲 TODO`
- **Priorité** : P1
- **Estimation** : 1j
- **Dépendances** : F-202
- **Description** : Le contenu peut être généré en français et en anglais au minimum.
- **Critères d'acceptation** :
  - [ ] Value Object `Language` (FR, EN, extensible)
  - [ ] Sélecteur de langue dans le formulaire de génération
  - [ ] Le prompt s'adapte à la langue choisie
  - [ ] Les métadonnées SEO sont aussi générées dans la langue cible

#### F-208 · Scoring SEO avancé intégré
- **Statut** : `🔲 TODO`
- **Priorité** : P1
- **Estimation** : 2j
- **Dépendances** : F-204
- **Description** : Scoring SEO approfondi calculé pendant la génération, avec auto-correction si score insuffisant.
- **Critères d'acceptation** :
  - [ ] Algorithme de scoring (densité mots-clés, structure, longueur, meta)
  - [ ] Le score est retourné avec le contenu généré
  - [ ] Si le score est insuffisant, l'IA auto-corrige avant de livrer
  - [ ] Dashboard affiche le score avec code couleur (rouge/orange/vert)

#### F-209 · Suggestion de prompt image IA
- **Statut** : `🔲 TODO`
- **Priorité** : P2
- **Estimation** : 1j
- **Dépendances** : F-202
- **Description** : L'outil suggère un prompt pour générer une image d'illustration par IA pour chaque contenu.
- **Critères d'acceptation** :
  - [ ] Après génération, un prompt image est proposé
  - [ ] Le prompt est adapté au sujet et au ton
  - [ ] L'utilisateur peut copier ou modifier le prompt
  - [ ] Le prompt est sauvegardé avec l'article

#### F-210 · Formats supplémentaires (Instagram, Substack, Facebook)
- **Statut** : `🔲 TODO`
- **Priorité** : P2
- **Estimation** : 2j
- **Dépendances** : F-202
- **Description** : Extension des formats au-delà de blog et LinkedIn.
- **Critères d'acceptation** :
  - [ ] `ContentType` étendu : INSTAGRAM_POST, SUBSTACK_ARTICLE, FACEBOOK_POST
  - [ ] Prompts adaptés à chaque format
  - [ ] Preview du rendu adapté au format

#### F-211 · Export multi-format du contenu
- **Statut** : `🔲 TODO`
- **Priorité** : P2
- **Estimation** : 1j
- **Dépendances** : F-202
- **Description** : Export du contenu en Markdown, HTML, texte brut.
- **Critères d'acceptation** :
  - [ ] Bouton d'export avec sélection du format
  - [ ] Formats : Markdown, HTML, texte brut
  - [ ] Téléchargement côté client

### Axe 3 — Curation de contenu

#### F-220 · Gestion des sources (flux RSS, URLs)
- **Statut** : `🔄 IN_PROGRESS`
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
  - [ ] Page `/rss` listant les sources et articles
  - [x] CRON ou job planifié pour le refresh

> ⚠️ Implémentation existante divergente : la page `/rss` permet d'ajouter un flux et de lancer un refresh, mais n'affiche pas la liste des flux ni des articles. `ListFeedItemsQuery` existe dans le container DI mais n'est pas utilisée dans la page.

#### F-221 · Qualification et tagging des articles curés
- **Statut** : `🔲 TODO`
- **Priorité** : P1
- **Estimation** : 3j
- **Dépendances** : F-220
- **Description** : Qualification des articles récupérés (intéressant, à ignorer, à utiliser) et classement par tags.
- **Critères d'acceptation** :
  - [ ] Value Object `CurationStatus` (UNREAD, INTERESTING, IGNORED, TO_USE)
  - [ ] Système de tags libres sur les articles curés
  - [ ] Interface de qualification rapide
  - [ ] Filtres par statut et par tags
  - [ ] Use case `QualifyFeedItemCommand`

#### F-222 · Enrichissement de la génération via sources curées
- **Statut** : `🔲 TODO`
- **Priorité** : P1
- **Estimation** : 3j
- **Dépendances** : F-221, F-202
- **Description** : L'IA utilise les sources curées comme base pour enrichir la génération. Mix IA + sources réelles = différenciateur principal vs. wrapper LLM.
- **Critères d'acceptation** :
  - [ ] Les articles marqués TO_USE sont injectés dans le contexte du prompt
  - [ ] Le contenu généré cite ou s'inspire des sources réelles
  - [ ] Le prompt distingue contenu IA pur et contenu enrichi
  - [ ] L'utilisateur voit quelles sources ont été utilisées
  - [ ] Use case `GenerateEnrichedArticleCommand` avec tests

---

## Epic 3 — Intégration Notion bidirectionnelle (10j estimés)

### F-300 · Export vers Notion
- **Statut** : `🔄 IN_PROGRESS`
- **Priorité** : P1
- **Estimation** : 5j
- **Dépendances** : F-101, F-202
- **Description** : Contenu validé synchronisé dans Notion avec tags. Planification de publication avec entrée calendrier Notion + rappel jour J.
- **Critères d'acceptation** :
  - [x] Port `NotionClientPort` avec méthodes `exportPage()`, `createCalendarEntry()`
  - [x] Adapter Notion SDK implémentant le port
  - [x] Contenu poussé en page Notion avec blocks formatés
  - [ ] Tags de classification exportés (thématique, statut, format)
  - [ ] Planification de date de publication depuis l'app
  - [ ] Entrée calendrier Notion créée avec rappel jour J
  - [ ] Contenu modifiable dans Notion après export
  - [ ] Use case `ExportToNotionCommand` avec tests

> ⚠️ Implémentation existante divergente : le use case s'appelle `SyncPageToNotionCommand` (pas `ExportToNotionCommand`). Il crée ou met à jour une page Notion avec titre + body. Pas de gestion des tags, ni de calendrier, ni de tests unitaires.

### F-301 · Import depuis Notion
- **Statut** : `🔄 IN_PROGRESS`
- **Priorité** : P1
- **Estimation** : 3j
- **Dépendances** : F-300
- **Description** : Import des entrées Notion (veille) dans le processus de curation. Synchronisation bidirectionnelle.
- **Critères d'acceptation** :
  - [ ] Détection des nouvelles entrées dans la base Notion configurée
  - [x] Import automatique ou manuel vers le module curation
  - [ ] Les pages importées sont traitées comme des `FeedItem` qualifiables
  - [ ] Synchronisation bidirectionnelle fonctionnelle
  - [ ] Use case `ImportFromNotionCommand` avec tests

> ⚠️ Implémentation existante divergente : `ImportFromNotionCommand` existe et importe une page Notion comme `Article` (pas comme `FeedItem`). La page `/notion` permet la recherche et l'import manuel. Pas de détection automatique, pas de sync bidirectionnelle, pas de tests.

### F-302 · Configuration de la connexion Notion
- **Statut** : `🔄 IN_PROGRESS`
- **Priorité** : P1
- **Estimation** : 2j
- **Dépendances** : F-101
- **Description** : Page settings pour configurer la base Notion cible et tester la connexion.
- **Critères d'acceptation** :
  - [x] Section Notion dans `/settings`
  - [ ] Sélection de la base Notion cible (via API search)
  - [ ] Bouton "Tester la connexion"
  - [ ] Gestion erreurs d'autorisation (token expiré, permissions)
  - [x] Config Notion persistée par agence

> ⚠️ Implémentation existante divergente : la section Notion dans `/settings` affiche le statut connecté/non connecté et un bouton "Connect Notion". Il n'y a pas de sélection de base cible ni de test de connexion. La config Notion est stockée dans le JWT (pas en base par agence).

---

## Epic 4 — Dashboard, historique & suivi (10j estimés)

### F-400 · Dashboard principal
- **Statut** : `🔄 IN_PROGRESS`
- **Priorité** : P0
- **Estimation** : 4j
- **Dépendances** : F-202, F-220
- **Description** : Tableau de bord centralisant contenus, idées, articles curés, sources. Statuts visibles, historique partagé dans l'agence.
- **Critères d'acceptation** :
  - [x] Vue liste des contenus avec statuts (brouillon, validé, planifié, publié)
  - [ ] Compteurs et métriques clés
  - [ ] Filtres par statut, type, thématique, date
  - [ ] Vue articles curés avec qualification rapide
  - [ ] Historique complet accessible aux collaborateurs de l'agence
  - [ ] Layout responsive de base

> ⚠️ Implémentation existante divergente : la page `/dashboard` est une page d'accueil minimale ("Bienvenue sur ContentAI Studio"). La page `/content` liste les articles avec badges de statut. Pas de métriques, filtres, ni vue des articles curés. La sidebar de navigation est présente (`app-sidebar.tsx`).

### F-401 · Calendrier de publication intégré
- **Statut** : `🔲 TODO`
- **Priorité** : P1
- **Estimation** : 2j
- **Dépendances** : F-400, F-300
- **Description** : Calendrier dans l'app montrant les contenus planifiés, complémentaire au calendrier Notion.
- **Critères d'acceptation** :
  - [ ] Vue calendrier mensuelle avec contenus planifiés
  - [ ] Drag & drop pour replanifier
  - [ ] Synchronisation avec le calendrier Notion
  - [ ] Code couleur par type de contenu et statut

### F-402 · Système de tags et classification
- **Statut** : `🔲 TODO`
- **Priorité** : P0
- **Estimation** : 1j
- **Dépendances** : F-102
- **Description** : Système transversal de tags pour classifier contenus, idées et articles curés.
- **Critères d'acceptation** :
  - [ ] CRUD de tags au niveau agence
  - [ ] Tags assignables aux articles, idées et items curés
  - [ ] Filtrage par tags dans toutes les vues liste
  - [ ] Auto-complétion des tags existants

---

## Epic 5 — Stockage & rétention

### F-500 · Politique de rétention
- **Statut** : `🔲 TODO`
- **Priorité** : P2
- **Estimation** : 2j
- **Dépendances** : F-202, F-300
- **Description** : Suppression du body 30j après publication. Historique des thématiques conservé. Option d'export Notion avant suppression.
- **Critères d'acceptation** :
  - [ ] Job planifié supprimant le body > 30j après publication
  - [ ] Métadonnées conservées indéfiniment
  - [ ] Alerte + option export Notion avant suppression
  - [ ] L'historique des sujets reste disponible pour l'anti-doublon IA

---

## Epic 6 — Hébergement & déploiement

### F-600 · Déploiement en production
- **Statut** : `🔲 TODO`
- **Priorité** : P0
- **Estimation** : 2j
- **Dépendances** : F-000
- **Description** : Application déployée en ligne, accessible au jury pour la soutenance.
- **Critères d'acceptation** :
  - [ ] Application accessible sur un domaine public (HTTPS)
  - [ ] PostgreSQL hébergé et accessible
  - [ ] Variables d'environnement configurées en production
  - [ ] CI/CD configuré (GitHub Actions)
  - [ ] Au moins 2 options d'hébergement documentées avec coûts
  - [ ] Seed data pour la démo jury

---

## Epic 7 — Qualité & UX transversale

### F-700 · Responsive avancé (mobile-first)
- **Statut** : `🔲 TODO`
- **Priorité** : P2
- **Estimation** : 2j
- **Dépendances** : F-400
- **Critères d'acceptation** :
  - [ ] Toutes les pages fonctionnent sur mobile (≥ 375px)
  - [ ] Navigation adaptée (sidebar → burger menu)
  - [ ] Formulaires utilisables sur mobile
  - [ ] Tests visuels sur 3 breakpoints

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
