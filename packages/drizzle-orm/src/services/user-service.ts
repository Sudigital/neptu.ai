import type { UserRole } from "@neptu/shared";

import type { Database } from "../client";

import { toUserDTO, type UserDTO } from "../dto/user-dto";
import {
  UserRepository,
  type ListUsersOptions,
  type PaginatedResult,
} from "../repositories/user-repository";
import {
  createUserSchema,
  updateUserSchema,
  onboardUserSchema,
  type CreateUserInput,
  type UpdateUserInput,
  type OnboardUserInput,
} from "../validators/user-validator";

export class UserService {
  private repository: UserRepository;

  constructor(db: Database) {
    this.repository = new UserRepository(db);
  }

  async createUser(input: CreateUserInput): Promise<UserDTO> {
    const validated = createUserSchema.parse(input);
    const id = crypto.randomUUID();

    const user = await this.repository.create({
      id,
      walletAddress: validated.walletAddress,
      email: validated.email,
      displayName: validated.displayName,
      birthDate: validated.birthDate,
      interests: validated.interests
        ? JSON.stringify(validated.interests)
        : null,
    });

    return toUserDTO(user);
  }

  async getUserById(id: string): Promise<UserDTO | null> {
    const user = await this.repository.findById(id);
    return user ? toUserDTO(user) : null;
  }

  async getUserByWallet(walletAddress: string): Promise<UserDTO | null> {
    const user = await this.repository.findByWalletAddress(walletAddress);
    return user ? toUserDTO(user) : null;
  }

  async updateUser(
    id: string,
    input: UpdateUserInput
  ): Promise<UserDTO | null> {
    const validated = updateUserSchema.parse(input);
    const updateData: Record<string, unknown> = {};

    if (validated.email !== undefined) updateData.email = validated.email;
    if (validated.displayName !== undefined)
      updateData.displayName = validated.displayName;
    if (validated.interests !== undefined) {
      updateData.interests = JSON.stringify(validated.interests);
    }
    if (validated.birthDate !== undefined) {
      updateData.birthDate = validated.birthDate;
      updateData.onboarded = true;
    }
    if (validated.preferredLanguage !== undefined) {
      updateData.preferredLanguage = validated.preferredLanguage;
    }

    const user = await this.repository.update(id, updateData);
    return user ? toUserDTO(user) : null;
  }

  async onboardUser(
    id: string,
    input: OnboardUserInput
  ): Promise<UserDTO | null> {
    const validated = onboardUserSchema.parse(input);

    const user = await this.repository.update(id, {
      birthDate: validated.birthDate,
      displayName: validated.displayName,
      preferredLanguage: validated.preferredLanguage,
      interests: validated.interests
        ? JSON.stringify(validated.interests)
        : null,
      onboarded: true,
    });

    return user ? toUserDTO(user) : null;
  }

  async getOrCreateUser(
    walletAddress: string,
    email?: string
  ): Promise<UserDTO> {
    const user = await this.repository.findOrCreate(walletAddress, { email });
    return toUserDTO(user);
  }

  async isUserOnboarded(walletAddress: string): Promise<boolean> {
    const user = await this.repository.findByWalletAddress(walletAddress);
    return user?.onboarded ?? false;
  }

  async setRole(id: string, role: string): Promise<void> {
    await this.repository.update(id, {
      role: role as UserRole,
    });
  }

  // Admin methods
  async listUsers(
    options: ListUsersOptions
  ): Promise<PaginatedResult<UserDTO>> {
    const result = await this.repository.list(options);
    return {
      ...result,
      data: result.data.map(toUserDTO),
    };
  }

  async getStats(): Promise<{
    total: number;
    onboarded: number;
    admins: number;
    developers: number;
    todayNew: number;
  }> {
    return this.repository.getStats();
  }
}
