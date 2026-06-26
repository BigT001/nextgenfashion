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
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isOnAccount = nextUrl.pathname.startsWith("/account");
      
      if (isOnDashboard) {
        if (!isLoggedIn) {
          return Response.redirect(new URL("/auth/staff", nextUrl));
        }

        if (userRole !== "SUPERADMIN" && userRole !== "ADMIN" && userRole !== "STAFF") {
          return Response.redirect(new URL("/auth/staff", nextUrl));
        }

        if (nextUrl.pathname.startsWith("/dashboard/settings")) {
          const userCategory = (auth?.user as any)?.category;
          if (userRole !== "SUPERADMIN" && userCategory !== "Digital Marketer") {
            return Response.redirect(new URL("/dashboard?error=AccessDenied", nextUrl));
          }
        }

        // If user is STAFF, enforce module permissions
        if (userRole === "STAFF") {
          const rawPermissions = (auth?.user as any)?.permissions;
          const userPermissions = Array.isArray(rawPermissions) && rawPermissions.length > 0
            ? rawPermissions
            : ["POS", "PRODUCTS", "INVENTORY", "ORDERS", "CUSTOMERS", "STAFF", "ANALYTICS"];
          
          if (nextUrl.pathname.startsWith("/dashboard/pos") && !userPermissions.includes("POS")) {
            return Response.redirect(new URL("/dashboard?error=AccessDenied", nextUrl));
          }
          if (nextUrl.pathname.startsWith("/dashboard/products") && !userPermissions.includes("PRODUCTS")) {
            return Response.redirect(new URL("/dashboard?error=AccessDenied", nextUrl));
          }
          if (nextUrl.pathname.startsWith("/dashboard/inventory") && !userPermissions.includes("INVENTORY")) {
            return Response.redirect(new URL("/dashboard?error=AccessDenied", nextUrl));
          }
          if (nextUrl.pathname.startsWith("/dashboard/orders") && !userPermissions.includes("ORDERS")) {
            return Response.redirect(new URL("/dashboard?error=AccessDenied", nextUrl));
          }
          if (nextUrl.pathname.startsWith("/dashboard/customers") && !userPermissions.includes("CUSTOMERS")) {
            return Response.redirect(new URL("/dashboard?error=AccessDenied", nextUrl));
          }
          if (nextUrl.pathname.startsWith("/dashboard/staff") && !userPermissions.includes("STAFF")) {
            return Response.redirect(new URL("/dashboard?error=AccessDenied", nextUrl));
          }
          if (nextUrl.pathname.startsWith("/dashboard/analytics") && !userPermissions.includes("ANALYTICS")) {
            return Response.redirect(new URL("/dashboard?error=AccessDenied", nextUrl));
          }
        }

        return true;
      }

      if (isOnAccount) {
        if (isLoggedIn) return true;
        return false;
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.customerId = (user as any).customerId;
        token.category = (user as any).category;
        token.permissions = (user as any).permissions;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string || token.sub as string;
        (session.user as any).role = token.role as string;
        (session.user as any).customerId = token.customerId as string;
        (session.user as any).category = token.category as string;
        (session.user as any).permissions = token.permissions as string[];
      }
      return session;
    },
  },
  providers: [], // Will be populated in auth.service.ts
} satisfies NextAuthConfig;
