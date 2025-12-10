import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import { prisma } from "@/lib/prisma";
import { createStarterWorkspaceForUser } from "@/server/books/createStarterWorkspace";
// TODO: don't hardcode roles
type Role = "ADMIN" | "EDITOR" | "READER" | "VIEWER" | "USER";

const DEFAULT_ROLE: Role = "USER";

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
          (token as any).role = userRole;
        }
        (token as any).disabled = (user as { disabled?: boolean }).disabled ?? (token as any).disabled ?? false;
        (token as any).showOnboardingTour = (user as { showOnboardingTour?: boolean }).showOnboardingTour ?? true;
      } else if (token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true, disabled: true, showOnboardingTour: true },
        });

        if (dbUser) {
          (token as any).role = dbUser.role;
          (token as any).disabled = dbUser.disabled;
          (token as any).showOnboardingTour = dbUser.showOnboardingTour ?? true;
        }
      }

      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub ?? session.user.id;
        (session.user as any).role = ((token as any).role as string | undefined) ?? DEFAULT_ROLE;
        (session.user as any).disabled = Boolean((token as any).disabled);
        (session.user as any).showOnboardingTour = (token as any).showOnboardingTour ?? true;
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
