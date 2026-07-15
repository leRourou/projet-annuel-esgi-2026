# ContentAI Studio — Checklist QA (build prod locale)

Stack de prod (`docker-compose.prod.yml`) lancée en local pour cette session de QA.

## Accès

- **URL** : http://localhost:3000
- **Compte démo** : l'agence "Agence Démo" a été seedée avec 3 thématiques, 3 tags, 4 articles (statuts variés), 2 flux RSS + 4 articles curés.
  L'email du compte démo a été changé de `demo@contentai.studio` vers **axel.rouquette@outlook.fr** pour cette session, afin que le magic link Resend arrive dans une vraie boîte mail. Allez sur `/login`, saisissez cet email, un lien de connexion sera envoyé via Resend.
- **Créer une agence neuve** (pour tester l'onboarding à froid) : utilisez n'importe quelle autre adresse email sur `/login` — un nouvel utilisateur sans agence sera créé et redirigé vers `/onboarding`.
- ⚠️ Le `/debug-login` (connexion sans email, dispo en `pnpm dev`) est **désactivé** dans ce build : `next start`/standalone force `NODE_ENV=production` au runtime quel que soit `.env`. C'est le comportement réel de prod — passez par le magic link ou l'OAuth Notion.
- **Notion OAuth** : bouton "Connect Notion" sur `/settings` (pas sur `/login`, divergence connue vs. spec F-101).

---

## Parcours utilisateurs

### Parcours 1 — Nouvelle agence de bout en bout
1. `/login` avec une adresse email neuve → recevoir et cliquer le magic link
2. Redirection vers `/onboarding` → créer l'agence, définir 1-2 thématiques, (optionnel) connecter Notion ou skip
3. Arrivée sur le dashboard vide de la nouvelle agence
4. **Attendu** : aucune donnée de l'Agence Démo visible (isolation multi-tenant), wizard skippable sauf la création d'agence

### Parcours 2 — Idée → rédaction → SEO → export
1. Se connecter sur l'Agence Démo
2. `/ideas` → générer des idées de sujets à partir des thématiques existantes
3. Cliquer une idée → arrivée sur `/content/new` avec sujet/thématique pré-remplis
4. Générer un article (regarder le streaming du texte en temps réel), avec des filtres (type de contenu, longueur, langue FR/EN)
5. Sur `/content/[id]` : vérifier le score SEO affiché (couleur rouge/orange/vert), éditer le contenu, régénérer une section via instruction
6. Copier le prompt image suggéré
7. Exporter en Markdown, puis en HTML, puis en texte brut (vérifier le téléchargement du fichier à chaque fois)
8. **Attendu** : contenu structuré (H1-H3, pas "creux"), score SEO cohérent avec le contenu, export lisible dans les 3 formats

### Parcours 3 — Curation RSS → article enrichi
1. `/rss` → ajouter un flux RSS (ou utiliser les 2 flux seedés), lancer un refresh
2. `/rss/curated` → qualifier des items (Interesting / To use / Ignored), leur assigner des tags, filtrer par statut/tag
3. Retour `/content/new` → générer un article enrichi en s'appuyant sur les sources marquées "TO_USE"
4. **Attendu** : le contenu généré cite/s'inspire des sources curées, et l'app indique quelles sources ont été utilisées

### Parcours 4 — Sync Notion bidirectionnelle
1. `/settings` → section Notion : sélectionner la base cible, tester la connexion
2. `/content/[id]` d'un article validé → "Exporter vers Notion" avec planification de date
3. Vérifier dans Notion : la page créée (blocs formatés, pas un blob texte), les tags en multi-select, l'entrée calendrier avec la date
4. `/notion` → rechercher une page Notion existante, l'importer comme article (import ad hoc) ; puis "Importer les nouvelles entrées" pour synchroniser une base de veille vers la curation
5. Qualifier un item importé depuis `/rss/curated` → vérifier que le statut de curation est repoussé vers la page Notion correspondante
6. **Attendu** : sync dans les deux sens fonctionnelle, pas de doublons à ré-import

### Parcours 5 — Collaboration & permissions
1. `/settings/members` → inviter un collaborateur par email
2. Le collaborateur suit le lien `/invite/[token]`, rejoint l'agence
3. En tant que collaborateur (rôle COLLABORATOR) : vérifier qu'il ne peut gérer que les thématiques autorisées, pas le CRUD complet
4. **Attendu** : permissions respectées, données de l'agence visibles pour tous les membres (historique partagé)

### Parcours 6 — Calendrier & planification
1. `/calendar` → visualiser les contenus planifiés (code couleur par type/statut)
2. Drag & drop un article vers une autre date
3. Vérifier que la date est aussi mise à jour côté Notion (si l'article était déjà exporté)
4. **Attendu** : replanification fluide sans reload, sync Notion best-effort après le drag & drop

---

## Checklist par fonctionnalité

### Auth & multi-tenant
- [ ] Magic link : email reçu, lien valide, session créée (F-100)
- [ ] OAuth Notion depuis `/settings` (F-101)
- [ ] Création d'agence + agence unique par utilisateur (F-102)
- [ ] Rôles OWNER/COLLABORATOR : un collaborateur ne peut pas modifier les thématiques (F-103)
- [ ] Onboarding : wizard multi-étapes, skip sur thématiques/Notion, agence obligatoire (F-104)

### Génération de contenu
- [ ] Idées générées cohérentes avec les thématiques + anti-doublon vs. articles existants (F-200)
- [ ] Clic sur une idée pré-remplit `/content/new` sans reload (F-201)
- [ ] Rédaction complète, streaming visible, contenu structuré et non générique (F-202)
- [ ] Filtres (type, longueur) influencent réellement le rendu ; comportement par défaut sans filtre (F-203)
- [ ] Structure H1-H4, meta title/description, score SEO calculé pendant la génération (F-204)
- [ ] Édition manuelle sauvegardée ; régénération d'une section via instruction (F-205)
- [ ] Contexte agence (secteur, cible, ton) injecté et influence le contenu généré (F-206)
- [ ] Génération FR et EN, métadonnées SEO aussi traduites (F-207)
- [ ] Score SEO avec code couleur sur `/content` et `/content/[id]`, auto-correction si score < 70 (F-208)
- [ ] Prompt image généré, copiable/éditable, sauvegardé (F-209)
- [ ] Formats Instagram / Substack / Facebook / LinkedIn avec preview adaptée (F-210)
- [ ] Export Markdown / HTML / texte brut, téléchargement déclenché (F-211)

### Curation RSS
- [ ] Ajout de flux + refresh récupère des items (F-220)
- [ ] Qualification (Interesting/Ignored/To use) + tags + filtres (F-221)
- [ ] Sources TO_USE injectées dans la génération enrichie, sources utilisées visibles (F-222)

### Intégration Notion
- [ ] Export article → page Notion avec blocs formatés + tags + entrée calendrier (F-300)
- [ ] Import page Notion → article ; import veille → items curables ; sync statut curation → Notion (F-301)
- [ ] Sélection base cible, test de connexion, gestion erreur token expiré (F-302)

### Dashboard & organisation
- [ ] Liste des contenus avec statuts, filtres par statut/tag (F-400)
- [ ] Calendrier mensuel, drag & drop replanification, sync Notion, code couleur (F-401)
- [ ] CRUD tags transversal (contenus/idées/curation), autocomplétion (F-402)

### Rétention & conformité
- [ ] Alerte de rétention sur un article publié proche de 30j (bandeau rouge ≤ 7j), bouton export Notion avant purge (F-500)
  — difficile à tester en direct (fenêtre de 30j) : vérifier au moins que l'alerte n'apparaît PAS sur un article publié récemment, et que les métadonnées (title/SEO/tags) restent visibles indépendamment du body

### Responsive
- [ ] Pages clés utilisables à 375px, 768px, 1280px sans overflow horizontal (F-700)
- [ ] Sidebar → menu burger sous 768px

---

## Hors périmètre pour cette session

- **F-701 (Accessibilité)** — statut `TODO`, non implémenté, rien à tester
- **F-600 (domaine public HTTPS + Postgres hébergé)** — non applicable en local ; testé séparément via `docker-compose.prod.yml` + Caddy sur un vrai VPS/domaine
- **Stripe** — clé en mode test (`sk_test_...`), webhook non testable sans un vrai événement Stripe ou `stripe trigger`

## Divergences connues (ne pas remonter comme bugs)

- Bouton Notion OAuth sur `/settings`, pas `/login` (F-101)
- DTO de génération utilise `topic` au lieu de `subject`, pas de champ `articleType` visible, longueur en `<input type="number">` plutôt qu'un slider (F-203)
- Éditeur de contenu = textarea markdown, pas un rich-text (Tiptap/BlockNote) (F-205)
- `/rss` n'affiche pas la liste des flux/articles au chargement initial (F-220)
- `/dashboard` est une page d'accueil minimale ; les métriques/filtres/vue curation vivent sur `/content` (F-400)
