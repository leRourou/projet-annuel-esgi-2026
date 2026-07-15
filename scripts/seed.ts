/**
 * Script de seed pour la démo jury.
 * Usage : pnpm db:seed
 *
 * Crée des données de démonstration réalistes :
 * - 1 agence "Agence Démo"
 * - 1 utilisateur admin demo@contentai.studio
 * - 3 thématiques, 3 tags
 * - 4 articles (statuts variés)
 * - 2 flux RSS + 4 articles curés
 * - 1 contexte agence configuré
 *
 * Idempotent : ne crée rien si les données existent déjà.
 */

import "reflect-metadata";
import { AppDataSource } from "../src/shared/infrastructure/database/data-source";

const DEMO_AGENCY_SLUG = "agence-demo";
const DEMO_USER_EMAIL = "demo@contentai.studio";

async function seed() {
  console.log("🌱 Connexion à la base de données...");
  await AppDataSource.initialize();
  const qr = AppDataSource.createQueryRunner();

  try {
    // ── Vérification idempotence ──────────────────────────────────────────
    const existing = await qr.query("SELECT id FROM agencies WHERE slug = $1 LIMIT 1", [
      DEMO_AGENCY_SLUG,
    ]);
    if (existing.length > 0) {
      console.log("✅ Données de démo déjà présentes. Rien à faire.");
      return;
    }

    await qr.startTransaction();

    // ── Utilisateur ───────────────────────────────────────────────────────
    const [user] = await qr.query(
      `INSERT INTO users (email, name, role, onboarding_completed, created_at, updated_at)
       VALUES ($1, $2, 'ADMIN', true, NOW(), NOW())
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [DEMO_USER_EMAIL, "Demo Admin"],
    );
    const userId: string = user.id;
    console.log(`👤 Utilisateur créé : ${DEMO_USER_EMAIL} (${userId})`);

    // ── Agence ────────────────────────────────────────────────────────────
    const [agency] = await qr.query(
      `INSERT INTO agencies (name, slug, created_at)
       VALUES ($1, $2, NOW())
       RETURNING id`,
      ["Agence Démo", DEMO_AGENCY_SLUG],
    );
    const agencyId: string = agency.id;
    console.log(`🏢 Agence créée : Agence Démo (${agencyId})`);

    // ── Membre ADMIN (propriétaire) ──────────────────────────────────────
    await qr.query(
      `INSERT INTO agency_members (agency_id, user_id, role, joined_at, invited_by)
       VALUES ($1, $2, 'ADMIN', NOW(), $2)`,
      [agencyId, userId],
    );

    // ── Contexte agence ───────────────────────────────────────────────────
    await qr.query(
      `INSERT INTO agency_contexts (agency_id, sector, target_audience, tone_of_voice, brand_keywords, additional_context, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        agencyId,
        "Marketing digital & SaaS",
        "PME et startups tech souhaitant développer leur présence en ligne",
        "Expert mais accessible, pédagogique, orienté résultats",
        "SEO,contenu IA,marketing digital,growth,conversion",
        "Agence spécialisée dans la création de contenu SEO optimisé pour les entreprises tech. Nous valorisons la qualité, la profondeur et la pertinence des contenus produits.",
      ],
    );

    // ── Thématiques ───────────────────────────────────────────────────────
    const themeNames = ["SEO & Référencement", "Content Marketing", "Intelligence Artificielle"];
    const themeIds: string[] = [];
    for (const name of themeNames) {
      const [theme] = await qr.query(
        "INSERT INTO themes (name, agency_id, created_at) VALUES ($1, $2, NOW()) RETURNING id",
        [name, agencyId],
      );
      themeIds.push(theme.id);
    }
    console.log(`🏷️  ${themeNames.length} thématiques créées`);

    // ── Tags ──────────────────────────────────────────────────────────────
    const tagNames = ["Tutoriel", "Cas client", "Tendances 2025"];
    const tagIds: string[] = [];
    for (const name of tagNames) {
      const [tag] = await qr.query(
        "INSERT INTO tags (name, agency_id, created_at) VALUES ($1, $2, NOW()) RETURNING id",
        [name, agencyId],
      );
      tagIds.push(tag.id);
    }
    console.log(`🔖 ${tagNames.length} tags créés`);

    // ── Articles ──────────────────────────────────────────────────────────
    const articles = [
      {
        title: "Comment optimiser son référencement naturel en 2025 : guide complet",
        body: `# Comment optimiser son référencement naturel en 2025

## Introduction

Le SEO (Search Engine Optimization) est en constante évolution. En 2025, les moteurs de recherche privilégient plus que jamais l'expérience utilisateur et la qualité du contenu.

## Les piliers du SEO moderne

### 1. Contenu E-E-A-T

Google valorise l'**Expertise**, l'**Expérience**, l'**Autorité** et la **Fiabilité** (E-E-A-T). Pour chaque article, posez-vous ces questions :
- Votre auteur est-il crédible ?
- Le contenu apporte-t-il une valeur réelle ?
- Les sources sont-elles citées ?

### 2. Core Web Vitals

Les métriques techniques restent cruciales :
- **LCP** (Largest Contentful Paint) < 2,5s
- **INP** (Interaction to Next Paint) < 200ms
- **CLS** (Cumulative Layout Shift) < 0,1

### 3. Recherche sémantique et intention

En 2025, il ne suffit plus de placer des mots-clés. Google comprend le contexte et l'intention derrière chaque requête. Structurez votre contenu autour d'**entités sémantiques** plutôt que de mots-clés isolés.

## Conclusion

Le SEO 2025 récompense la cohérence, la profondeur et l'authenticité. Investissez dans du contenu de qualité et une expérience technique irréprochable.`,
        contentType: "ARTICLE",
        status: "PUBLISHED",
        metaTitle: "SEO 2025 : Guide complet pour optimiser votre référencement naturel",
        metaDescription:
          "Découvrez les meilleures pratiques SEO pour 2025 : E-E-A-T, Core Web Vitals, recherche sémantique. Guide actionnable pour améliorer votre positionnement.",
        keywords: ["SEO 2025", "référencement naturel", "Core Web Vitals", "E-E-A-T"],
        slug: "seo-2025-guide-complet-optimisation-referencement",
        excerpt:
          "Le SEO évolue rapidement. Ce guide complet vous donne les clés pour optimiser votre référencement naturel en 2025, de l'E-E-A-T aux Core Web Vitals.",
        tagIds: [tagIds[0], tagIds[2]],
      },
      {
        title: "5 façons d'utiliser l'IA pour booster votre stratégie de contenu",
        body: `# 5 façons d'utiliser l'IA pour booster votre stratégie de contenu

## Pourquoi l'IA change la donne en content marketing

Les outils d'intelligence artificielle ne remplacent pas les créateurs de contenu : ils les augmentent. Voici comment les intégrer intelligemment dans votre workflow.

## 1. Génération d'idées de sujets

Utilisez l'IA pour analyser les tendances de votre secteur et identifier les lacunes de contenu que vos concurrents n'ont pas encore exploitées.

## 2. Enrichissement avec des sources réelles

La vraie valeur ajoutée : combiner la génération IA avec des sources curées (articles de veille, études de cas, données sectorielles). Le résultat est infiniment plus riche qu'un prompt brut.

## 3. Optimisation SEO intégrée

L'IA peut analyser la structure de votre contenu et suggérer des optimisations SEO en temps réel pendant la rédaction.

## 4. Adaptation du ton et du format

Un même contenu peut être décliné en article de blog, post LinkedIn, ou fiche produit — en conservant la cohérence de votre brand voice.

## 5. Scoring et amélioration itérative

Mesurez la qualité de chaque contenu avec un score objectif (SEO, lisibilité, engagement) et itérez rapidement.

## Conclusion

L'IA est un multiplicateur de force, pas un remplacement. Les équipes qui l'adoptent intelligemment produisent du contenu 3x plus rapidement, sans sacrifier la qualité.`,
        contentType: "ARTICLE",
        status: "REVIEW",
        metaTitle: "IA et content marketing : 5 usages concrets pour votre équipe",
        metaDescription:
          "Comment utiliser l'intelligence artificielle pour créer du contenu de qualité plus rapidement ? 5 cas d'usage concrets pour les équipes marketing.",
        keywords: ["IA content marketing", "intelligence artificielle", "stratégie contenu"],
        slug: "5-facons-ia-booster-strategie-contenu",
        excerpt:
          "L'IA révolutionne la création de contenu. Découvrez 5 façons concrètes d'intégrer les outils IA dans votre workflow marketing pour produire plus, mieux.",
        tagIds: [tagIds[1], tagIds[2]],
      },
      {
        title: "Content Marketing B2B : construire une audience qualifiée en 6 mois",
        body: `# Content Marketing B2B : construire une audience qualifiée en 6 mois

## Le défi du B2B

En B2B, les cycles de vente sont longs et les décisionnaires multiples. Le content marketing devient alors un levier de génération de confiance avant tout.

## La méthode en 3 phases

### Phase 1 — Fondations (mois 1-2)

- Définir ses personas (ICP) avec précision
- Auditer le contenu existant
- Identifier les 10 sujets piliers

### Phase 2 — Production (mois 3-4)

- 2 articles de fond par semaine
- 1 étude de cas par mois
- Distribution multicanal (LinkedIn, newsletter, SEO)

### Phase 3 — Optimisation (mois 5-6)

- Analyser les performances (trafic organique, leads générés)
- Doubler sur les formats qui fonctionnent
- Construire une séquence d'emails nurturing

## Résultats attendus

Avec cette approche, nos clients observent en moyenne :
- +180% de trafic organique à 6 mois
- x3 sur les leads qualifiés entrants
- Réduction de 30% du cycle de vente`,
        contentType: "ARTICLE",
        status: "DRAFT",
        metaTitle: "Content Marketing B2B : guide pour construire une audience qualifiée",
        metaDescription:
          "Méthode en 3 phases pour construire une audience B2B qualifiée en 6 mois grâce au content marketing. Stratégie, production, optimisation.",
        keywords: ["content marketing B2B", "audience qualifiée", "génération de leads"],
        slug: "content-marketing-b2b-construire-audience-6-mois",
        excerpt:
          "Comment construire une audience B2B qualifiée en 6 mois ? Notre méthode en 3 phases (fondations, production, optimisation) avec des résultats mesurables.",
        tagIds: [tagIds[1]],
      },
      {
        title: "Qu'est-ce que le SEO sémantique et pourquoi c'est crucial en 2025 ?",
        body: `# Qu'est-ce que le SEO sémantique ?

Le SEO sémantique consiste à optimiser votre contenu autour du sens et du contexte, plutôt que de simples correspondances exactes de mots-clés.

## Entités et relations

Google construit un graphe de connaissances reliant des entités (personnes, lieux, concepts) entre elles. Pour ranker, votre contenu doit s'inscrire clairement dans ce graphe.

## Comment l'implémenter

1. Identifiez les entités centrales de votre sujet
2. Couvrez les sous-thèmes connexes (topic clusters)
3. Utilisez le balisage Schema.org
4. Créez des liens internes cohérents

## Outils recommandés

- Google Search Console (recherches associées)
- SEMrush Topic Research
- Surfer SEO (NLP analysis)`,
        contentType: "ARTICLE",
        status: "VALIDATED",
        metaTitle: "SEO sémantique : définition, enjeux et mise en pratique en 2025",
        metaDescription:
          "Le SEO sémantique est clé pour ranker en 2025. Comprendre les entités, les relations et les topic clusters pour dominer les SERPs.",
        keywords: ["SEO sémantique", "topic clusters", "entités SEO"],
        slug: "seo-semantique-definition-enjeux-2025",
        excerpt:
          "Le SEO sémantique va au-delà des mots-clés : il s'agit de contexte, d'entités et de pertinence thématique. Essentiel pour le référencement en 2025.",
        tagIds: [tagIds[0]],
      },
    ];

    for (const article of articles) {
      await qr.query(
        `INSERT INTO articles
           (title, body, content_type, status, meta_title, meta_description, keywords, slug, excerpt,
            author_id, agency_id, tag_ids, source_ids, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, '{}', NOW(), NOW())`,
        [
          article.title,
          article.body,
          article.contentType,
          article.status,
          article.metaTitle,
          article.metaDescription,
          article.keywords.join(","),
          article.slug,
          article.excerpt,
          userId,
          agencyId,
          article.tagIds,
        ],
      );
    }
    console.log(`📝 ${articles.length} articles créés`);

    // ── Flux RSS ──────────────────────────────────────────────────────────
    const feeds = [
      {
        name: "Search Engine Journal",
        url: "https://www.searchenginejournal.com/feed/",
      },
      {
        name: "Content Marketing Institute",
        url: "https://contentmarketinginstitute.com/feed/",
      },
    ];

    const feedIds: string[] = [];
    for (const feed of feeds) {
      const [f] = await qr.query(
        `INSERT INTO feeds (name, url, owner_id, agency_id, created_at)
         VALUES ($1, $2, $3, $4, NOW())
         RETURNING id`,
        [feed.name, feed.url, userId, agencyId],
      );
      feedIds.push(f.id);
    }
    console.log(`📡 ${feeds.length} flux RSS créés`);

    // ── Articles curés ────────────────────────────────────────────────────
    const feedItems = [
      {
        id: `demo-item-1-${Date.now()}`,
        feedId: feedIds[0],
        title: "Google's March 2025 Core Update: What You Need to Know",
        link: "https://www.searchenginejournal.com/google-march-2025-core-update/",
        summary:
          "Google has released its March 2025 core update, impacting sites across multiple verticals. Here's what SEOs need to know and how to adapt their strategies.",
        publishedAt: new Date("2025-03-15"),
        curationStatus: "TO_USE",
        tagIds: [tagIds[0]],
      },
      {
        id: `demo-item-2-${Date.now()}`,
        feedId: feedIds[0],
        title: "AI Overviews: How to Optimize Your Content for Google's AI Feature",
        link: "https://www.searchenginejournal.com/ai-overviews-optimization/",
        summary:
          "Google's AI Overviews are changing how users interact with search results. Learn how to structure your content to appear in AI-generated summaries.",
        publishedAt: new Date("2025-02-28"),
        curationStatus: "INTERESTING",
        tagIds: [tagIds[0], tagIds[2]],
      },
      {
        id: `demo-item-3-${Date.now()}`,
        feedId: feedIds[1],
        title: "The State of Content Marketing 2025: Key Trends Report",
        link: "https://contentmarketinginstitute.com/state-of-content-marketing-2025/",
        summary:
          "CMI's annual report reveals that 73% of B2B marketers are using AI tools in their content workflow, up from 41% in 2024. Quality over quantity remains the dominant strategy.",
        publishedAt: new Date("2025-01-20"),
        curationStatus: "TO_USE",
        tagIds: [tagIds[1], tagIds[2]],
      },
      {
        id: `demo-item-4-${Date.now()}`,
        feedId: feedIds[1],
        title: "Why Your Content Strategy Needs a Semantic Core",
        link: "https://contentmarketinginstitute.com/semantic-core-content-strategy/",
        summary:
          "Building a semantic content core helps search engines understand your expertise and authority. Here's how to create topic clusters that dominate your niche.",
        publishedAt: new Date("2025-03-05"),
        curationStatus: "UNREAD",
        tagIds: [],
      },
    ];

    for (const item of feedItems) {
      await qr.query(
        `INSERT INTO feed_items (id, feed_id, title, link, summary, published_at, curation_status, tag_ids)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          item.id,
          item.feedId,
          item.title,
          item.link,
          item.summary,
          item.publishedAt,
          item.curationStatus,
          item.tagIds,
        ],
      );
    }
    console.log(`📰 ${feedItems.length} articles curés créés`);

    await qr.commitTransaction();
    console.log("\n✅ Seed terminé avec succès !");
    console.log(`\n📧 Connexion démo : ${DEMO_USER_EMAIL}`);
    console.log("   (utiliser le magic link — pas de mot de passe)\n");
  } catch (err) {
    await qr.rollbackTransaction();
    console.error("❌ Erreur pendant le seed :", err);
    process.exit(1);
  } finally {
    await qr.release();
    await AppDataSource.destroy();
  }
}

seed();
