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

        const inputEmail = (credentials.email as string).trim();
        const inputPassword = credentials.password as string;

        const envAdminEmail = process.env.ADMIN_EMAIL?.trim();
        const envAdminPassword = process.env.ADMIN_PASSWORD;

        // If credentials match the ADMIN_EMAIL specified in .env, ensure DB user exists & password is in sync
        if (envAdminEmail && inputEmail.toLowerCase() === envAdminEmail.toLowerCase()) {
          const isEnvPasswordValid = envAdminPassword ? inputPassword === envAdminPassword : false;

          let adminUser = await prisma.user.findUnique({
            where: { email: envAdminEmail },
          });

          if (isEnvPasswordValid) {
            const hashedPassword = await bcrypt.hash(envAdminPassword!, 12);

            if (!adminUser) {
              adminUser = await prisma.user.create({
                data: {
                  email: envAdminEmail,
                  name: "System Admin",
                  password: hashedPassword,
                  role: "SUPERADMIN",
                  category: "Executive",
                  permissions: ["ALL"],
                },
              });
            } else if (!adminUser.password || !(await bcrypt.compare(envAdminPassword!, adminUser.password))) {
              adminUser = await prisma.user.update({
                where: { email: envAdminEmail },
                data: {
                  password: hashedPassword,
                  role: "SUPERADMIN",
                  isSuspended: false,
                },
              });
            }

            return {
              id: adminUser.id,
              name: adminUser.name || "System Admin",
              email: adminUser.email,
              role: adminUser.role,
              customerId: adminUser.customerId,
              category: adminUser.category,
              permissions: adminUser.permissions,
            } as any;
          }
        }

        const user = await prisma.user.findUnique({
          where: { email: inputEmail },
        });

        console.log(`[AUTH] Attempting login for ${inputEmail}. Found user: ${!!user}, Role: ${user?.role}`);

        if (!user || !user.password) return null;

        if (user.isSuspended) {
          console.log(`[AUTH] Login blocked: User ${inputEmail} is suspended.`);
          return null;
        }

        const isPasswordValid = await bcrypt.compare(inputPassword, user.password);
        console.log(`[AUTH] Password valid: ${isPasswordValid}`);

        if (isPasswordValid) {
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            customerId: user.customerId,
            category: user.category,
            permissions: user.permissions,
          } as any;
        }

        return null;
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
  },
});
