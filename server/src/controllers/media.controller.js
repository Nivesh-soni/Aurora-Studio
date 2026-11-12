import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import multer from "multer";

const uploadDirectory = fileURLToPath(new URL("../../uploads/", import.meta.url));
mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDirectory,
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, "")
      || ({ "image/jpeg": ".jpg", "audio/mpeg": ".mp3", "video/mp4": ".mp4", "video/quicktime": ".mov" }[file.mimetype] || ".bin");
    callback(null, `${randomUUID()}${extension}`);
  },
});

const mediaTypesByExtension = new Map([
  [".mp4", "video/mp4"],
  [".mov", "video/quicktime"],
  [".webm", "video/webm"],
  [".m4v", "video/x-m4v"],
  [".mkv", "video/x-matroska"],
  [".avi", "video/x-msvideo"],
  [".3gp", "video/3gpp"],
  [".mp3", "audio/mpeg"],
  [".wav", "audio/wav"],
  [".m4a", "audio/mp4"],
  [".aac", "audio/aac"],
  [".ogg", "audio/ogg"],
  [".flac", "audio/flac"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".gif", "image/gif"],
  [".webp", "image/webp"],
  [".bmp", "image/bmp"],
  [".avif", "image/avif"],
  [".svg", "image/svg+xml"],
]);

export const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 1024, files: 40 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const mimeType = /^(video|image|audio)\//.test(file.mimetype)
      ? file.mimetype
      : mediaTypesByExtension.get(extension);
    if (!mimeType) {
      const error = new Error(`Unsupported media type: ${file.mimetype || extension || "unknown"}`);
      error.status = 400;
      callback(error);
      return;
    }
    file.mimetype = mimeType;
    callback(null, true);
  },
});

export const uploadMedia = (req, res) => {
  const files = req.files ?? [];
  if (!files.length) {
    res.status(400).json({ error: "Choose at least one media file to upload." });
    return;
  }

  let metadata = [];
  try {
    metadata = JSON.parse(req.body.metadata || "[]");
  } catch {
    res.status(400).json({ error: "Media metadata is invalid." });
    return;
  }

  res.status(201).json({
    assets: files.map((file, index) => ({
      id: path.parse(file.filename).name,
      fileName: file.filename,
      name: file.originalname,
      type: file.mimetype,
      kind: file.mimetype.startsWith("video/") ? "video" : file.mimetype.startsWith("audio/") ? "audio" : "image",
      size: file.size,
      duration: Number(metadata[index]?.duration) || 0,
      width: Number(metadata[index]?.width) || 0,
      height: Number(metadata[index]?.height) || 0,
      url: `${req.protocol}://${req.get("host")}/uploads/${encodeURIComponent(file.filename)}`,
    })),
  });
};
