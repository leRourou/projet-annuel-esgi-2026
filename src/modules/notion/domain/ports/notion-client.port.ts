import type { NotionPage } from "../entities/notion-page.entity";

export interface SearchNotionPagesInput {
  query: string;
  accessToken: string;
  databaseId?: string;
}

export interface CreateNotionPageInput {
  parentDatabaseId: string;
  title: string;
  content: string;
  accessToken: string;
}

export interface NotionClientPort {
  searchPages(input: SearchNotionPagesInput): Promise<NotionPage[]>;
  getPage(pageId: string, accessToken: string): Promise<NotionPage>;
  createPage(input: CreateNotionPageInput): Promise<NotionPage>;
  updatePage(pageId: string, content: string, accessToken: string): Promise<void>;
}
