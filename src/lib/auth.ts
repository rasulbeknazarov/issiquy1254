import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import type { NextAuthOptions } from "next-auth";
import type { UserRole } from "@prisma/client";

const THERMOPLUS_DOMAIN = "@thermoplus.uz";

function isThermoPlusEmail(email?: string | null): boolean {
  return !!email && email.toLowerCase().endsWith(THERMOPLUS_DOMAIN);
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    // NOTE: signIn runs BEFORE PrismaAdapter inserts a new User row, so it
    // must not touch the database for the signing-in user. Role promotion
    // lives in events.createUser and callbacks.jwt instead.
    async signIn() {
      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        // Initial sign-in: the User row exists by now (created by the adapter
        // just before this callback for first-time users).
        token.id = user.id;
        token.role = user.role as UserRole;

        if (isThermoPlusEmail(user.email)) {
          // Set the role on the token immediately so the very first session
          // is already an admin session, and make sure the DB agrees (covers
          // users created before this rule existed). updateMany never throws
          // when no row matches.
          token.role = "THERMOPLUS_ADMIN";
          if (user.role !== "THERMOPLUS_ADMIN") {
            await prisma.user.updateMany({
              where: { id: user.id },
              data: { role: "THERMOPLUS_ADMIN" },
            });
          }
        }
      }

      if (trigger === "update" && token.id) {
        // SECURITY: the payload of a client-side session update() is
        // attacker-controlled, so never copy a role from it. Re-read the
        // authoritative role from the database instead.
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: { role: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
  events: {
    // Fires right after PrismaAdapter creates the User row, so the update
    // below can never hit Prisma P2025 (record not found).
    async createUser({ user }) {
      if (isThermoPlusEmail(user.email)) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: "THERMOPLUS_ADMIN" },
        });
      }
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
};

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
    };
  }

  interface User {
    role: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
  }
}
