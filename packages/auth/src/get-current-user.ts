import { getServerSession } from "next-auth";
import { prisma } from "@mediconnect/db";

import { credentialsAuthOptions } from "./credentials-auth-options";

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/**
 * Resolves the signed-in user from the NextAuth JWT session and loads full Prisma profile.
 * Each app must mount `app/api/auth/[...nextauth]/route.ts` with `credentialsAuthOptions`.
 */
export async function getCurrentUser() {
  const session = await getServerSession(credentialsAuthOptions);
  const id = session?.user?.id;
  if (!id) return null;

  return prisma.user.findUnique({
    where: { id },
    include: { patient: true, doctor: true },
  });
}
