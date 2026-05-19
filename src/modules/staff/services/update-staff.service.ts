import { prisma } from "@/services/prisma.service";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";

export interface UpdateStaffDTO {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  isSuspended?: boolean;
  category?: string;
  permissions?: string[];
}

export class UpdateStaffService {
  static async execute(id: string, data: UpdateStaffDTO) {
    const { name, email, password, role, isSuspended, category, permissions } = data;

    if (email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== id) {
        throw new Error("User with this email already exists");
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (isSuspended !== undefined) updateData.isSuspended = isSuspended;
    if (category !== undefined) updateData.category = category;
    if (permissions !== undefined) updateData.permissions = permissions;

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    return prisma.user.update({
      where: { id },
      data: updateData,
    });
  }
}
