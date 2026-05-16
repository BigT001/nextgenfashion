import { prisma } from "@/services/prisma.service";

export class GetStaffService {
  static async execute() {
    return prisma.user.findMany({
      where: {
        role: {
          in: ["STAFF", "ADMIN", "SUPERADMIN"],
        },
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
      },
    });
  }
}
