import { prisma } from "@/services/prisma.service";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { NotificationService } from "@/services/notification.service";

export interface CreateStaffDTO {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  isSuspended?: boolean;
  category?: string;
  permissions?: string[];
}

export class CreateStaffService {
  static async execute(data: CreateStaffDTO) {
    const { name, email, password, role, isSuspended = false, category = "Staff", permissions = [] } = data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

    const staff = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        isSuspended,
        category,
        permissions,
      },
    });

    // 2. ASYNC NOTIFICATION: Staff Invite Email
    NotificationService.sendStaffInviteEmail({
        email,
        name,
        role: staff.role
    }).catch(err => console.error("Staff invite email failed:", err));

    return staff;
  }
}
