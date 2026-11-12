import axios from "axios";

export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");

export const authenticatedRequest = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export async function uploadFiles(files, token, onProgress) {
  const selectedFiles = Array.from(files);
  if (!selectedFiles.length) {
    throw new Error("Choose at least one video, image, or audio file.");
  }
  const metadata = await Promise.all(selectedFiles.map(readMetadata));
  const data = new FormData();
  selectedFiles.forEach((file) => data.append("files", file));
  data.append("metadata", JSON.stringify(metadata));

  const response = await axios.post(`${API_URL}/api/media/upload`, data, {
    ...authenticatedRequest(token),
    onUploadProgress: (event) => {
      if (event.total) onProgress?.(Math.round((event.loaded * 100) / event.total));
    },
  });
  return response.data.assets;
}

function readMetadata(file) {
  return new Promise((resolve) => {
    const extension = file.name.split(".").pop()?.toLowerCase();
    const kind = file.type.startsWith("video/")
      ? "video"
      : file.type.startsWith("audio/")
        ? "audio"
        : file.type.startsWith("image/")
          ? "image"
          : getKindFromExtension(extension);
    if (!kind) {
      resolve({ duration: 0, width: 0, height: 0 });
      return;
    }
    const fallback = { duration: 0, width: 0, height: 0 };
    const url = URL.createObjectURL(file);

    if (kind === "image") {
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ duration: 0, width: image.naturalWidth, height: image.naturalHeight });
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(fallback);
      };
      image.src = url;
      return;
    }

    const media = document.createElement(kind);
    media.preload = "metadata";
    media.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve({
        duration: Number.isFinite(media.duration) ? media.duration : 0,
        width: media.videoWidth || 0,
        height: media.videoHeight || 0,
      });
    };
    media.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(fallback);
    };
    media.src = url;
  });
}

function getKindFromExtension(extension) {
  if (["mp4", "mov", "webm", "m4v", "mkv", "avi", "3gp"].includes(extension)) return "video";
  if (["mp3", "wav", "m4a", "aac", "ogg", "flac"].includes(extension)) return "audio";
  if (["png", "jpg", "jpeg", "gif", "webp", "bmp", "avif", "svg"].includes(extension)) return "image";
  return null;
}
