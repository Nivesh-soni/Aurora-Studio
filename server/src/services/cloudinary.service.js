import { v2 as cloudinary } from "cloudinary";

const isConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET,
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export const isCloudinaryConfigured = () => isConfigured;

export const uploadMediaAsset = async ({ filePath, publicId }) => {
  if (!isConfigured) throw new Error("Cloudinary is not configured.");
  if (!filePath || !publicId) throw new Error("A local file and asset ID are required.");

  const result = await cloudinary.uploader.upload(filePath, {
    resource_type: "auto",
    folder: process.env.CLOUDINARY_FOLDER || "aurora-studio",
    public_id: publicId,
    overwrite: true,
  });

  if (!result.secure_url || !result.public_id) {
    throw new Error("Cloudinary did not return the uploaded media details.");
  }
  return { url: result.secure_url, cloudinaryPublicId: result.public_id };
};
