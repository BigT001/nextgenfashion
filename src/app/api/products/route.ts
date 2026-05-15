import { NextResponse } from "next/server";
import { GetProductsService } from "@/modules/products/services/get-products.service";
import { CreateProductService } from "@/modules/products/services/create-product.service";

/**
 * GET ALL / CREATE PRODUCTS
 * Layer 2: API Route Handler
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId") || undefined;
    const search = searchParams.get("search") || undefined;

    const products = await GetProductsService.execute({ categoryId, search });
    return NextResponse.json(products);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productData, variants } = body;
    
    const product = await CreateProductService.execute(productData, variants);
    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
