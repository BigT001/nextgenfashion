import { NextResponse } from "next/server";
import { GetProductsService } from "@/modules/products/services/get-products.service";

/**
 * GET ONE / UPDATE / DELETE PRODUCT
 * Layer 2: API Route Handler
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await GetProductsService.byId(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH / DELETE would delegate to UpdateProductService / DeleteProductService
