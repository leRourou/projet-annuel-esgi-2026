import { cookies } from "next/headers";

export const ACTIVE_AGENCY_COOKIE = "active_agency_id";

export async function getActiveAgencyId(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(ACTIVE_AGENCY_COOKIE)?.value;
}
