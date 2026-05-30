"use server";

import { CustomerQueries } from "../queries/customer.queries";
import { prisma } from "@/services/prisma.service";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { NotificationService } from "@/services/notification.service";

/**
 * Fetch all data required for the Customer Management Dashboard
 */
export async function getCustomerDashboardAction() {
  try {
    const customers = await CustomerQueries.getAllCustomers();
    const kpis = await CustomerQueries.getCRMKPIs();

    const processedCustomers = customers.map(customer => {
      const totalSpent = customer.sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
      const sortedSales = [...customer.sales].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const lastOrder = sortedSales.length > 0 ? sortedSales[0].createdAt.toISOString() : null;

      return {
        ...customer,
        totalSpent,
        lastOrder
      };
    });

    return {
      success: true,
      data: JSON.parse(JSON.stringify({
        customers: processedCustomers,
        kpis
      }))
    };
  } catch (error) {
    console.error("Error fetching customer dashboard data:", error);
    return { success: false, error: "Failed to load customer management data" };
  }
}

/**
 * Fetch deep-dive intelligence for a specific customer
 */
export async function getCustomerDetailAction(customerId: string) {
  try {
    const details = await CustomerQueries.getCustomerDetails(customerId);
    if (!details) return { success: false, error: "Customer intelligence not found" };

    return {
      success: true,
      data: JSON.parse(JSON.stringify(details))
    };
  } catch (error) {
    console.error("Error fetching customer details:", error);
    return { success: false, error: "Failed to perform relationship audit" };
  }
}

/**
 * Register a new customer into the system (User Account + Customer CRM record)
 */
export async function registerCustomerAction(data: {
  name: string;
  email: string;
  phone: string;
  password: string;
}) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return { success: false, error: "An account with this email already exists." };
    }

    const existingCustomerPhone = await prisma.customer.findUnique({
      where: { phone: data.phone },
    });

    if (existingCustomerPhone) {
      return { success: false, error: "This phone number is already registered to another account." };
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Customer record
      const customer = await tx.customer.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
        },
      });

      // 2. Create User record linked to Customer
      // Using 'connect' and 'as any' to force compatibility with Next.js's potential server-side cache
      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          role: (UserRole?.CUSTOMER || "CUSTOMER") as any,
          customer: {
            connect: { id: customer.id }
          }
        } as any,
      });

      return { user, customer };
    });

    // 3. NOTIFICATION: send welcome SMS and email after registration
    // Await the email send to ensure it runs before the action returns.
    const [smsResult, emailResult] = await Promise.allSettled([
      NotificationService.sendWelcomeSms({
        phone: data.phone,
        name: data.name,
      }),
      NotificationService.sendCustomerWelcomeEmail({
        email: data.email,
        name: data.name,
      }),
    ]);

    if (smsResult.status === "rejected") {
      console.error("Welcome SMS failed:", smsResult.reason);
    }

    if (emailResult.status === "rejected" || (emailResult.status === "fulfilled" && emailResult.value?.success === false)) {
      console.error("Welcome email failed:", emailResult.status === "rejected" ? emailResult.reason : emailResult.value?.error);
    }

    return {
      success: true,
      data: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
      },
    };
  } catch (error) {
    console.error("Registration error:", error);
    
    // Handle Prisma unique constraint errors that might slip through race conditions
    if ((error as any).code === 'P2002') {
      const target = (error as any).meta?.target;
      if (Array.isArray(target) && target.includes('phone')) {
        return { success: false, error: "This phone number is already in use." };
      }
      if (Array.isArray(target) && target.includes('email')) {
        return { success: false, error: "This email address is already in use." };
      }
    }

    return { 
      success: false, 
      error: "Failed to create customer account. Please verify your details." 
    };
  }
}

/**
 * Search for customers in the CRM
 */
export async function searchCustomersAction(query?: string) {
  try {
    const customers = await CustomerQueries.searchCustomers(query);
    return { success: true, data: JSON.parse(JSON.stringify(customers)) };
  } catch (error) {
    console.error("Error searching customers:", error);
    return { success: false, error: "Failed to locate patrons" };
  }
}

/**
 * Rapid creation of customers from the POS interface
 */
export async function createPOSCustomerAction(data: {
  name: string;
  email: string;
  phone: string;
}) {
  try {
    // Default password as requested
    const defaultPassword = "123456";
    
    // Delegate to existing robust registration logic
    return registerCustomerAction({
      ...data,
      password: defaultPassword
    });
  } catch (error: any) {
    console.error("POS Customer Creation Error:", error);
    return { success: false, error: error.message || "Failed to create customer" };
  }
}
/**
 * Update patron details (Self-service)
 */
export async function updatePatronDetailsAction(data: {
  customerId: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  imageUrl?: string;
}) {
  try {
    const { customerId, ...updateData } = data;
    
    // Check if email or phone is being updated and if it's already in use
    if (updateData.email) {
      const existingUser = await prisma.user.findFirst({
        where: { email: updateData.email, NOT: { customerId } },
      });
      if (existingUser) return { success: false, error: "Email already in use." };
    }

    if (updateData.phone) {
      const existingCustomer = await prisma.customer.findFirst({
        where: { phone: updateData.phone, NOT: { id: customerId } },
      });
      if (existingCustomer) return { success: false, error: "Phone number already in use." };
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Customer record
      const customer = await tx.customer.update({
        where: { id: customerId },
        data: {
          name: updateData.name,
          email: updateData.email,
          phone: updateData.phone,
          address: updateData.address,
          image: updateData.imageUrl,
        },
      });

      // 2. Update linked User record if name or email changed
      if (updateData.name || updateData.email || updateData.imageUrl) {
        await tx.user.updateMany({
          where: { customerId },
          data: {
            name: updateData.name,
            email: updateData.email,
            image: updateData.imageUrl,
          },
        });
      }

      return customer;
    });

    return { success: true, data: JSON.parse(JSON.stringify(result)) };
  } catch (error: any) {
    console.error("Update Patron Error:", error);
    return { success: false, error: error.message || "Failed to update details" };
  }
}

/**
 * Archive patron account
 */
export async function archiveCustomerAction(customerId: string, password?: string) {
  try {
    // If password is provided, verify it before archiving
    if (password) {
      const user = await prisma.user.findUnique({
        where: { customerId },
      });

      if (!user || !user.password) {
        return { success: false, error: "Identity authentication failed." };
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return { success: false, error: "Password verification failed. Please try again." };
      }
    }

    await CustomerQueries.archiveCustomer(customerId);
    return { success: true };
  } catch (error: any) {
    console.error("Archive Account Error:", error);
    return { success: false, error: error.message || "Failed to archive account" };
  }
}

/**
 * Unarchive patron account
 */
export async function unarchiveCustomerAction(customerId: string) {
  try {
    await CustomerQueries.unarchiveCustomer(customerId);
    return { success: true };
  } catch (error: any) {
    console.error("Unarchive Account Error:", error);
    return { success: false, error: error.message || "Failed to unarchive account" };
  }
}

/**
 * Fetch archived customers
 */
export async function getArchivedCustomersAction() {
  try {
    const customers = await CustomerQueries.getArchivedCustomers();
    return { success: true, data: JSON.parse(JSON.stringify(customers)) };
  } catch (error: any) {
    console.error("Fetch Archived Error:", error);
    return { success: false, error: "Failed to load archived customers" };
  }
}
/**
 * Change patron password
 */
export async function changePatronPasswordAction(data: {
  customerId: string;
  oldPassword?: string;
  newPassword: string;
}) {
  try {
    const user = await prisma.user.findUnique({
      where: { customerId: data.customerId },
    });

    if (!user || !user.password) {
      return { success: false, error: "Identity authentication failed." };
    }

    // Only verify old password if it was provided (some accounts might have different flows)
    if (data.oldPassword) {
      const isPasswordValid = await bcrypt.compare(data.oldPassword, user.password);
      if (!isPasswordValid) {
        return { success: false, error: "Existing password verification failed." };
      }
    }

    const hashedNewPassword = await bcrypt.hash(data.newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Change Password Error:", error);
    return { success: false, error: error.message || "Failed to modify security credentials" };
  }
}
