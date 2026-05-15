import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/services/prisma.service";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "@/config/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@nextgen.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        console.log(`[AUTH] Attempting login for ${credentials.email}. Found user: ${!!user}, Role: ${user?.role}`);

        if (!user || !user.password) return null;

        const isPasswordValid = await bcrypt.compare(credentials.password as string, user.password);
        console.log(`[AUTH] Password valid: ${isPasswordValid}`);

        if (isPasswordValid) {
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            customerId: user.customerId,
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
  },
});
