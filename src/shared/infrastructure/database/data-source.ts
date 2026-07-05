import "reflect-metadata";
import { AgencyContextTypeormEntity } from "@/modules/agency/infrastructure/entities/agency-context.typeorm-entity";
import { AgencyMemberTypeormEntity } from "@/modules/agency/infrastructure/entities/agency-member.typeorm-entity";
import { AgencyTypeormEntity } from "@/modules/agency/infrastructure/entities/agency.typeorm-entity";
import { TagTypeormEntity } from "@/modules/agency/infrastructure/entities/tag.typeorm-entity";
import { ThemeTypeormEntity } from "@/modules/agency/infrastructure/entities/theme.typeorm-entity";
import { AccountTypeormEntity } from "@/modules/auth/infrastructure/entities/account.typeorm-entity";
import { UserTypeormEntity } from "@/modules/auth/infrastructure/entities/user.typeorm-entity";
import { VerificationTokenTypeormEntity } from "@/modules/auth/infrastructure/entities/verification-token.typeorm-entity";
import { ArticleTypeormEntity } from "@/modules/content/infrastructure/entities/article.typeorm-entity";
import { FeedItemTypeormEntity } from "@/modules/rss/infrastructure/entities/feed-item.typeorm-entity";
import { FeedTypeormEntity } from "@/modules/rss/infrastructure/entities/feed.typeorm-entity";
import { InitialSchema1743000000000 } from "@/shared/infrastructure/database/migrations/1743000000000-InitialSchema";
import { AddAuthTables1775228738204 } from "@/shared/infrastructure/database/migrations/1775228738204-AddAuthTables";
import { AddNotionConfigToAgency1775300000000 } from "@/shared/infrastructure/database/migrations/1775300000000-AddNotionConfigToAgency";
import { AddThemesTable1775400000000 } from "@/shared/infrastructure/database/migrations/1775400000000-AddThemesTable";
import { AddExcerptToArticles1775500000000 } from "@/shared/infrastructure/database/migrations/1775500000000-AddExcerptToArticles";
import { AddAgencyContextTable1775600000000 } from "@/shared/infrastructure/database/migrations/1775600000000-AddAgencyContextTable";
import { AddTagsTable1775700000000 } from "@/shared/infrastructure/database/migrations/1775700000000-AddTagsTable";
import { AddCurationStatusToFeedItems1775800000000 } from "@/shared/infrastructure/database/migrations/1775800000000-AddCurationStatusToFeedItems";
import { AddSourceIdsToArticles1775900000000 } from "@/shared/infrastructure/database/migrations/1775900000000-AddSourceIdsToArticles";
import { AddScheduledAtToArticles1776000000000 } from "@/shared/infrastructure/database/migrations/1776000000000-AddScheduledAtToArticles";
import { AddSourceTypeToFeeds1776100000000 } from "@/shared/infrastructure/database/migrations/1776100000000-AddSourceTypeToFeeds";
import { AddOnboardingCompletedToUsers1776200000000 } from "@/shared/infrastructure/database/migrations/1776200000000-AddOnboardingCompletedToUsers";
import { AddImagePromptToArticles1776300000000 } from "@/shared/infrastructure/database/migrations/1776300000000-AddImagePromptToArticles";
import { DataSource } from "typeorm";

const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://contentai:contentai_secret@localhost:5432/contentai_db";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: DATABASE_URL,
  synchronize: false,
  logging: process.env.NODE_ENV === "development",
  entities: [
    UserTypeormEntity,
    AccountTypeormEntity,
    VerificationTokenTypeormEntity,
    ArticleTypeormEntity,
    FeedTypeormEntity,
    FeedItemTypeormEntity,
    AgencyTypeormEntity,
    AgencyMemberTypeormEntity,
    ThemeTypeormEntity,
    TagTypeormEntity,
    AgencyContextTypeormEntity,
  ],
  migrations: [
    InitialSchema1743000000000,
    AddAuthTables1775228738204,
    AddNotionConfigToAgency1775300000000,
    AddThemesTable1775400000000,
    AddExcerptToArticles1775500000000,
    AddAgencyContextTable1775600000000,
    AddTagsTable1775700000000,
    AddCurationStatusToFeedItems1775800000000,
    AddSourceIdsToArticles1775900000000,
    AddScheduledAtToArticles1776000000000,
    AddSourceTypeToFeeds1776100000000,
    AddOnboardingCompletedToUsers1776200000000,
    AddImagePromptToArticles1776300000000,
  ],
  subscribers: [],
});

let initialized = false;

export async function getDataSource(): Promise<DataSource> {
  if (!initialized) {
    await AppDataSource.initialize();
    initialized = true;
  }
  return AppDataSource;
}
