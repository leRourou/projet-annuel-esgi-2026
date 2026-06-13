import { getDataSource } from "@/shared/infrastructure/database/data-source";
import type { Adapter, AdapterAccount, AdapterUser } from "next-auth/adapters";
import { AccountTypeormEntity } from "../entities/account.typeorm-entity";
import { UserTypeormEntity } from "../entities/user.typeorm-entity";
import { VerificationTokenTypeormEntity } from "../entities/verification-token.typeorm-entity";

function toAdapterUser(entity: UserTypeormEntity): AdapterUser {
  return {
    id: entity.id,
    email: entity.email,
    name: entity.name,
    emailVerified: entity.emailVerified,
    image: null,
  };
}

export function TypeormAuthAdapter(): Adapter {
  const userRepo = async () => (await getDataSource()).getRepository(UserTypeormEntity);
  const accountRepo = async () => (await getDataSource()).getRepository(AccountTypeormEntity);
  const tokenRepo = async () =>
    (await getDataSource()).getRepository(VerificationTokenTypeormEntity);

  return {
    async createUser(data) {
      const repo = await userRepo();
      const user = repo.create({
        email: data.email,
        name: data.name ?? data.email,
        emailVerified: data.emailVerified ?? null,
        role: "MEMBER",
      });
      const saved = await repo.save(user);
      return toAdapterUser(saved);
    },

    async getUser(id) {
      const user = await (await userRepo()).findOneBy({ id });
      return user ? toAdapterUser(user) : null;
    },

    async getUserByEmail(email) {
      const user = await (await userRepo()).findOneBy({ email });
      return user ? toAdapterUser(user) : null;
    },

    async getUserByAccount({ provider, providerAccountId }) {
      const account = await (await accountRepo()).findOneBy({ provider, providerAccountId });
      if (!account) return null;
      const user = await (await userRepo()).findOneBy({ id: account.userId });
      return user ? toAdapterUser(user) : null;
    },

    async updateUser(data) {
      const repo = await userRepo();
      const user = await repo.findOneBy({ id: data.id });
      if (!user) throw new Error(`User ${data.id} not found`);
      if (data.name !== undefined) user.name = data.name ?? user.name;
      if (data.emailVerified !== undefined) user.emailVerified = data.emailVerified;
      const saved = await repo.save(user);
      return toAdapterUser(saved);
    },

    async linkAccount(data: AdapterAccount) {
      const repo = await accountRepo();
      const account = repo.create({
        userId: data.userId,
        type: data.type,
        provider: data.provider,
        providerAccountId: data.providerAccountId,
        refresh_token: data.refresh_token ?? null,
        access_token: data.access_token ?? null,
        expires_at: data.expires_at ?? null,
        token_type: data.token_type ?? null,
        scope: data.scope ?? null,
        id_token: data.id_token ?? null,
        session_state: (data.session_state as string | undefined) ?? null,
      });
      await repo.save(account);

      // Persist Notion access token at the agency level
      if (data.provider === "notion" && data.access_token) {
        const ds = await getDataSource();
        const memberships = await ds.query(
          `SELECT agency_id FROM agency_members WHERE user_id = $1 AND joined_at IS NOT NULL LIMIT 1`,
          [data.userId],
        );
        const agencyId = (memberships as Array<{ agency_id: string }>)[0]?.agency_id;
        if (agencyId) {
          await ds.query(`UPDATE agencies SET notion_access_token = $1 WHERE id = $2`, [
            data.access_token,
            agencyId,
          ]);
        }
      }

      return data;
    },

    async unlinkAccount({ provider, providerAccountId }) {
      await (await accountRepo()).delete({ provider, providerAccountId });
    },

    async createVerificationToken(data) {
      const repo = await tokenRepo();
      await repo.save(repo.create(data));
      return data;
    },

    async useVerificationToken({ identifier, token }) {
      const repo = await tokenRepo();
      const found = await repo.findOneBy({ identifier, token });
      if (!found) return null;
      await repo.delete({ identifier, token });
      return { identifier: found.identifier, token: found.token, expires: found.expires };
    },
  };
}
