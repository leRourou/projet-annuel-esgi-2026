export interface AgencyDto {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  memberCount: number;
}

export interface AgencyMemberDto {
  id: string;
  userId: string;
  agencyId: string;
  role: "ADMIN" | "MEMBER" | "VIEWER";
  joinedAt: Date | null;
  isPending: boolean;
}
