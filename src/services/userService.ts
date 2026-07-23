import { randomUUID } from "node:crypto";

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
}

/**
 * Simple in-memory user store. Swap this out for a real database layer
 * (Prisma, Drizzle, pg, etc.) — the route handlers only depend on this interface.
 */
class UserService {
  private users = new Map<string, User>();

  list(): User[] {
    return [...this.users.values()];
  }

  get(id: string): User | undefined {
    return this.users.get(id);
  }

  create(input: CreateUserInput): User {
    const user: User = { id: randomUUID(), ...input };
    this.users.set(user.id, user);
    return user;
  }

  remove(id: string): boolean {
    return this.users.delete(id);
  }

  /** Test helper — clears all state. */
  reset(): void {
    this.users.clear();
  }
}

export const userService = new UserService();
