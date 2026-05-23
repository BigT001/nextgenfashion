"use server";

import { CreateProductService } from "@/modules/products/services/create-product.service";
import { UpdateProductService } from "@/modules/products/services/update-product.service";
import { DeleteProductService } from "@/modules/products/services/delete-product.service";
import { SyncPosProductsService } from "@/modules/products/services/sync-pos-products.service";
import { UpdateStockService } from "@/modules/inventory/services/update-stock.service";
import { ProductQueries } from "@/modules/products/queries/product.queries";
import { CloudinaryService } from "@/integrations/cloudinary/cloudinary.service";
import { MatchImageFilenamesService } from "@/modules/products/services/match-image-filenames.service";
import { LinkProductImageService } from "@/modules/products/services/link-product-image.service";
import { revalidatePath } from "next/cache";

/**
 * PRODUCT ACTIONS
 * Layer 2: Actions/API Layer
 */
export async function uploadImageAction(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) throw new Error("No file provided");

    const publicId = formData.get("publicId");
    const publicIdValue = typeof publicId === "string" && publicId.trim().length > 0 ? publicId.trim() : undefined;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Convert buffer to base64 for Cloudinary
    const fileBase64 = `data:${file.type};base64,${buffer.toString("base64")}`;
    const result = await CloudinaryService.uploadImage(fileBase64, "products", publicIdValue);
    
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

    const normalizedImages = Array.isArray(images)
      ? images.map((img: any) => typeof img === "string" ? img : img?.url).filter((url: any): url is string => typeof url === "string" && url.length > 0)
      : [];

    const product = await CreateProductService.execute(
      { 
        ...productData, 
        basePrice, 
        categoryId,
        images: normalizedImages
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
    const res = await DeleteProductService.execute(id);
    revalidatePath("/inventory");
    revalidatePath("/");
    return res;
  } catch (error: any) {
    console.error("Delete error:", error);
    return { success: false, error: error.message };
  }
}

export async function updateStockAction(variantId: string, quantityChange: number, reason: string) {
  try {
    if (!variantId) {
      return { success: false, error: "This product has no active variants. Please modify the product to add variants before adjusting stock." };
    }

    const { auth } = await import("@/services/auth.service");
    const session = await auth();
    const actor = session?.user?.name || session?.user?.email || "System Admin";

    const result = await UpdateStockService.execute(variantId, quantityChange, reason, actor);
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

export async function getProductByIdAction(id: string) {
  try {
    const product = await ProductQueries.findById(id);
    if (!product) return { success: false, error: "Product not found" };
    return { success: true, data: JSON.parse(JSON.stringify(product)) };
  } catch (error: any) {
    console.error("Fetch by ID error:", error);
    return { success: false, error: error.message };
  }
}

export async function toggleSuspendProductAction(productId: string) {
  try {
    const { prisma } = await import("@/services/prisma.service");
    const { InventoryQueries } = await import("@/modules/inventory/queries/inventory.queries");

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { variants: true }
    });

    if (!product) throw new Error("Product not found");

    const newSuspendedState = !product.isSuspended;

    await prisma.product.update({
      where: { id: productId },
      data: { isSuspended: newSuspendedState }
    });

    const { auth } = await import("@/services/auth.service");
    const session = await auth();
    const actor = session?.user?.name || session?.user?.email || "System Admin";

    // Log the suspension event for all variants so it shows in their history
    for (const variant of product.variants) {
      await InventoryQueries.createAuditLog({
        userId: actor,
        action: newSuspendedState ? "PRODUCT_SUSPENDED" : "PRODUCT_ACTIVATED",
        entity: "ProductVariant",
        entityId: variant.id,
        details: {
          reason: newSuspendedState ? "Admin manually suspended product" : "Admin manually activated product",
          productId: product.id
        }
      });
    }

    revalidatePath("/inventory");
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/products");
    revalidatePath("/");
    
    return { success: true, isSuspended: newSuspendedState };
  } catch (error: any) {
    console.error("Suspend error:", error);
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

export async function importProductsAction(productsList: any[]) {
  try {
    const { prisma } = await import("@/services/prisma.service");
    
    let createdCount = 0;
    
    for (const prod of productsList) {
      const { productName, description, categoryName, gender: rawGender, basePrice, costPrice, tax, imageUrls, variants: rawVariants } = prod;
      
      // Ensure we have at least one variant record to prevent "no variants" empty states
      const variants = [...(rawVariants || [])];
      if (variants.length === 0) {
        variants.push({
          sku: `NGN-${productName.slice(0, 3).toUpperCase()}-OS-DF-${Math.floor(1000 + Math.random() * 9000)}`.toUpperCase(),
          barcode: null,
          size: "OS",
          color: "Default",
          variantPrice: basePrice,
          stockQuantity: 0,
          lowStockThreshold: 5
        });
      }

      // Normalize targetGender string to database enum constraints (BOYS, GIRLS, BOTH)
      const g = (rawGender || "").trim().toUpperCase();
      const gender = ["GIRLS", "FEMALE", "WOMEN", "WOMAN", "LADY", "LADIES"].includes(g) ? "GIRLS" :
                     ["BOYS", "MALE", "MEN", "MAN", "GENTLEMEN"].includes(g) ? "BOYS" : "BOTH";
      
      // 1. Get or Create Category
      let category = await prisma.category.findUnique({
        where: { name: categoryName }
      });
      
      if (!category) {
        category = await prisma.category.create({
          data: {
            name: categoryName,
            description: `Fashion items under the ${categoryName} collection.`
          }
        });
      }
      
      // 2. Upsert Product
      let product = await prisma.product.findFirst({
        where: { name: productName }
      });
      
      if (product) {
        product = await prisma.product.update({
          where: { id: product.id },
          data: {
            description: description || product.description,
            basePrice: basePrice,
            costPrice: costPrice,
            tax: tax,
            images: imageUrls && imageUrls.length > 0 ? imageUrls : product.images,
            targetGender: gender,
            categoryId: category.id
          }
        });
      } else {
        product = await prisma.product.create({
          data: {
            name: productName,
            description: description,
            basePrice: basePrice,
            costPrice: costPrice,
            tax: tax,
            images: imageUrls && imageUrls.length > 0 ? imageUrls : ["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600"],
            targetGender: gender,
            categoryId: category.id
          }
        });
      }
      
      // 3. Process variants and inventories
      for (const v of variants) {
        // Fallback for missing SKU to guarantee unique identity constraint
        const variantSku = (v.sku || `NGN-${productName.slice(0, 3).toUpperCase()}-${v.size || "OS"}-${v.color || "DF"}-${Math.floor(1000 + Math.random() * 9000)}`).toUpperCase();

        let variant = await prisma.productVariant.findUnique({
          where: { sku: variantSku }
        });
        
        if (variant) {
          variant = await prisma.productVariant.update({
            where: { sku: variantSku },
            data: {
              barcode: v.barcode,
              size: v.size || "OS",
              color: v.color || "Default",
              price: v.variantPrice || basePrice
            }
          });
        } else {
          variant = await prisma.productVariant.create({
            data: {
              productId: product.id,
              sku: variantSku,
              barcode: v.barcode,
              size: v.size || "OS",
              color: v.color || "Default",
              price: v.variantPrice || basePrice
            }
          });
        }
        
        // Upsert Inventory
        let inventory = await prisma.inventory.findUnique({
          where: { variantId: variant.id }
        });
        
        if (inventory) {
          await prisma.inventory.update({
            where: { variantId: variant.id },
            data: {
              quantity: v.stockQuantity,
              lowStockThreshold: v.lowStockThreshold || 5
            }
          });
        } else {
          await prisma.inventory.create({
            data: {
              variantId: variant.id,
              quantity: v.stockQuantity,
              lowStockThreshold: v.lowStockThreshold || 5
            }
          });
        }
      }
      
      createdCount++;
    }
    
    revalidatePath("/inventory");
    revalidatePath("/dashboard/products");
    revalidatePath("/");
    
    return { success: true, count: createdCount };
  } catch (error: any) {
    console.error("Bulk Import action error:", error);
    return { success: false, error: error.message };
  }
}

export async function syncPosProductsAction() {
  try {
    const res = await SyncPosProductsService.execute();
    revalidatePath("/inventory");
    revalidatePath("/dashboard/products");
    revalidatePath("/");
    return res;
  } catch (error: any) {
    console.error("POS sync action error:", error);
    return { success: false, error: error.message };
  }
}

export async function matchImageFilenamesAction(filenames: string[]) {
  try {
    const result = await MatchImageFilenamesService.execute(filenames);
    return { success: true, ...result };
  } catch (error: any) {
    console.error("Match filenames action error:", error);
    return { success: false, error: error.message };
  }
}

export async function linkProductImageAction(productId: string, imageUrl: string) {
  try {
    const result = await LinkProductImageService.execute(productId, imageUrl);
    revalidatePath("/dashboard/products");
    revalidatePath("/inventory");
    revalidatePath("/");
    return { success: true, data: JSON.parse(JSON.stringify(result)) };
  } catch (error: any) {
    console.error("Link product image action error:", error);
    return { success: false, error: error.message };
  }
}

