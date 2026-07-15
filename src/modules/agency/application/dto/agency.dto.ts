export interface AgencyDto {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  memberCount: number;
  notionConnected: boolean;
  notionDatabaseId?: string | null;
}

export interface AgencyMemberDto {
  id: string;
  userId: string;
  userEmail: string | null;
  userName: string | null;
  agencyId: string;
  role: "ADMIN" | "MEMBER" | "VIEWER";
  joinedAt: Date | null;
  isPending: boolean;
}
