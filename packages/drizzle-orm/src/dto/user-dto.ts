import type { UserInterest, UserRole } from "@neptu/shared";

import type { User } from "../schemas/users";

export interface UserDTO {
  id: string;
  walletAddress: string;
  email: string | null;
  displayName: string | null;
  birthDate: string | null;
  preferredLanguage: string;
  interests: UserInterest[];
  onboarded: boolean;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

// Public profile DTO - excludes sensitive data like birthDate
export interface UserPublicDTO {
  id: string;
  walletAddress: string;
  displayName: string | null;
  onboarded: boolean;
  createdAt: string;
}

export function toUserDTO(user: User): UserDTO {
  return {
    id: user.id,
    walletAddress: user.walletAddress,
    email: user.email,
    displayName: user.displayName,
    birthDate: user.birthDate,
    preferredLanguage: user.preferredLanguage ?? "en",
    interests: (user.interests ?? []) as UserInterest[],
    onboarded: user.onboarded ?? false,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export function toUserPublicDTO(user: User): UserPublicDTO {
  return {
    id: user.id,
    walletAddress: user.walletAddress,
    displayName: user.displayName,
    onboarded: user.onboarded ?? false,
    createdAt: user.createdAt.toISOString(),
  };
}

export function toUserDTOList(users: User[]): UserDTO[] {
  return users.map(toUserDTO);
}
