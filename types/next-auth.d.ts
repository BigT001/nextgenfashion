import type { DefaultSession } from "next-auth";

export type NextAuthUserRole = "SUPERADMIN" | "ADMIN" | "STAFF" | "CUSTOMER";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: NextAuthUserRole;
      customerId?: string | null;
      category?: string | null;
      permissions?: string[] | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: NextAuthUserRole;
    customerId?: string | null;
    category?: string | null;
    permissions?: string[] | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: NextAuthUserRole;
    customerId?: string | null;
    category?: string | null;
    permissions?: string[] | null;
  }
}
