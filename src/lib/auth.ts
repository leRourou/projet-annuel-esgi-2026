import { TypeormAuthAdapter } from "@/modules/auth/infrastructure/adapters/typeorm-auth.adapter";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Resend from "next-auth/providers/resend";
import { authConfig } from "./auth.config";

const DEBUG_USER_ID = "00000000-0000-0000-0000-000000000001";
const DEBUG_AGENCY_ID = "00000000-0000-0000-0000-000000000002";
const DEBUG_MEMBER_ID = "00000000-0000-0000-0000-000000000003";

const debugProvider =
  process.env.NODE_ENV === "development"
    ? [
        Credentials({
          id: "debug",
          credentials: {},
          async authorize() {
            const { getDataSource } = await import("@/shared/infrastructure/database/data-source");
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

            const [member] = await ds.query("SELECT id FROM agency_members WHERE id = $1", [
              DEBUG_MEMBER_ID,
            ]);
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

function verificationEmailHtml(url: string, host: string): string {
  const escapedHost = host.replace(/\./g, "&#8203;.");
  const brandColor = "#346df1";
  return `
<body style="background: #f9f9f9;">
  <table width="100%" border="0" cellspacing="20" cellpadding="0"
    style="background: #fff; max-width: 600px; margin: auto; border-radius: 10px;">
    <tr>
      <td align="center"
        style="padding: 10px 0px; font-size: 22px; font-family: Helvetica, Arial, sans-serif; color: #444;">
        Connexion à <strong>${escapedHost}</strong>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center" style="border-radius: 5px;" bgcolor="${brandColor}"><a href="${url}"
                target="_blank"
                style="font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: #fff; text-decoration: none; border-radius: 5px; padding: 10px 20px; border: 1px solid ${brandColor}; display: inline-block; font-weight: bold;">Se
                connecter</a></td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td align="center"
        style="padding: 0px 0px 10px 0px; font-size: 16px; line-height: 22px; font-family: Helvetica, Arial, sans-serif; color: #444;">
        Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail sans risque.
      </td>
    </tr>
  </table>
</body>
`;
}

function verificationEmailText(url: string, host: string): string {
  return `Connexion à ${host}\n${url}\n\n`;
}

const resendProvider = Resend({
  apiKey: process.env.AUTH_RESEND_KEY,
  from: process.env.EMAIL_FROM ?? "noreply@contentai.studio",
  async sendVerificationRequest({ identifier: to, url, provider }) {
    const { host } = new URL(url);
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: provider.from,
        to,
        subject: `Connexion à ${host}`,
        html: verificationEmailHtml(url, host),
        text: verificationEmailText(url, host),
      }),
    });
    if (!res.ok) {
      throw new Error(`Resend error: ${JSON.stringify(await res.json())}`);
    }
  },
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: TypeormAuthAdapter(),
  providers: [...debugProvider, resendProvider, ...authConfig.providers],
  events: {
    // Runs on every successful Notion sign-in (first connect AND reconnect after an
    // expired/revoked token) — unlike the adapter's linkAccount, which only fires once.
    async signIn({ user, account }) {
      if (account?.provider === "notion" && account.access_token && user.id) {
        const { getDataSource } = await import("@/shared/infrastructure/database/data-source");
        const ds = await getDataSource();
        const memberships = await ds.query(
          "SELECT agency_id FROM agency_members WHERE user_id = $1 AND joined_at IS NOT NULL LIMIT 1",
          [user.id],
        );
        const agencyId = (memberships as Array<{ agency_id: string }>)[0]?.agency_id;
        if (agencyId) {
          await ds.query("UPDATE agencies SET notion_access_token = $1 WHERE id = $2", [
            account.access_token,
            agencyId,
          ]);
        }
      }
    },
  },
});
