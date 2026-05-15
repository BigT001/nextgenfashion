"use server";

import { revalidatePath } from "next/cache";

export async function getWarehousesAction() {
  try {
    const { prisma } = await import("@/services/prisma.service");
    const warehouses = await prisma.warehouse.findMany({
      include: {
        _count: {
          select: { inventories: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    return { success: true, data: JSON.parse(JSON.stringify(warehouses)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createWarehouseAction(data: { name: string; location?: string; capacity?: number }) {
  try {
    const { prisma } = await import("@/services/prisma.service");
    const warehouse = await prisma.warehouse.create({
      data
    });
    revalidatePath("/dashboard/products");
    return { success: true, data: JSON.parse(JSON.stringify(warehouse)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteWarehouseAction(id: string) {
  try {
    const { prisma } = await import("@/services/prisma.service");
    await prisma.warehouse.delete({
      where: { id }
    });
    revalidatePath("/dashboard/products");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
