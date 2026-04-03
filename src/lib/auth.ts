import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import NotionProvider from "next-auth/providers/notion";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Resend({
      apiKey: process.env["AUTH_RESEND_KEY"],
      from: process.env["EMAIL_FROM"] ?? "noreply@contentai.studio",
    }),
    NotionProvider({
      clientId: process.env["AUTH_NOTION_ID"] ?? "",
      clientSecret: process.env["AUTH_NOTION_SECRET"] ?? "",
      redirectUri: `${process.env["AUTH_URL"] ?? "http://localhost:3000"}/api/auth/callback/notion`,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account }) {
      if (account?.provider === "notion" && account.access_token) {
        token["notionAccessToken"] = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (token["notionAccessToken"]) {
        (session as typeof session & { notionAccessToken?: string }).notionAccessToken =
          token["notionAccessToken"] as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    verifyRequest: "/verify",
  },
});
