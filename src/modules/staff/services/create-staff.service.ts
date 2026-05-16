import { prisma } from "@/services/prisma.service";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";

export interface CreateStaffDTO {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
}

export class CreateStaffService {
  static async execute(data: CreateStaffDTO) {
    const { name, email, password, role } = data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

    return prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
    });
  }
}
