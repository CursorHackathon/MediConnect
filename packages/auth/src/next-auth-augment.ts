import type { Role } from "@prisma/client";

/**
 * Single source of truth for Session/JWT shapes across all apps.
 * Keep `Session.user.role` required so it matches runtime (we always set it in the session callback).
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: Role;
    };
  }

  interface User {
    id: string;
    role: Role;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
  }
}

export {};
