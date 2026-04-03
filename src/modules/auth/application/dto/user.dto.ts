import { z } from "zod";
import type { User } from "../../domain/entities/user.entity";

export const UserDtoSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(["ADMIN", "MEMBER", "VIEWER"]),
  hasNotionConnected: z.boolean(),
  createdAt: z.date(),
});

export type UserDto = z.infer<typeof UserDtoSchema>;

export function toUserDto(user: User): UserDto {
  return {
    id: user.id,
    email: user.email.value,
    name: user.name,
    role: user.role.value,
    hasNotionConnected: user.notionAccessToken !== undefined,
    createdAt: user.createdAt,
  };
}
