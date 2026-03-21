import { getServerSession } from "next-auth/next";

import { prisma } from "@mediconnect/db";

import { authOptions } from "./auth-options";

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/**
 * Returns the database user for the active session, including role and optional profiles.
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      patient: true,
      doctor: true,
    },
  });
}
