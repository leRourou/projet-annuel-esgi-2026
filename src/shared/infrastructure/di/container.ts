import { TypeormAgencyMemberRepository } from "@/modules/agency/infrastructure/adapters/typeorm-agency-member.repository";
import { TypeormAgencyRepository } from "@/modules/agency/infrastructure/adapters/typeorm-agency.repository";
import { TypeormUserRepository } from "@/modules/auth/infrastructure/adapters/typeorm-user.repository";
import { AnthropicAiGeneratorAdapter } from "@/modules/content/infrastructure/adapters/anthropic-ai-generator.adapter";
import { TypeormArticleRepository } from "@/modules/content/infrastructure/adapters/typeorm-article.repository";
import { NotionSdkClientAdapter } from "@/modules/notion/infrastructure/adapters/notion-sdk-client.adapter";
import { RssParserAdapter } from "@/modules/rss/infrastructure/adapters/rss-parser.adapter";
import { TypeormFeedRepository } from "@/modules/rss/infrastructure/adapters/typeorm-feed.repository";
import { getDataSource } from "../database/data-source";

import { AcceptInviteCommand } from "@/modules/agency/application/commands/accept-invite.command";
import { CreateAgencyCommand } from "@/modules/agency/application/commands/create-agency.command";
import { InviteMemberCommand } from "@/modules/agency/application/commands/invite-member.command";
import { RemoveMemberCommand } from "@/modules/agency/application/commands/remove-member.command";
import { UpdateMemberRoleCommand } from "@/modules/agency/application/commands/update-member-role.command";
import { GetAgencyQuery } from "@/modules/agency/application/queries/get-agency.query";
import { GetUserMembershipQuery } from "@/modules/agency/application/queries/get-user-membership.query";
import { ListMembersQuery } from "@/modules/agency/application/queries/list-members.query";
import { CreateUserCommand } from "@/modules/auth/application/commands/create-user.command";
import { GetUserByEmailQuery } from "@/modules/auth/application/queries/get-user-by-email.query";
import { GenerateArticleCommand } from "@/modules/content/application/commands/generate-article.command";
import { PublishArticleCommand } from "@/modules/content/application/commands/publish-article.command";
import { UpdateArticleCommand } from "@/modules/content/application/commands/update-article.command";
import { GetArticleQuery } from "@/modules/content/application/queries/get-article.query";
import { ListArticlesQuery } from "@/modules/content/application/queries/list-articles.query";
import { ImportFromNotionCommand } from "@/modules/notion/application/commands/import-from-notion.command";
import { SyncPageToNotionCommand } from "@/modules/notion/application/commands/sync-page-to-notion.command";
import { SearchNotionPagesQuery } from "@/modules/notion/application/queries/search-notion-pages.query";
import { AddFeedCommand } from "@/modules/rss/application/commands/add-feed.command";
import { RefreshFeedsCommand } from "@/modules/rss/application/commands/refresh-feeds.command";
import { ListFeedItemsQuery } from "@/modules/rss/application/queries/list-feed-items.query";

export async function buildContainer() {
  const dataSource = await getDataSource();

  const userRepository = new TypeormUserRepository(dataSource);
  const articleRepository = new TypeormArticleRepository(dataSource);
  const aiGenerator = new AnthropicAiGeneratorAdapter(
    process.env["ANTHROPIC_API_KEY"] ?? "",
    process.env["ANTHROPIC_MODEL"] ?? "claude-opus-4-6",
  );
  const notionClient = new NotionSdkClientAdapter();
  const feedRepository = new TypeormFeedRepository(dataSource);
  const rssParser = new RssParserAdapter();
  const agencyRepository = new TypeormAgencyRepository(dataSource);
  const agencyMemberRepository = new TypeormAgencyMemberRepository(dataSource);

  return {
    // Auth
    createUser: new CreateUserCommand(userRepository),
    getUserByEmail: new GetUserByEmailQuery(userRepository),

    // Content
    generateArticle: new GenerateArticleCommand(articleRepository, aiGenerator),
    updateArticle: new UpdateArticleCommand(articleRepository),
    publishArticle: new PublishArticleCommand(articleRepository),
    listArticles: new ListArticlesQuery(articleRepository),
    getArticle: new GetArticleQuery(articleRepository),

    // Notion
    syncPageToNotion: new SyncPageToNotionCommand(notionClient, articleRepository),
    importFromNotion: new ImportFromNotionCommand(notionClient, articleRepository),
    searchNotionPages: new SearchNotionPagesQuery(notionClient),

    // RSS
    addFeed: new AddFeedCommand(feedRepository),
    refreshFeeds: new RefreshFeedsCommand(feedRepository, rssParser),
    listFeedItems: new ListFeedItemsQuery(feedRepository),

    // Agency
    createAgency: new CreateAgencyCommand(agencyRepository, agencyMemberRepository),
    inviteMember: new InviteMemberCommand(agencyMemberRepository, userRepository),
    acceptInvite: new AcceptInviteCommand(agencyMemberRepository),
    updateMemberRole: new UpdateMemberRoleCommand(agencyMemberRepository),
    removeMember: new RemoveMemberCommand(agencyMemberRepository),
    getAgency: new GetAgencyQuery(agencyRepository, agencyMemberRepository),
    listMembers: new ListMembersQuery(agencyMemberRepository),
    getUserMembership: new GetUserMembershipQuery(agencyMemberRepository),
  };
}

export type Container = Awaited<ReturnType<typeof buildContainer>>;
