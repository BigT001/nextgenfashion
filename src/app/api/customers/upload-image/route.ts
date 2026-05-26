import { NextResponse } from "next/server";
import { auth } from "@/services/auth.service";
import { CloudinaryService } from "@/integrations/cloudinary/cloudinary.service";
import { prisma } from "@/services/prisma.service";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !(session.user as any)?.customerId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const folder = (formData.get("folder") as string) || "profiles";

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = `data:${file.type};base64,${buffer.toString("base64")}`;

    const uploadResult = await CloudinaryService.uploadImage(base64Image, folder);

    const customerId = (session.user as any).customerId;
    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: { image: uploadResult.url },
    });

    await prisma.user.updateMany({
      where: { customerId },
      data: { image: uploadResult.url },
    });

    return NextResponse.json({ success: true, data: { url: uploadResult.url, customer: updatedCustomer } });
  } catch (error: any) {
    console.error("Upload image route error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Upload failed" }, { status: 500 });
  }
}
