import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export class CloudinaryService {
  static async uploadImage(fileUri: string, folder: string = "products", publicId?: string) {
    try {
      const uploadOptions: Record<string, unknown> = {
        folder: `nextgenfashion/${folder}`,
        resource_type: "auto",
      };
      if (publicId) {
        uploadOptions.public_id = publicId;
      }

      const result = await cloudinary.uploader.upload(fileUri, uploadOptions);
      // Log the returned Cloudinary identifiers for debugging image ownership
      try {
        // eslint-disable-next-line no-console
        console.log(`[CloudinaryService] Uploaded asset: public_id=${result.public_id} secure_url=${result.secure_url}`);
      } catch (e) {}

      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      const message = error instanceof Error ? error.message : JSON.stringify(error);
      throw new Error(`Failed to upload image to Cloudinary: ${message}`);
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

  static async deleteFolder(folder: string) {
    try {
      const prefix = `nextgenfashion/${folder}`;
      await cloudinary.api.delete_resources_by_prefix(prefix, {
        resource_type: "image",
        type: "upload",
      });
      await cloudinary.api.delete_resources_by_prefix(prefix, {
        resource_type: "raw",
        type: "upload",
      });
      await cloudinary.api.delete_resources_by_prefix(prefix, {
        resource_type: "video",
        type: "upload",
      });
      return { success: true };
    } catch (error) {
      console.error("Cloudinary folder deletion error:", error);
      throw new Error("Failed to delete Cloudinary folder resources");
    }
  }

  static getImagePublicIdFromUrl(url: string) {
    try {
      const parsed = new URL(url);
      if (!parsed.hostname.endsWith("res.cloudinary.com")) return undefined;
      const segments = parsed.pathname.split("/").filter(Boolean);
      const versionIndex = segments.findIndex((segment) => /^v\d+$/.test(segment));
      if (versionIndex === -1 || versionIndex === segments.length - 1) return undefined;
      const publicIdParts = segments.slice(versionIndex + 1);
      let publicId = publicIdParts.join("/");
      const extensionIndex = publicId.lastIndexOf(".");
      if (extensionIndex > -1) {
        publicId = publicId.substring(0, extensionIndex);
      }
      return publicId;
    } catch (error) {
      return undefined;
    }
  }
}
