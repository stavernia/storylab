import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";

import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
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

      return true;
    },
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = (user as { role?: Role }).role ?? token.role ?? Role.USER;
        token.disabled = (user as { disabled?: boolean }).disabled ?? token.disabled ?? false;
      } else if (token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true, disabled: true },
        });

        if (dbUser) {
          token.role = dbUser.role;
          token.disabled = dbUser.disabled;
        }
      }

      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub ?? session.user.id;
        session.user.role = (token.role as Role | undefined) ?? Role.USER;
        session.user.disabled = Boolean(token.disabled);
      }

      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
