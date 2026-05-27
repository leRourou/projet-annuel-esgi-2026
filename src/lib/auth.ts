import { TypeormAuthAdapter } from "@/modules/auth/infrastructure/adapters/typeorm-auth.adapter";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Resend from "next-auth/providers/resend";
import { authConfig } from "./auth.config";

const DEBUG_USER_ID = "00000000-0000-0000-0000-000000000001";
const DEBUG_AGENCY_ID = "00000000-0000-0000-0000-000000000002";
const DEBUG_MEMBER_ID = "00000000-0000-0000-0000-000000000003";

const debugProvider =
  process.env["NODE_ENV"] === "development"
    ? [
        Credentials({
          id: "debug",
          credentials: {},
          async authorize() {
            const { getDataSource } = await import(
              "@/shared/infrastructure/database/data-source"
            );
            const ds = await getDataSource();

            const [agency] = await ds.query("SELECT id FROM agencies WHERE id = $1", [
              DEBUG_AGENCY_ID,
            ]);
            if (!agency) {
              await ds.query(
                "INSERT INTO agencies (id, name, slug, created_at) VALUES ($1, $2, $3, NOW())",
                [DEBUG_AGENCY_ID, "Debug Agency", "debug-agency"],
              );
            }

            const [member] = await ds.query(
              "SELECT id FROM agency_members WHERE id = $1",
              [DEBUG_MEMBER_ID],
            );
            if (!member) {
              await ds.query(
                `INSERT INTO agency_members (id, agency_id, user_id, role, joined_at, invited_by, invite_token, invite_expires_at)
                 VALUES ($1, $2, $3, 'ADMIN', NOW(), $3, NULL, NULL)`,
                [DEBUG_MEMBER_ID, DEBUG_AGENCY_ID, DEBUG_USER_ID],
              );
            }

            return { id: DEBUG_USER_ID, email: "debug@dev.local", name: "Debug User" };
          },
        }),
      ]
    : [];

const resendProvider = Resend({
  apiKey: process.env["AUTH_RESEND_KEY"],
  from: process.env["EMAIL_FROM"] ?? "noreply@contentai.studio",
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: TypeormAuthAdapter(),
  providers: [...debugProvider, resendProvider, ...authConfig.providers],
});
