import { getServerSession, type Session } from "next-auth";

import { authOptions } from "@/server/auth/options";

type SessionUser = NonNullable<Session["user"]>;

export type RequireUserResult = {
  id: string;
  email?: string | null;
  role: SessionUser["role"];
  disabled: boolean;
};

/**
 * Retrieve the current authenticated user on the server.
 *
 * Examples:
 * - API route: `const user = await requireUser();`
 *   within `app/api/example/route.ts` before handling the request.
 * - Server component/action: call `const user = await requireUser();`
 *   to gate rendering or perform writes on behalf of the user.
 */
export const requireUser = async (): Promise<RequireUserResult> => {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new Error("Unauthorized: user session not found");
  }

  if (session.user.disabled) {
    throw new Error("Unauthorized: user account is disabled");
  }

  const { id, email, role, disabled } = session.user;

  return { id, email, role, disabled };
};

export const requireAdmin = async (): Promise<RequireUserResult> => {
  const user = await requireUser();

  if (user.role !== "ADMIN") {
    throw new Error("Forbidden: admin access required");
  }

  return user;
};
