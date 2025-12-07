import NextAuth, { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";

// Placeholder config: replace with real providers (e.g., Google/GitHub) and Prisma adapter
export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: "Placeholder",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize() {
        // Always return null until real auth is configured
        return null;
      },
    }),
  ],
  session: { strategy: "jwt" },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
