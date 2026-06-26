import { prisma } from "@/services/prisma.service";

export class DeleteStaffService {
  static async execute(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new Error("User not found");
    }

    if (user.role === "SUPERADMIN") {
      throw new Error("Super admin accounts cannot be deleted");
    }

    // Delete related Account and Session records first to avoid foreign‑key issues
    await prisma.$transaction([
      prisma.account.deleteMany({ where: { userId: id } }),
      prisma.session.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } }),
    ]);

    return { success: true };
  }
}
