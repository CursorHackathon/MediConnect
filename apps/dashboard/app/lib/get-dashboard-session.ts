import { getServerSession } from "next-auth/next";

import { authOptions } from "./auth-options";

/** next-auth's `getServerSession` infers `{}` for our options shape; narrow explicitly. */
export type DashboardSessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  role?: string;
};

export type DashboardSession = { user: DashboardSessionUser };

export async function getDashboardSession(): Promise<DashboardSession | null> {
  const session = await getServerSession(authOptions);
  return session as DashboardSession | null;
}
