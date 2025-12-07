import { getServerSession, type Session } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";

type SessionUser = NonNullable<Session["user"]>;

export type RequireUserResult = {
  id: string;
  email?: string | null;
  role: SessionUser["role"];
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

  const { id, email, role } = session.user;

  return { id, email, role };
};
