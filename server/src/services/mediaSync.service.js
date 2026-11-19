import { existsSync } from "node:fs";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Project from "../models/project.model.js";
import { isCloudinaryConfigured, uploadMediaAsset } from "./cloudinary.service.js";

const uploadDirectory = fileURLToPath(new URL("../../uploads/", import.meta.url));
const safeFileName = /^[\da-f-]+\.[a-z\d]+$/i;
const syncInProgress = new Set();

export const syncProjectAsset = async (project, asset) => {
  if (!isCloudinaryConfigured()) throw new Error("Cloudinary is not configured.");
  if (asset.syncStatus === "synced") return { status: "synced", asset };

  const key = `${project.id}:${asset.id}`;
  if (syncInProgress.has(key)) return { status: "syncing", asset };
  syncInProgress.add(key);

  const fileName = String(asset.fileName || "");
  const localPath = safeFileName.test(fileName)
    ? path.join(uploadDirectory, fileName)
    : null;

  try {
    if (!localPath || !existsSync(localPath)) {
      throw new Error("Local media file is missing.");
    }

    const cloud = await uploadMediaAsset({ filePath: localPath, publicId: asset.id });
    asset.set("url", cloud.url);
    asset.set("cloudinaryPublicId", cloud.cloudinaryPublicId);
    asset.set("syncStatus", "synced");
    asset.set("syncError", "");
    await project.save();

    await unlink(localPath).catch((error) => {
      if (error.code !== "ENOENT") {
        console.error("Could not remove synchronized local media:", error);
      }
    });
    return { status: "synced", asset };
  } catch (error) {
    asset.set("syncStatus", "failed");
    asset.set("syncError", error.message || "Cloudinary upload failed.");
    await project.save();
    return { status: "failed", error, asset };
  } finally {
    syncInProgress.delete(key);
  }
};

export const processPendingAssetUploads = async () => {
  if (!isCloudinaryConfigured()) return;

  const projects = await Project.find({
    "assets.syncStatus": { $in: ["local", "pending", "failed"] },
  }).limit(100);

  for (const project of projects) {
    for (const asset of project.assets) {
      if (!["local", "pending", "failed"].includes(asset.syncStatus)) continue;
      try {
        const result = await syncProjectAsset(project, asset);
        if (result.status === "failed") {
          console.error(`Cloudinary sync failed for asset ${asset.id}:`, result.error.message);
        }
      } catch (error) {
        console.error(`Could not persist Cloudinary sync state for asset ${asset.id}:`, error);
      }
    }
  }
};

export const startMediaSyncRetries = () => {
  if (!isCloudinaryConfigured()) return null;

  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try {
      await processPendingAssetUploads();
    } catch (error) {
      console.error("Media sync retry failed:", error);
    } finally {
      running = false;
    }
  };

  void run();
  const timer = setInterval(run, 60_000);
  timer.unref();
  return timer;
};
