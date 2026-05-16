import { prisma } from "@/services/prisma.service";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";

export interface UpdateStaffDTO {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
}

export class UpdateStaffService {
  static async execute(id: string, data: UpdateStaffDTO) {
    const { name, email, password, role } = data;

    if (email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== id) {
        throw new Error("User with this email already exists");
      }
    }

    const updateData: any = { name, email, role };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    return prisma.user.update({
      where: { id },
      data: updateData,
    });
  }
}
