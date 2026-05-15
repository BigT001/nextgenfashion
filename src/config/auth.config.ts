import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const userRole = (auth?.user as any)?.role;
      console.log(`[AUTH_CONFIG] Path: ${nextUrl.pathname}, LoggedIn: ${isLoggedIn}, Role: ${userRole}`);
      console.log(`[AUTH_CONFIG] FULL AUTH OBJ:`, JSON.stringify(auth, null, 2));
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isOnAccount = nextUrl.pathname.startsWith("/account");
      
      if (isOnDashboard) {
        if (isLoggedIn && (userRole === "SUPERADMIN" || userRole === "ADMIN" || userRole === "STAFF")) return true;
        return Response.redirect(new URL("/auth/staff", nextUrl));
      }

      if (isOnAccount) {
        if (isLoggedIn) return true;
        return false;
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.customerId = (user as any).customerId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role as string;
        (session.user as any).customerId = token.customerId as string;
      }
      return session;
    },
  },
  providers: [], // Will be populated in auth.service.ts
} satisfies NextAuthConfig;
