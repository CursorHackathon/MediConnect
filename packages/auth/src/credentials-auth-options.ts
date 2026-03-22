import "./next-auth-augment";

import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";

import type { Role } from "@prisma/client";
import { prisma } from "@mediconnect/db";

/** Shared credentials provider for all MediConnect Next.js apps (same secret + JWT shape per deployment). */
export const credentialsAuthOptions: NextAuthOptions = {
  useSecureCookies: (process.env.NEXTAUTH_URL ?? "").startsWith("https://"),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = credentials.email.trim().toLowerCase();
        const password = credentials.password.trim();
        const user = await prisma.user.findUnique({
          where: { email },
        });
        if (!user?.passwordHash) return null;
        const valid = await compare(password, user.passwordHash);
        if (!valid) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role as Role,
        };
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user && "role" in user) {
        token.role = user.role as Role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        const fromToken = token.role as Role | undefined;
        session.user.role = fromToken ?? "PATIENT";
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
