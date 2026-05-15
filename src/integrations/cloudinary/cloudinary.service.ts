import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export class CloudinaryService {
  static async uploadImage(fileUri: string, folder: string = "products") {
    try {
      const result = await cloudinary.uploader.upload(fileUri, {
        folder: `nextgenfashion/${folder}`,
        resource_type: "auto",
      });
      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw new Error("Failed to upload image to Cloudinary");
    }
  }

  static async deleteImage(publicId: string) {
    try {
      await cloudinary.uploader.destroy(publicId);
      return { success: true };
    } catch (error) {
      console.error("Cloudinary delete error:", error);
      throw new Error("Failed to delete image from Cloudinary");
    }
  }
}
