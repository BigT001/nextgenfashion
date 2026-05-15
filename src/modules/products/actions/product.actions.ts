"use server";

import { CreateProductService } from "@/modules/products/services/create-product.service";
import { UpdateProductService } from "@/modules/products/services/update-product.service";
import { DeleteProductService } from "@/modules/products/services/delete-product.service";
import { UpdateStockService } from "@/modules/inventory/services/update-stock.service";
import { ProductQueries } from "@/modules/products/queries/product.queries";
import { CloudinaryService } from "@/integrations/cloudinary/cloudinary.service";
import { revalidatePath } from "next/cache";

/**
 * PRODUCT ACTIONS
 * Layer 2: Actions/API Layer
 */
export async function uploadImageAction(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) throw new Error("No file provided");

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Convert buffer to base64 for Cloudinary
    const fileBase64 = `data:${file.type};base64,${buffer.toString("base64")}`;
    const result = await CloudinaryService.uploadImage(fileBase64);
    
    return { success: true, ...result };
  } catch (error: any) {
    console.error("Upload error:", error);
    return { success: false, error: error.message };
  }
}

export async function createProductAction(data: any) {
  try {
    const { variants, categoryId, images, ...productData } = data;
    
    // Process basePrice - use the lowest variant price if not provided
    const basePrice = productData.basePrice || Math.min(...variants.map((v: any) => v.price));

    const product = await CreateProductService.execute(
      { 
        ...productData, 
        basePrice, 
        categoryId,
        images: images?.map((img: any) => img.url) || []
      },
      variants
    );

    revalidatePath("/inventory");
    revalidatePath("/"); // Update storefront
    return { success: true, data: JSON.parse(JSON.stringify(product)) };
  } catch (error: any) {
    console.error("Action error:", error);
    return { success: false, error: error.message };
  }
}

export async function updateProductAction(id: string, data: any) {
  try {
    const result = await UpdateProductService.execute(id, data);
    revalidatePath("/inventory");
    revalidatePath("/");
    return { success: true, data: JSON.parse(JSON.stringify(result)) };
  } catch (error: any) {
    console.error("Update error:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteProductAction(id: string) {
  try {
    await DeleteProductService.execute(id);
    revalidatePath("/inventory");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Delete error:", error);
    return { success: false, error: error.message };
  }
}

export async function updateStockAction(variantId: string, quantityChange: number, reason: string) {
  try {
    const result = await UpdateStockService.execute(variantId, quantityChange, reason);
    revalidatePath("/inventory");
    return { success: true, data: JSON.parse(JSON.stringify(result)) };
  } catch (error: any) {
    console.error("Failed to update stock:", error);
    return { success: false, error: error.message || "Failed to update stock" };
  }
}

export async function getCategoriesAction() {
  try {
    const categories = await ProductQueries.findCategories();
    return { success: true, data: JSON.parse(JSON.stringify(categories)) };
  } catch (error: any) {
    console.error("Fetch categories error:", error);
    return { success: false, error: error.message };
  }
}

export async function createCategoryAction(name: string) {
  try {
    const { prisma } = await import("@/services/prisma.service");
    const category = await prisma.category.create({
      data: { name }
    });
    return { success: true, data: JSON.parse(JSON.stringify(category)) };
  } catch (error: any) {
    console.error("Create category error:", error);
    return { success: false, error: error.message };
  }
}

export async function getProductBySkuAction(sku: string) {
  try {
    const { prisma } = await import("@/services/prisma.service");
    const variant = await prisma.productVariant.findFirst({
      where: { 
        OR: [
          { sku: sku.toUpperCase() },
          { barcode: sku }
        ]
      },
      include: {
        product: {
          include: {
            category: true
          }
        },
        inventory: true
      }
    });
    
    if (!variant) return { success: false, error: "Product not found" };
    return { success: true, data: JSON.parse(JSON.stringify(variant)) };
  } catch (error: any) {
    console.error("Fetch by SKU error:", error);
    return { success: false, error: error.message };
  }
}

export async function emergencyPurgeAction() {
  try {
    const { prisma } = await import("@/services/prisma.service");
    await prisma.inventory.deleteMany({});
    await prisma.productVariant.deleteMany({});
    await prisma.product.deleteMany({});
    revalidatePath("/dashboard/products");
    revalidatePath("/inventory");
    return { success: true };
  } catch (error: any) {
    console.error("Purge error:", error);
    return { success: false, error: error.message };
  }
}
