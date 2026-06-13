import { TypeormAgencyContextRepository } from "@/modules/agency/infrastructure/adapters/typeorm-agency-context.repository";
import { TypeormAgencyMemberRepository } from "@/modules/agency/infrastructure/adapters/typeorm-agency-member.repository";
import { TypeormAgencyRepository } from "@/modules/agency/infrastructure/adapters/typeorm-agency.repository";
import { TypeormTagRepository } from "@/modules/agency/infrastructure/adapters/typeorm-tag.repository";
import { TypeormThemeRepository } from "@/modules/agency/infrastructure/adapters/typeorm-theme.repository";
import { TypeormUserRepository } from "@/modules/auth/infrastructure/adapters/typeorm-user.repository";
import { AnthropicAiGeneratorAdapter } from "@/modules/content/infrastructure/adapters/anthropic-ai-generator.adapter";
import { TypeormArticleRepository } from "@/modules/content/infrastructure/adapters/typeorm-article.repository";
import { NotionSdkClientAdapter } from "@/modules/notion/infrastructure/adapters/notion-sdk-client.adapter";
import { RssParserAdapter } from "@/modules/rss/infrastructure/adapters/rss-parser.adapter";
import { TypeormFeedRepository } from "@/modules/rss/infrastructure/adapters/typeorm-feed.repository";
import { getDataSource } from "../database/data-source";

import { AcceptInviteCommand } from "@/modules/agency/application/commands/accept-invite.command";
import { CreateAgencyCommand } from "@/modules/agency/application/commands/create-agency.command";
import { CreateTagCommand } from "@/modules/agency/application/commands/create-tag.command";
import { CreateThemeCommand } from "@/modules/agency/application/commands/create-theme.command";
import { DeleteTagCommand } from "@/modules/agency/application/commands/delete-tag.command";
import { DeleteThemeCommand } from "@/modules/agency/application/commands/delete-theme.command";
import { InviteMemberCommand } from "@/modules/agency/application/commands/invite-member.command";
import { RemoveMemberCommand } from "@/modules/agency/application/commands/remove-member.command";
import { UpdateAgencyContextCommand } from "@/modules/agency/application/commands/update-agency-context.command";
import { UpdateAgencyNotionConfigCommand } from "@/modules/agency/application/commands/update-agency-notion-config.command";
import { UpdateMemberRoleCommand } from "@/modules/agency/application/commands/update-member-role.command";
import { GetAgencyContextQuery } from "@/modules/agency/application/queries/get-agency-context.query";
import { GetAgencyQuery } from "@/modules/agency/application/queries/get-agency.query";
import { GetUserMembershipQuery } from "@/modules/agency/application/queries/get-user-membership.query";
import { ListMembersQuery } from "@/modules/agency/application/queries/list-members.query";
import { ListTagsQuery } from "@/modules/agency/application/queries/list-tags.query";
import { ListThemesQuery } from "@/modules/agency/application/queries/list-themes.query";
import { CreateUserCommand } from "@/modules/auth/application/commands/create-user.command";
import { GetUserByEmailQuery } from "@/modules/auth/application/queries/get-user-by-email.query";
import { AssignTagsCommand } from "@/modules/content/application/commands/assign-tags.command";
import { CreateArticleCommand } from "@/modules/content/application/commands/create-article.command";
import { GenerateArticleCommand } from "@/modules/content/application/commands/generate-article.command";
import { GenerateIdeasCommand } from "@/modules/content/application/commands/generate-ideas.command";
import { PublishArticleCommand } from "@/modules/content/application/commands/publish-article.command";
import { RegenerateSectionCommand } from "@/modules/content/application/commands/regenerate-section.command";
import { UpdateArticleCommand } from "@/modules/content/application/commands/update-article.command";
import { GetArticleQuery } from "@/modules/content/application/queries/get-article.query";
import { ListArticlesQuery } from "@/modules/content/application/queries/list-articles.query";
import { ScoreContentSeoQuery } from "@/modules/content/application/queries/score-content-seo.query";
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
    process.env.ANTHROPIC_API_KEY ?? "",
    process.env.ANTHROPIC_MODEL ?? "claude-opus-4-6",
  );
  const notionClient = new NotionSdkClientAdapter();
  const feedRepository = new TypeormFeedRepository(dataSource);
  const rssParser = new RssParserAdapter();
  const agencyRepository = new TypeormAgencyRepository(dataSource);
  const agencyMemberRepository = new TypeormAgencyMemberRepository(dataSource);
  const themeRepository = new TypeormThemeRepository(dataSource);
  const tagRepository = new TypeormTagRepository(dataSource);
  const agencyContextRepository = new TypeormAgencyContextRepository(dataSource);

  return {
    // Infrastructure
    aiGenerator,

    // Auth
    createUser: new CreateUserCommand(userRepository),
    getUserByEmail: new GetUserByEmailQuery(userRepository),

    // Content
    generateIdeas: new GenerateIdeasCommand(aiGenerator, articleRepository),
    generateArticle: new GenerateArticleCommand(articleRepository, aiGenerator),
    createArticle: new CreateArticleCommand(articleRepository),
    updateArticle: new UpdateArticleCommand(articleRepository),
    publishArticle: new PublishArticleCommand(articleRepository),
    regenerateSection: new RegenerateSectionCommand(aiGenerator, articleRepository),
    listArticles: new ListArticlesQuery(articleRepository),
    getArticle: new GetArticleQuery(articleRepository),
    scoreContentSeo: new ScoreContentSeoQuery(),

    // Notion
    syncPageToNotion: new SyncPageToNotionCommand(notionClient, articleRepository),
    importFromNotion: new ImportFromNotionCommand(notionClient, articleRepository),
    searchNotionPages: new SearchNotionPagesQuery(notionClient),

    // RSS
    addFeed: new AddFeedCommand(feedRepository),
    refreshFeeds: new RefreshFeedsCommand(feedRepository, rssParser),
    listFeedItems: new ListFeedItemsQuery(feedRepository),

    // Tags
    createTag: new CreateTagCommand(tagRepository, agencyMemberRepository),
    deleteTag: new DeleteTagCommand(tagRepository, agencyMemberRepository),
    listTags: new ListTagsQuery(tagRepository),
    assignTags: new AssignTagsCommand(articleRepository),

    // Agency themes
    createTheme: new CreateThemeCommand(themeRepository, agencyMemberRepository),
    deleteTheme: new DeleteThemeCommand(themeRepository, agencyMemberRepository),
    listThemes: new ListThemesQuery(themeRepository),

    // Agency
    createAgency: new CreateAgencyCommand(agencyRepository, agencyMemberRepository),
    inviteMember: new InviteMemberCommand(agencyMemberRepository, userRepository),
    acceptInvite: new AcceptInviteCommand(agencyMemberRepository),
    updateMemberRole: new UpdateMemberRoleCommand(agencyMemberRepository),
    removeMember: new RemoveMemberCommand(agencyMemberRepository),
    getAgency: new GetAgencyQuery(agencyRepository, agencyMemberRepository),
    listMembers: new ListMembersQuery(agencyMemberRepository),
    getUserMembership: new GetUserMembershipQuery(agencyMemberRepository),
    updateAgencyNotionConfig: new UpdateAgencyNotionConfigCommand(
      agencyRepository,
      agencyMemberRepository,
    ),

    // Agency context
    updateAgencyContext: new UpdateAgencyContextCommand(
      agencyContextRepository,
      agencyRepository,
      agencyMemberRepository,
    ),
    getAgencyContext: new GetAgencyContextQuery(agencyContextRepository),
  };
}

export type Container = Awaited<ReturnType<typeof buildContainer>>;
