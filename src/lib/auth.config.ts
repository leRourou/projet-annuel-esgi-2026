import type { NextAuthConfig } from "next-auth";
import NotionProvider from "next-auth/providers/notion";

// Edge-compatible config — NO TypeORM/Node.js imports here
// Resend (email/magic link) is NOT included here because it requires a DB adapter
// which is not available in the edge runtime. It is added in auth.ts instead.
export const authConfig: NextAuthConfig = {
  providers: [
    NotionProvider({
      clientId: process.env.AUTH_NOTION_ID ?? "",
      clientSecret: process.env.AUTH_NOTION_SECRET ?? "",
      redirectUri: `${process.env.AUTH_URL ?? "http://localhost:3000"}/api/auth/callback/notion`,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account }) {
      if (account?.provider === "notion" && account.access_token) {
        token.notionAccessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      if (token.notionAccessToken) {
        (session as typeof session & { notionAccessToken?: string }).notionAccessToken =
          token.notionAccessToken as string;
      }
      return session;
    },
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
  pages: {
    signIn: "/login",
    verifyRequest: "/verify",
  },
};
