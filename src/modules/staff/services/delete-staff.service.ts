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

    return prisma.user.delete({
      where: { id },
    });
  }
}
