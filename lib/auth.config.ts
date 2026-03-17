/**
 * Edge-safe NextAuth config — no Prisma, no Node.js-only modules.
 * Used exclusively in middleware.ts which runs in the Edge runtime.
 *
 * The full config (with Prisma adapter, bcrypt, DB callbacks) lives in lib/auth.ts
 * and is used in server components and API routes.
 */
import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    newUser: "/onboarding",
  },
  providers: [], // Providers are only needed server-side
  callbacks: {
    // JWT data was already enriched (orgId, role, etc.) during sign-in
    // by the full jwt callback in auth.ts. Just pass it through here.
    async jwt({ token }) {
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = (token.userId as string) ?? "";
        session.user.orgId = (token.orgId as string) ?? "";
        session.user.role = (token.role as string) ?? "";
        session.user.plan = (token.plan as string) ?? "";
        session.user.subStatus = (token.subStatus as string) ?? "";
      }
      return session;
    },
  },
};
