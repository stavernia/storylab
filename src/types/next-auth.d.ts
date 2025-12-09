import { DefaultSession, DefaultUser } from "next-auth";

type UserRole = "USER" | "ADMIN";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user?: {
      id: string;
      role: UserRole;
      disabled: boolean;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: UserRole;
    disabled: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    disabled?: boolean;
  }
}

export {};
