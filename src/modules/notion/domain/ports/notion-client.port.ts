import type { NotionPage } from "../entities/notion-page.entity";

export interface SearchNotionPagesInput {
  query: string;
  accessToken: string;
  databaseId?: string;
}

export interface NotionDatabaseSummary {
  id: string;
  title: string;
  url: string;
}

export interface NotionDatabaseEntry {
  id: string;
  title: string;
  url: string;
  lastEditedAt: Date;
}

export interface SearchNotionDatabasesInput {
  query: string;
  accessToken: string;
}

export interface QueryNotionDatabaseInput {
  databaseId: string;
  accessToken: string;
}

export interface TestConnectionResult {
  ok: boolean;
  error?: string;
}

export interface CreateNotionPageInput {
  parentDatabaseId: string;
  title: string;
  content: string;
  accessToken: string;
}

export interface ExportPageInput {
  parentDatabaseId: string;
  title: string;
  body: string;
  accessToken: string;
  status?: string;
  contentType?: string;
  tags?: string[];
  scheduledAt?: Date;
}

export interface NotionClientPort {
  searchPages(input: SearchNotionPagesInput): Promise<NotionPage[]>;
  getPage(pageId: string, accessToken: string): Promise<NotionPage>;
  createPage(input: CreateNotionPageInput): Promise<NotionPage>;
  updatePage(pageId: string, content: string, accessToken: string): Promise<void>;
  exportPage(input: ExportPageInput): Promise<NotionPage>;
  searchDatabases(input: SearchNotionDatabasesInput): Promise<NotionDatabaseSummary[]>;
  getDatabase(databaseId: string, accessToken: string): Promise<NotionDatabaseSummary>;
  queryDatabase(input: QueryNotionDatabaseInput): Promise<NotionDatabaseEntry[]>;
  setPageStatus(pageId: string, status: string, accessToken: string): Promise<void>;
  updatePageSchedule(pageId: string, date: Date, accessToken: string): Promise<void>;
  testConnection(accessToken: string): Promise<TestConnectionResult>;
}
