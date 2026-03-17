import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    newUser: "/onboarding",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: {
            memberships: {
              include: {
                organization: {
                  include: { subscription: true },
                },
              },
              orderBy: { createdAt: "asc" },
              take: 1,
            },
          },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
      }

      if (token.userId) {
        const membership = await prisma.orgMember.findFirst({
          where: { userId: token.userId as string },
          include: {
            organization: {
              include: { subscription: true },
            },
          },
          orderBy: { createdAt: "asc" },
        });

        if (membership) {
          token.orgId = membership.orgId;
          token.role = membership.role;
          token.plan = membership.organization.subscription?.plan ?? null;
          token.subStatus = membership.organization.subscription?.status ?? null;
        }
      }

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

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
