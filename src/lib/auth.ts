import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  users,
  accounts,
  sessions,
  verificationTokens,
} from "@/lib/db/schema";

export const TEACHER_EMAIL = "misslohtutor@gmail.com";

export function roleFor(email: string | null | undefined): "teacher" | "student" {
  return email?.toLowerCase() === TEACHER_EMAIL ? "teacher" : "student";
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "teacher" | "student";
    } & DefaultSession["user"];
  }

  interface User {
    role?: "teacher" | "student" | null;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  session: { strategy: "database" },
  pages: { signIn: "/auth/signin" },
  events: {
    async createUser({ user }) {
      if (!user.id) return;
      await db
        .update(users)
        .set({ role: roleFor(user.email) })
        .where(eq(users.id, user.id));
    },
    async signIn({ user }) {
      if (!user.id) return;
      await db
        .update(users)
        .set({ lastLoginAt: new Date() })
        .where(eq(users.id, user.id));
    },
  },
  callbacks: {
    async signIn({ account, profile, user }) {
      if (account?.provider !== "google") return false;
      const email = (
        profile?.email ??
        user?.email ??
        ""
      ).toLowerCase();
      return email === TEACHER_EMAIL;
    },
    async session({ session, user }) {
      if (!session.user) return session;
      session.user.id = user.id;

      const stored = (user as { role?: "teacher" | "student" | null }).role;
      const resolved = stored ?? roleFor(user.email);
      session.user.role = resolved;

      if (!stored) {
        await db
          .update(users)
          .set({ role: resolved })
          .where(eq(users.id, user.id));
      }
      return session;
    },
  },
});
