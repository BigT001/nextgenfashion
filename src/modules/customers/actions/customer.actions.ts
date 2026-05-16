"use server";

import { CustomerQueries } from "../queries/customer.queries";
import { prisma } from "@/services/prisma.service";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";

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
      return { success: false, error: "Digital identity already exists." };
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
    // Return a more descriptive error for the UI
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create customer account." 
    };
  }
}

/**
 * Search for customers in the CRM
 */
export async function searchCustomersAction(query?: string) {
  try {
    const customers = await CustomerQueries.searchCustomers(query);
    return { success: true, data: customers };
  } catch (error) {
    console.error("Error searching customers:", error);
    return { success: false, error: "Failed to locate patrons" };
  }
}
