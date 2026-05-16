import { prisma } from "@/services/prisma.service";

export class DeleteStaffService {
  static async execute(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new Error("User not found");
    }

    return prisma.user.delete({
      where: { id },
    });
  }
}
