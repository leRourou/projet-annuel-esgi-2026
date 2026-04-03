import "reflect-metadata";
import { AgencyMemberTypeormEntity } from "@/modules/agency/infrastructure/entities/agency-member.typeorm-entity";
import { AgencyTypeormEntity } from "@/modules/agency/infrastructure/entities/agency.typeorm-entity";
import { UserTypeormEntity } from "@/modules/auth/infrastructure/entities/user.typeorm-entity";
import { ArticleTypeormEntity } from "@/modules/content/infrastructure/entities/article.typeorm-entity";
import { FeedItemTypeormEntity } from "@/modules/rss/infrastructure/entities/feed-item.typeorm-entity";
import { FeedTypeormEntity } from "@/modules/rss/infrastructure/entities/feed.typeorm-entity";
import { DataSource } from "typeorm";

const DATABASE_URL = process.env["DATABASE_URL"] ??
  "postgresql://contentai:contentai_secret@localhost:5432/contentai_db";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: DATABASE_URL,
  synchronize: false,
  logging: process.env["NODE_ENV"] === "development",
  entities: [
    UserTypeormEntity,
    ArticleTypeormEntity,
    FeedTypeormEntity,
    FeedItemTypeormEntity,
    AgencyTypeormEntity,
    AgencyMemberTypeormEntity,
  ],
  migrations: ["src/shared/infrastructure/database/migrations/*.ts"],
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
