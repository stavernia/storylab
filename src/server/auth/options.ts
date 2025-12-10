import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { AuthOptions, DefaultSession } from "next-auth";
import type { JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";

import { prisma } from "@/lib/prisma";
import { createStarterWorkspaceForUser } from "@/server/books/createStarterWorkspace";

type Role = "ADMIN" | "EDITOR" | "READER" | "VIEWER" | "USER";
const DEFAULT_ROLE: Role = "USER";

/**
 * Module augmentation to extend NextAuth types with custom user properties.
 * This allows us to type token and session properties without using any.
 */
declare module "next-auth" {
  interface Session {
    user?: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: Role;
      disabled: boolean;
      showOnboardingTour: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role?: Role;
    disabled?: boolean;
    showOnboardingTour?: boolean;
  }
}

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" }, // use JWT sessions for middleware compatibility
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    signIn: async ({ user }) => {
      if ((user as { disabled?: boolean } | undefined)?.disabled) {
        return "/disabled";
      }

      if (user?.id) {
        const exists = await prisma.user.findUnique({ where: { id: user.id }, select: { id: true } });

        if (exists) {
          await createStarterWorkspaceForUser(prisma, user.id);
        }
      }

      return true;
    },
    jwt: async ({ token, user }) => {
      if (user) {
        const userRole = (user as { role?: string }).role;
        if (userRole) {
          token.role = userRole as Role;
        }
        token.disabled = (user as { disabled?: boolean }).disabled ?? token.disabled ?? false;
        token.showOnboardingTour = (user as { showOnboardingTour?: boolean }).showOnboardingTour ?? true;
      } else if (token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true, disabled: true, showOnboardingTour: true },
        });

        if (dbUser) {
          token.id = token.sub;
          token.role = dbUser.role as Role;
          token.disabled = dbUser.disabled;
          token.showOnboardingTour = dbUser.showOnboardingTour ?? true;
        }
      }

      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = (token.sub ?? session.user?.id) as string;
        session.user.role = token.role ?? DEFAULT_ROLE;
        session.user.disabled = token.disabled ?? false;
        session.user.showOnboardingTour = token.showOnboardingTour ?? true;
      }

      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (user?.id) {
        await createStarterWorkspaceForUser(prisma, user.id);
      }
    },
  },
};
