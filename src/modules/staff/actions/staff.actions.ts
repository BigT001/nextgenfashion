"use server";

import { revalidatePath } from "next/cache";
import { GetStaffService } from "../services/get-staff.service";
import { CreateStaffService, CreateStaffDTO } from "../services/create-staff.service";
import { UpdateStaffService, UpdateStaffDTO } from "../services/update-staff.service";
import { DeleteStaffService } from "../services/delete-staff.service";

export async function getStaffAction() {
  try {
    const staff = await GetStaffService.execute();
    return { success: true, data: staff };
  } catch (error: any) {
    console.error("Fetch staff error:", error);
    return { success: false, error: error.message };
  }
}

export async function createStaffAction(data: CreateStaffDTO) {
  try {
    const { auth } = await import("@/services/auth.service");
    const session = await auth();
    const actorId = session?.user?.id || "system";

    const staff = await CreateStaffService.execute(data);

    // Create Audit Log
    const { prisma } = await import("@/services/prisma.service");
    await prisma.auditLog.create({
      data: {
        userId: actorId,
        action: "STAFF_INVITED",
        entity: "User",
        entityId: staff.id,
        details: {
          name: staff.name,
          email: staff.email,
          role: staff.role,
          category: staff.category,
        }
      }
    });

    revalidatePath("/dashboard/staff");
    return { success: true, data: JSON.parse(JSON.stringify(staff)) };
  } catch (error: any) {
    console.error("Create staff error:", error);
    return { success: false, error: error.message };
  }
}

export async function updateStaffAction(id: string, data: UpdateStaffDTO) {
  try {
    const { auth } = await import("@/services/auth.service");
    const session = await auth();
    const actorId = session?.user?.id || "system";

    const staff = await UpdateStaffService.execute(id, data);

    // Create Audit Log
    const { prisma } = await import("@/services/prisma.service");
    await prisma.auditLog.create({
      data: {
        userId: actorId,
        action: data.isSuspended !== undefined ? (data.isSuspended ? "STAFF_SUSPENDED" : "STAFF_ACTIVATED") : "STAFF_UPDATED",
        entity: "User",
        entityId: staff.id,
        details: {
          name: staff.name,
          email: staff.email,
          role: staff.role,
          category: staff.category,
          updatedFields: Object.keys(data),
        }
      }
    });

    revalidatePath("/dashboard/staff");
    return { success: true, data: JSON.parse(JSON.stringify(staff)) };
  } catch (error: any) {
    console.error("Update staff error:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteStaffAction(id: string) {
  try {
    const { auth } = await import("@/services/auth.service");
    const session = await auth();
    const actorId = session?.user?.id || "system";

    const { prisma } = await import("@/services/prisma.service");
    const staff = await prisma.user.findUnique({ where: { id } });

    await DeleteStaffService.execute(id);

    if (staff) {
      await prisma.auditLog.create({
        data: {
          userId: actorId,
          action: "STAFF_DELETED",
          entity: "User",
          entityId: id,
          details: {
            name: staff.name,
            email: staff.email,
            role: staff.role,
          }
        }
      });
    }

    revalidatePath("/dashboard/staff");
    return { success: true };
  } catch (error: any) {
    console.error("Delete staff error:", error);
    return { success: false, error: error.message };
  }
}

export async function getStaffLogsAction(staffId: string, staffName?: string, staffEmail?: string) {
  try {
    const { prisma } = await import("@/services/prisma.service");
    
    // Support querying by ID, Name, or Email to capture system audit logs (which use names as actor ids sometimes)
    const OR_filters: any[] = [{ userId: staffId }];
    if (staffName) OR_filters.push({ userId: staffName });
    if (staffEmail) OR_filters.push({ userId: staffEmail });

    const logs = await prisma.auditLog.findMany({
      where: {
        OR: OR_filters
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 30
    });

    // Retroactively hydrate logs with actual product/variant titles, sizes, colors and items if missing
    const possibleVariantIds = logs
      .filter(l => ["STOCK_DECREMENT", "STOCK_INCREMENT", "LOW_STOCK_ALERT"].includes(l.action))
      .map(l => l.entityId);

    const variants = await prisma.productVariant.findMany({
      where: { id: { in: possibleVariantIds } },
      include: { product: true }
    });

    const variantMap = new Map(variants.map(v => [v.id, v]));

    const possibleProductIds = logs
      .filter(l => ["PRODUCT_SUSPENDED", "PRODUCT_ACTIVATED"].includes(l.action))
      .map(l => l.entityId);

    const products = await prisma.product.findMany({
      where: { id: { in: possibleProductIds } }
    });

    const productMap = new Map(products.map(p => [p.id, p]));

    const saleIds = logs
      .filter(l => l.action === "SALE_COMPLETED")
      .map(l => l.entityId);

    const sales = await prisma.sale.findMany({
      where: { id: { in: saleIds } },
      include: {
        items: {
          include: {
            variant: {
              include: { product: true }
            }
          }
        }
      }
    });

    const saleMap = new Map(sales.map(s => [s.id, s]));

    const hydratedLogs = logs.map(log => {
      const details = (log.details as any) || {};

      if (["STOCK_DECREMENT", "STOCK_INCREMENT", "LOW_STOCK_ALERT"].includes(log.action)) {
        const variant = variantMap.get(log.entityId);
        if (variant) {
          details.productName = `${variant.product.name} (${variant.size || ""}${variant.color ? ` / ${variant.color}` : ""})`;
          details.sku = variant.sku;
        }
      }

      if (["PRODUCT_SUSPENDED", "PRODUCT_ACTIVATED"].includes(log.action)) {
        const product = productMap.get(log.entityId);
        if (product) {
          details.productName = product.name;
        }
      }

      if (log.action === "SALE_COMPLETED" && (!details.items || details.items.length === 0)) {
        const sale = saleMap.get(log.entityId);
        if (sale) {
          details.items = sale.items.map(item => ({
            productName: item.variant.product.name,
            sku: item.variant.sku,
            size: item.variant.size,
            color: item.variant.color,
            quantity: item.quantity,
            price: Number(item.price),
          }));
        }
      }

      return {
        ...log,
        details
      };
    });

    return { success: true, data: JSON.parse(JSON.stringify(hydratedLogs)) };
  } catch (error: any) {
    console.error("Fetch staff logs error:", error);
    return { success: false, error: error.message };
  }
}
