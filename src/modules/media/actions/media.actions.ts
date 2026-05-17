"use server";

import { CloudinaryService } from "@/integrations/cloudinary/cloudinary.service";

export async function uploadMediaAction(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    const folder = formData.get("folder") as string || "general";
    
    if (!file) {
      return { success: false, error: "No file provided" };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = `data:${file.type};base64,${buffer.toString("base64")}`;

    const result = await CloudinaryService.uploadImage(base64Image, folder);
    
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Media Upload Error:", error);
    return { success: false, error: error.message || "Upload failed" };
  }
}
