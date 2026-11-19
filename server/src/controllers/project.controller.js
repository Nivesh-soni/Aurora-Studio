import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { unlink, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { deflateSync } from "node:zlib";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Project from "../models/project.model.js";

const uploadsDirectory = fileURLToPath(
  new URL("../../uploads/", import.meta.url),
);
const exportsDirectory = fileURLToPath(
  new URL("../../exports/", import.meta.url),
);
mkdirSync(exportsDirectory, { recursive: true });

const resolveAssetFile = async (asset) => {
  if (!asset) return null;
  const localPath = filenamePattern.test(asset.fileName || "")
    ? path.join(uploadsDirectory, asset.fileName)
    : null;
  if (localPath && existsSync(localPath)) return localPath;
  if (!asset.url || !/^https?:\/\//i.test(asset.url)) return null;
  const assetUrl = new URL(asset.url);
  if (assetUrl.protocol !== "https:" || assetUrl.hostname !== "res.cloudinary.com") {
    throw new Error("Remote media must use a secure Cloudinary URL.");
  }
  const response = await fetch(assetUrl, { redirect: "error" });
  if (!response.ok) throw new Error(`Could not download media "${asset.name}".`);
  const remoteSize = Number(response.headers.get("content-length"));
  if (Number.isFinite(remoteSize) && remoteSize > 1024 * 1024 * 1024) {
    throw new Error(`Remote media "${asset.name}" is too large to export.`);
  }
  const extension = path.extname(asset.fileName || "") || ({
    "video": ".mp4",
    "audio": ".mp3",
    "image": ".png",
  })[asset.kind] || ".bin";
  const temporaryPath = path.join(uploadsDirectory, `${randomUUID()}${extension}`);
  await writeFile(temporaryPath, Buffer.from(await response.arrayBuffer()));
  return temporaryPath;
};

const hexToRgb = (value, fallback) => {
  const hex = /^#[\da-f]{6}$/i.test(value || "") ? value.slice(1) : fallback;
  return [Number.parseInt(hex.slice(0, 2), 16), Number.parseInt(hex.slice(2, 4), 16), Number.parseInt(hex.slice(4, 6), 16)];
};

const pointInTriangle = (x, y, ax, ay, bx, by, cx, cy) => {
  const d1 = (x - bx) * (ay - by) - (ax - bx) * (y - by);
  const d2 = (x - cx) * (by - cy) - (bx - cx) * (y - cy);
  const d3 = (x - ax) * (cy - ay) - (cx - ax) * (y - ay);
  const has1 = d1 >= 0;
  const has2 = d2 >= 0;
  const has3 = d3 >= 0;
  return has1 === has2 && has2 === has3;
};

const writePng = (filePath, width, height, pixels) => {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const chunks = [];
  const chunk = (type, data) => {
    const typeBuffer = Buffer.from(type);
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const crc = (crcTable ??= (() => {
      const table = new Array(256);
      for (let n = 0; n < 256; n += 1) {
        let c = n;
        for (let k = 0; k < 8; k += 1) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        table[n] = c >>> 0;
      }
      return table;
    })());
    let checksum = 0xffffffff;
    for (const byte of typeBuffer) checksum = crc[(checksum ^ byte) & 0xff] ^ (checksum >>> 8);
    for (const byte of data) checksum = crc[(checksum ^ byte) & 0xff] ^ (checksum >>> 8);
    checksum = (checksum ^ 0xffffffff) >>> 0;
    const crcBuffer = Buffer.alloc(4);
    crcBuffer.writeUInt32BE(checksum);
    chunks.push(length, typeBuffer, data, crcBuffer);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  chunk("IHDR", ihdr);
  const scanlines = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const offset = y * (width * 4 + 1);
    scanlines[offset] = 0;
    pixels[y].copy(scanlines, offset + 1);
  }
  chunk("IDAT", deflateSync(scanlines));
  chunk("IEND", Buffer.alloc(0));
  return writeFile(filePath, Buffer.concat([signature, ...chunks]));
};
let crcTable;

export const createShapePng = async (clip, canvasWidth, canvasHeight) => {
  const scaleX = Math.max(0.1, Math.min(5, Number(clip.scaleX) || 1));
  const scaleY = Math.max(0.1, Math.min(5, Number(clip.scaleY) || 1));
  let shapeWidth = Math.max(16, Math.round(canvasWidth * Math.max(2, Number(clip.width) || 30) / 100 * (Number(clip.scale) || 100) / 100 * scaleX));
  let shapeHeight = Math.max(16, Math.round(canvasHeight * Math.max(2, Number(clip.height) || 30) / 100 * (Number(clip.scale) || 100) / 100 * scaleY));
  if (clip.shapeType === "circle") {
    const diameter = Math.min(shapeWidth, shapeHeight);
    shapeWidth = diameter;
    shapeHeight = diameter;
  }
  const fill = hexToRgb(clip.fillColor, "38bdf8");
  const stroke = hexToRgb(clip.strokeColor, "000000");
  const strokeWidth = Math.max(0, Math.min(40, Number(clip.strokeWidth) || 0));
  const strokePixels = strokeWidth > 0
    ? strokeWidth * canvasHeight / 1080
    : ["line", "arrow"].includes(clip.shapeType) ? 3 * canvasHeight / 1080 : 0;
  const fillEnabled = clip.fillEnabled !== false;
  const segmentDistance = (x, y, x1, y1, x2, y2) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = dx * dx + dy * dy;
    const ratio = length ? Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / length)) : 0;
    return Math.hypot(x - (x1 + ratio * dx), y - (y1 + ratio * dy));
  };
  const arrowPoints = [[0.02, 0.35], [0.68, 0.35], [0.68, 0.05], [0.98, 0.5], [0.68, 0.95], [0.68, 0.65], [0.02, 0.65]];
  const pointInPolygon = (x, y, points) => {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
      const [xi, yi] = points[i];
      const [xj, yj] = points[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };
  const pixels = [];
  for (let y = 0; y < shapeHeight; y += 1) {
    const row = Buffer.alloc(shapeWidth * 4);
    for (let x = 0; x < shapeWidth; x += 1) {
      const nx = (x + 0.5) / shapeWidth;
      const ny = (y + 0.5) / shapeHeight;
      let inside = false;
      let strokeHit = false;
      const px = x + 0.5;
      const py = y + 0.5;
      if (clip.shapeType === "circle" || clip.shapeType === "ellipse") {
        const rx = shapeWidth * 0.48;
        const ry = shapeHeight * (clip.shapeType === "circle" ? 0.48 : 0.32);
        const radialDistance = Math.hypot((px - shapeWidth / 2) / rx, (py - shapeHeight / 2) / ry);
        inside = radialDistance <= 1;
        strokeHit = inside && Math.abs(radialDistance - 1) * Math.min(rx, ry) <= strokePixels;
      } else if (clip.shapeType === "triangle") {
        inside = pointInTriangle(nx, ny, 0.5, 0.02, 0.98, 0.98, 0.02, 0.98);
        strokeHit = inside && strokePixels > 0 && (
          segmentDistance(px, py, shapeWidth * 0.5, shapeHeight * 0.02, shapeWidth * 0.98, shapeHeight * 0.98) <= strokePixels ||
          segmentDistance(px, py, shapeWidth * 0.98, shapeHeight * 0.98, shapeWidth * 0.02, shapeHeight * 0.98) <= strokePixels ||
          segmentDistance(px, py, shapeWidth * 0.02, shapeHeight * 0.98, shapeWidth * 0.5, shapeHeight * 0.02) <= strokePixels
        );
      } else if (clip.shapeType === "line" || clip.shapeType === "arrow") {
        const segments = clip.shapeType === "line"
          ? [[0.02, 0.5, 0.98, 0.5]]
          : arrowPoints.map((point, index) => [...point, ...arrowPoints[(index + 1) % arrowPoints.length]]);
        inside = clip.shapeType === "arrow" && fillEnabled && pointInPolygon(nx, ny, arrowPoints);
        strokeHit = strokePixels > 0 && segments.some(([x1, y1, x2, y2]) => (
          segmentDistance(px, py, shapeWidth * x1, shapeHeight * y1, shapeWidth * x2, shapeHeight * y2) <= strokePixels / 2
        ));
        if (clip.shapeType === "line") inside = strokeHit;
      } else {
        const radius = clip.shapeType === "rounded"
          ? Math.min(shapeWidth, shapeHeight) * Math.min(0.25, Math.max(0, Number(clip.cornerRadius) || 12) / 100)
          : Math.min(shapeWidth, shapeHeight) * Math.min(0.12, Math.max(0, Number(clip.cornerRadius) || 12) / 400);
        const left = shapeWidth * 0.02;
        const right = shapeWidth * 0.98;
        const top = shapeHeight * 0.02;
        const bottom = shapeHeight * 0.98;
        const qx = Math.abs(px - (left + right) / 2) - ((right - left) / 2 - radius);
        const qy = Math.abs(py - (top + bottom) / 2) - ((bottom - top) / 2 - radius);
        inside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) <= radius;
        const edgeDistance = Math.min(px - left, right - px, py - top, bottom - py);
        strokeHit = inside && strokePixels > 0 && edgeDistance <= strokePixels;
      }
      const offset = x * 4;
      if (strokeHit || (fillEnabled && inside)) {
        const color = strokeHit ? stroke : fill;
        row[offset] = color[0];
        row[offset + 1] = color[1];
        row[offset + 2] = color[2];
        row[offset + 3] = 255;
      } else {
        row[offset + 3] = 0;
      }
    }
    pixels.push(row);
  }
  const filePath = path.join(exportsDirectory, `${randomUUID()}.png`);
  await writePng(filePath, shapeWidth, shapeHeight, pixels);
  return filePath;
};
const filenamePattern = /^[\da-f-]+\.[a-z\d]+$/i;
const activeExports = new Map();
const cancelledExports = new Map();
const supportedAspectRatios = new Set(["16:9", "9:16", "1:1", "4:3", "21:9"]);
const fontPath =
  process.env.AURORA_FONT_PATH ||
  (process.platform === "win32"
    ? path.join(process.env.WINDIR || "C:\\Windows", "Fonts", "arial.ttf")
    : "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf");
const emojiFontPath =
  process.env.AURORA_EMOJI_FONT_PATH ||
  (process.platform === "win32"
    ? path.join(process.env.WINDIR || "C:\\Windows", "Fonts", "seguiemj.ttf")
    : "/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf");
const windowsFonts = {
  Arial: "arial.ttf",
  Georgia: "georgia.ttf",
  "Times New Roman": "times.ttf",
  Verdana: "verdana.ttf",
  "Courier New": "cour.ttf",
  Impact: "impact.ttf",
};
const linuxFonts = {
  Arial: "DejaVuSans.ttf",
  Georgia: "DejaVuSerif.ttf",
  "Times New Roman": "DejaVuSerif.ttf",
  Verdana: "DejaVuSans.ttf",
  "Courier New": "DejaVuSansMono.ttf",
  Impact: "DejaVuSans-Bold.ttf",
};
const getFontPath = (family, isEmoji = false) => {
  if (isEmoji && existsSync(emojiFontPath)) return emojiFontPath;
  if (process.env.AURORA_FONT_PATH) return process.env.AURORA_FONT_PATH;
  const fileName = (process.platform === "win32" ? windowsFonts : linuxFonts)[
    family
  ];
  if (!fileName) return fontPath;
  const familyPath =
    process.platform === "win32"
      ? path.join(process.env.WINDIR || "C:\\Windows", "Fonts", fileName)
      : path.join("/usr/share/fonts/truetype/dejavu", fileName);
  return existsSync(familyPath) ? familyPath : fontPath;
};

const probeHasAudio = (filename) =>
  new Promise((resolve, reject) => {
    const ffprobePath =
      process.env.FFPROBE_PATH ||
      (process.env.FFMPEG_PATH
        ? path.join(
            path.dirname(process.env.FFMPEG_PATH),
            process.platform === "win32" ? "ffprobe.exe" : "ffprobe",
          )
        : "ffprobe");
    const probe = spawn(
      ffprobePath,
      [
        "-v",
        "error",
        "-select_streams",
        "a:0",
        "-show_entries",
        "stream=codec_type",
        "-of",
        "csv=p=0",
        filename,
      ],
      { windowsHide: true },
    );
    let result = "";
    probe.stdout.on("data", (chunk) => {
      result += chunk;
    });
    probe.on("error", () =>
      reject(
        new Error(
          "FFprobe is unavailable. Install FFmpeg/FFprobe or set FFPROBE_PATH.",
        ),
      ),
    );
    probe.on("close", (code) => {
      if (code !== 0)
        reject(new Error("FFprobe could not inspect an uploaded video."));
      else resolve(Boolean(result.trim()));
    });
  });

const ownedProject = async (projectId, ownerId) => {
  if (!ownerId) return null;
  return Project.findOne({ _id: projectId, ownerId });
};

export const listProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ ownerId: req.clerkUserId })
      .sort({ updatedAt: -1 })
      .limit(50);
    res.json(projects);
  } catch (error) {
    next(error);
  }
};

export const createProject = async (req, res, next) => {
  try {
    const {
      name = "Untitled project",
      assets = [],
      clips = [],
      aspectRatio = "16:9",
      backgroundColor = "#000000",
      backgroundAssetId = null,
    } = req.body;
    if (
      !supportedAspectRatios.has(aspectRatio) ||
      !/^#[\da-f]{6}$/i.test(backgroundColor) ||
      !Array.isArray(assets) ||
      assets.length > 40 ||
      !Array.isArray(clips) ||
      clips.length > 200
    ) {
      return res
        .status(400)
        .json({ error: "Project media or clip list is invalid or too large." });
    }
    const validBackgroundImage =
      backgroundAssetId === null ||
      assets.some(
        (asset) => asset.id === backgroundAssetId && asset.kind === "image",
      );
    if (!validBackgroundImage)
      return res.status(400).json({
        error:
          "Choose an image from the project media library for the background.",
      });

    const project = await Project.create({
      ownerId: req.clerkUserId,
      name,
      assets,
      clips,
      aspectRatio,
      backgroundColor,
      backgroundAssetId,
    });
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
};

export const getProject = async (req, res, next) => {
  try {
    const project = await ownedProject(req.params.projectId, req.clerkUserId);
    if (!project) return res.status(404).json({ error: "Project not found." });
    res.json(project);
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const project = await ownedProject(req.params.projectId, req.clerkUserId);
    if (!project) return res.status(404).json({ error: "Project not found." });

    const {
      name,
      assets,
      clips,
      aspectRatio,
      backgroundColor,
      backgroundAssetId,
    } = req.body;
    if (name !== undefined) {
      if (typeof name !== "string") {
        return res.status(400).json({ error: "Project name must be text." });
      }
      if (name.trim()) project.name = name.trim();
    }
    if (aspectRatio !== undefined) {
      if (!supportedAspectRatios.has(aspectRatio)) {
        return res
          .status(400)
          .json({ error: "Choose a supported video aspect ratio." });
      }
      project.aspectRatio = aspectRatio;
    }
    if (backgroundColor !== undefined) {
      if (!/^#[\da-f]{6}$/i.test(backgroundColor)) {
        return res
          .status(400)
          .json({ error: "Choose a valid canvas background color." });
      }
      project.backgroundColor = backgroundColor;
    }
    if (assets !== undefined) {
      if (
        !Array.isArray(assets) ||
        assets.some((asset) => !filenamePattern.test(asset.fileName ?? ""))
      ) {
        return res
          .status(400)
          .json({ error: "Project contains an invalid media reference." });
      }
      project.assets = assets;
    }
    if (backgroundAssetId !== undefined) {
      const availableAssets = assets ?? project.assets;
      if (
        backgroundAssetId !== null &&
        !availableAssets.some(
          (asset) => asset.id === backgroundAssetId && asset.kind === "image",
        )
      ) {
        return res.status(400).json({
          error:
            "Choose an image from this project's media library for the background.",
        });
      }
      project.backgroundAssetId = backgroundAssetId;
    }
    if (clips !== undefined) {
      if (!Array.isArray(clips) || clips.length > 200) {
        return res
          .status(400)
          .json({ error: "Project clip list is invalid or too large." });
      }
      project.clips = clips;
    }
    await project.save();
    for (const asset of project.assets) {
      if (
        asset.syncStatus === "synced" &&
        filenamePattern.test(asset.fileName || "") &&
        existsSync(path.join(uploadsDirectory, asset.fileName))
      ) {
        try {
          await unlink(path.join(uploadsDirectory, asset.fileName));
        } catch (error) {
          if (error.code !== "ENOENT") console.error("Could not remove synchronized local media:", error);
        }
      }
    }
    res.json(project);
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const project = await ownedProject(req.params.projectId, req.clerkUserId);
    if (!project) return res.status(404).json({ error: "Project not found." });
    const fileNames = project.assets
      .map((asset) => asset.fileName)
      .filter((fileName) => filenamePattern.test(fileName));
    await project.deleteOne();
    for (const fileName of fileNames) {
      const stillUsed = await Project.exists({
        _id: { $ne: project._id },
        "assets.fileName": fileName,
      });
      if (!stillUsed) {
        try {
          await unlink(path.join(uploadsDirectory, fileName));
        } catch (error) {
          if (error.code !== "ENOENT") throw error;
        }
      }
    }
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

const escapeFilterText = (text) =>
  String(text)
    .replace(/\\/g, "\\\\\\\\")
    .replace(/'/g, "\\'")
    .replace(/:/g, "\\:")
    .replace(/,/g, "\\,")
    .replace(/%/g, "\\%");

const tempoFilters = (speed) => {
  const filters = [];
  let remaining = speed;
  while (remaining > 2) {
    filters.push("atempo=2");
    remaining /= 2;
  }
  while (remaining < 0.5) {
    filters.push("atempo=0.5");
    remaining /= 0.5;
  }
  filters.push(`atempo=${remaining}`);
  return filters.join(",");
};

const getVisualEffects = (clip) => {
  const effects = clip.effects || {};
  const brightness = Math.max(
    0,
    Math.min(200, Number(effects.brightness ?? 100)),
  );
  const contrast = Math.max(0, Math.min(200, Number(effects.contrast ?? 100)));
  const saturation = Math.max(
    0,
    Math.min(200, Number(effects.saturation ?? 100)),
  );
  const blur = Math.max(0, Math.min(20, Number(effects.blur ?? 0)));
  const filters = [];
  if (brightness !== 100 || contrast !== 100 || saturation !== 100) {
    filters.push(
      `eq=brightness=${(brightness - 100) / 100}:contrast=${Math.max(0.1, contrast / 100)}:saturation=${saturation / 100}`,
    );
  }
  if (blur > 0) filters.push(`gblur=sigma=${blur}`);
  return filters;
};

const getTransitionFilters = (clip) => {
  const transition = clip.transition || {};
  const type = transition.type || "none";
  if (!["fade", "zoom", "zoom-in", "zoom-out"].includes(type)) return [];
  const duration = Math.min(
    5,
    Math.max(0.1, Number(transition.duration) || 0.5),
    clip.duration / 2,
  );
  const placement = transition.placement || "in";
  const filters = [];
  if (type === "fade" && (placement === "in" || placement === "both"))
    filters.push(`fade=t=in:st=0:d=${duration}:alpha=1`);
  if (type === "fade" && (placement === "out" || placement === "both"))
    filters.push(
      `fade=t=out:st=${clip.duration - duration}:d=${duration}:alpha=1`,
    );
  if (type !== "fade") {
    const progress = placement === "both"
      ? `if(lt(t,${duration}),min(1,max(0,t/${duration})),if(gt(t,${clip.duration - duration}),min(1,max(0,(${clip.duration}-t)/${duration})),1))`
      : placement === "out"
        ? `if(gt(t,${clip.duration - duration}),min(1,max(0,(${clip.duration}-t)/${duration})),1)`
        : `min(1,max(0,t/${duration}))`;
    const factor = type === "zoom-out"
      ? `1.2-0.2*(${progress})`
      : type === "zoom"
        ? `0.8+0.2*(${progress})`
        : `0.7+0.3*(${progress})`;
    filters.push(`scale=w='max(2,ceil(iw*(${factor})/2)*2)':h='max(2,ceil(ih*(${factor})/2)*2)':eval=frame`);
  }
  return filters;
};

const getAudioTransitionFilters = (clip) => {
  const transition = clip.transition || {};
  if (transition.type !== "fade") return [];
  const duration = Math.min(
    5,
    Math.max(0.1, Number(transition.duration) || 0.5),
    clip.duration / 2,
  );
  const placement = transition.placement || "in";
  const filters = [];
  if (placement === "in" || placement === "both")
    filters.push(`afade=t=in:st=0:d=${duration}`);
  if (placement === "out" || placement === "both")
    filters.push(`afade=t=out:st=${clip.duration - duration}:d=${duration}`);
  return filters;
};

const getAnimationFilters = (clip) => {
  const animation = clip.animation || {};
  if (!["fade", "zoom", "zoom-in", "zoom-out"].includes(animation.type)) return [];
  const duration = Math.min(
    5,
    Math.max(0.1, Number(animation.duration) || 0.5),
    clip.duration,
  );
  if (animation.type === "fade") return [`fade=t=in:st=0:d=${duration}:alpha=1`];
  const progress = `min(1,max(0,t/${duration}))`;
  const factor = animation.type === "zoom-out"
    ? `1.4-0.4*(${progress})`
    : `0.6+0.4*(${progress})`;
  return [`scale=w='max(2,ceil(iw*(${factor})/2)*2)':h='max(2,ceil(ih*(${factor})/2)*2)':eval=frame`];
};

const getOverlayPosition = (clip, axis) => {
  const x = Math.max(0, Math.min(100, Number(clip.x ?? 50))) / 100;
  const y = Math.max(0, Math.min(100, Number(clip.y ?? 50))) / 100;
  const base = axis === "x" ? `W*${x}-w/2` : `H*${y}-h/2`;
  const transition = clip.transition || {};
  const animation = clip.animation || {};
  const transitionDuration = Math.min(
    5,
    Math.max(0.1, Number(transition.duration) || 0.5),
    clip.duration / 2,
  );
  const animationDuration = Math.min(
    5,
    Math.max(0.1, Number(animation.duration) || 0.5),
    clip.duration,
  );
  const end = clip.start + clip.duration;
  const offsets = [];

  const slideDirections = {
    "slide-left": { axis: "x", direction: -1 },
    "slide-right": { axis: "x", direction: 1 },
    "slide-up": { axis: "y", direction: 1 },
    "slide-down": { axis: "y", direction: -1 },
  };
  const transitionSlide = slideDirections[transition.type];
  if (transitionSlide?.axis === axis) {
    const direction = transitionSlide.direction;
    const placement = transition.placement || "in";
    const distance = axis === "x" ? "W" : "H";
    if (placement === "in" || placement === "both") {
      offsets.push(
        `if(lt(t,${clip.start + transitionDuration}),(1-min(1,max(0,(t-${clip.start})/${transitionDuration})))*${direction}*${distance},0)`,
      );
    }
    if (placement === "out" || placement === "both") {
      offsets.push(
        `if(gt(t,${end - transitionDuration}),(1-min(1,max(0,(${end}-t)/${transitionDuration})))*${direction}*${distance},0)`,
      );
    }
  }
  const animationSlide = slideDirections[animation.type];
  if (animationSlide?.axis === axis && clip.kind !== "text") {
    const distance = axis === "x" ? "W" : "H";
    offsets.push(
      `if(lt(t,${clip.start + animationDuration}),(1-min(1,max(0,(t-${clip.start})/${animationDuration})))*${animationSlide.direction}*${distance}*0.08,0)`,
    );
  }
  return offsets.length ? `${base}+${offsets.join("+")}` : base;
};

const getOpacityFilters = (clip) => {
  const opacity = Math.min(100, Math.max(0, Number(clip.opacity ?? 100)));
  return opacity < 100 ? [`colorchannelmixer=aa=${opacity / 100}`] : [];
};

// Video only needs the slow RGBA path when it is scaled, rotated, faded or semi-transparent.
const videoNeedsAlpha = (clip) =>
  Number(clip.scale ?? 100) !== 100 ||
  Number(clip.scaleX ?? 1) !== 1 ||
  Number(clip.scaleY ?? 1) !== 1 ||
  Number(clip.rotation || 0) !== 0 ||
  Number(clip.opacity ?? 100) < 100 ||
  getTransitionFilters(clip).length > 0 ||
  getAnimationFilters(clip).length > 0;

const getVisualTransformFilters = (clip, includeCrop = false) => {
  const scale = Math.max(10, Math.min(300, Number(clip.scale ?? 100))) / 100;
  const scaleX = Math.max(0.1, Math.min(5, Number(clip.scaleX) || 1));
  const scaleY = Math.max(0.1, Math.min(5, Number(clip.scaleY) || 1));
  const degrees = Math.max(-180, Math.min(180, Number(clip.rotation) || 0));
  const rotation = (degrees * Math.PI) / 180;
  const filters = [];
  if (scale !== 1 || scaleX !== 1 || scaleY !== 1) {
    filters.push(`scale=w='iw*${scale * scaleX}':h='ih*${scale * scaleY}'`);
  }
  if (degrees !== 0)
    filters.push(
      `rotate=${rotation}:ow=rotw(${rotation}):oh=roth(${rotation}):c=black@0`,
    );
  if (includeCrop) {
    const top = Math.max(0, Math.min(45, Number(clip.cropTop) || 0));
    const right = Math.max(0, Math.min(45, Number(clip.cropRight) || 0));
    const bottom = Math.max(0, Math.min(45, Number(clip.cropBottom) || 0));
    const left = Math.max(0, Math.min(45, Number(clip.cropLeft) || 0));
    if (top + right + bottom + left > 0) {
      filters.push(
        `crop=w='iw*(1-${left + right}/100)':h='ih*(1-${top + bottom}/100)':x='iw*${left}/100':y='ih*${top}/100'`,
      );
    }
  }
  return filters;
};

const getTextRenderSettings = (clip, width) => {
  const color = /^#[\da-f]{6}$/i.test(clip.textColor || "")
    ? clip.textColor.slice(1)
    : "ffffff";
  const backgroundColor = /^#[\da-f]{6}$/i.test(clip.textBackgroundColor || "")
    ? clip.textBackgroundColor.slice(1)
    : "000000";
  const backgroundOpacity =
    Math.max(0, Math.min(100, Number(clip.textBackgroundOpacity) || 0)) / 100;
  const size = Math.max(12, Math.min(160, Number(clip.fontSize) || 48));
  const scale = Math.max(10, Math.min(300, Number(clip.scale ?? 100))) / 100;
  const fontSize = Math.round(((size * width) / 1000) * scale);
  const centerX = "(w-text_w)/2";
  const centerY = "(h-text_h)/2";
  let xPosition = centerX;
  let yPosition = centerY;
  const animationConfig = clip.animation || {};
  const animationDuration = Math.max(
    0.1,
    Math.min(Number(animationConfig.duration) || 0.5, clip.duration),
  );
  let animationFilter = "";

  if (animationConfig.type === "fade") {
    animationFilter = `:alpha='if(lt(t\\,${animationDuration})\\,t/${animationDuration}\\,1)'`;
  } else if (animationConfig.type === "slide-up") {
    yPosition = `${centerY}+if(lt(t\\,${animationDuration})\\,(1-t/${animationDuration})*48\\,0)`;
  } else if (animationConfig.type === "slide-down") {
    yPosition = `${centerY}-if(lt(t\\,${animationDuration})\\,(1-t/${animationDuration})*48\\,0)`;
  } else if (animationConfig.type === "slide-left") {
    xPosition = `${centerX}-if(lt(t\\,${animationDuration})\\,(1-t/${animationDuration})*w*0.08\\,0)`;
  } else if (animationConfig.type === "slide-right") {
    xPosition = `${centerX}+if(lt(t\\,${animationDuration})\\,(1-t/${animationDuration})*w*0.08\\,0)`;
  } else if (["zoom", "zoom-in", "zoom-out"].includes(animationConfig.type)) {
    const zoomFactor = animationConfig.type === "zoom-out"
      ? "1.4-0.4*t"
      : "0.6+0.4*t";
    animationFilter = `:fontsize='${fontSize}*if(lt(t\\,${animationDuration})\\,${zoomFactor}/${animationDuration}\\,1)'`;
  }

  return {
    color,
    backgroundFilter:
      backgroundOpacity > 0
        ? `:box=1:boxcolor=0x${backgroundColor}@${backgroundOpacity}:boxborderw=10`
        : "",
    fontSize,
    xPosition,
    yPosition,
    animation: animationFilter,
  };
};

export const exportProject = async (req, res, next) => {
  const temporaryShapePaths = [];
  const cleanupShapeFiles = async () => {
    await Promise.all(temporaryShapePaths.map((filePath) => unlink(filePath).catch((error) => {
      if (error.code !== "ENOENT") console.error("Could not remove temporary shape image:", error);
    })));
  };
  try {
    const project = await ownedProject(req.params.projectId, req.clerkUserId);
    if (!project) return res.status(404).json({ error: "Project not found." });

    const { resolution = "1080p", fps = 30, exportId } = req.body;
    if (typeof exportId !== "string" || !/^[\da-f-]{36}$/i.test(exportId)) {
      return res.status(400).json({ error: "A valid export ID is required." });
    }
    const exportKey = `${req.clerkUserId}:${exportId}`;
    const cancelExpiry = cancelledExports.get(exportKey);
    if (cancelExpiry && cancelExpiry > Date.now()) {
      cancelledExports.delete(exportKey);
      return res.status(409).json({ error: "Export cancelled." });
    }
    cancelledExports.delete(exportKey);
    if (activeExports.has(exportKey))
      return res.status(409).json({ error: "This export is already running." });

    const aspectRatio = req.body.aspectRatio || project.aspectRatio || "16:9";
    const resolutionHeight = { "720p": 720, "1080p": 1080, "4K": 2160 }[
      resolution
    ];
    const frameRate = Number(fps);
    if (
      !resolutionHeight ||
      !supportedAspectRatios.has(aspectRatio) ||
      ![24, 30, 60].includes(frameRate)
    ) {
      return res
        .status(400)
        .json({ error: "Choose a supported resolution and frame rate." });
    }
    const [ratioWidth, ratioHeight] = aspectRatio.split(":").map(Number);
    const ratio = ratioWidth / ratioHeight;
    const dimensions =
      ratio >= 1
        ? [Math.round((resolutionHeight * ratio) / 2) * 2, resolutionHeight]
        : [resolutionHeight, Math.round(resolutionHeight / ratio / 2) * 2];
    if (!project.clips.length || project.clips.length > 200) {
      return res
        .status(400)
        .json({ error: "Add media to the timeline before exporting." });
    }

    const clips = project.clips.map((clip) => {
      const start = Number(clip.start);
      const duration = Number(clip.duration);
      const speed = Number(clip.speed) || 1;
      if (
        ![start, duration, speed].every(Number.isFinite) ||
        start < 0 ||
        duration <= 0 ||
        start + duration > 1800 ||
        speed < 0.25 ||
        speed > 4
      ) {
        throw new Error(
          "Timeline contains an invalid clip position, duration, or speed.",
        );
      }
      return { ...clip, start, duration, speed };
    });
    const outputDuration = Math.max(
      ...clips.map((clip) => clip.start + clip.duration),
    );
    const [width, height] = dimensions;
    const outputPath = path.join(exportsDirectory, `${randomUUID()}.mp4`);
    const backgroundColor = /^#[\da-f]{6}$/i.test(project.backgroundColor || "")
      ? project.backgroundColor.slice(1)
      : "000000";
    const args = [
      "-y",
      "-f",
      "lavfi",
      "-i",
      `color=c=0x${backgroundColor}:s=${width}x${height}:r=${frameRate}:d=${outputDuration}`,
    ];
    const graph = [];
    const audioLabels = [];
    const audioGraph = [];
    const assetsById = new Map(
      project.assets.map((asset) => [asset.id, asset]),
    );
    let inputCount = 1;
    let videoLabel = "base";
    graph.push("[0:v]null[base]");

    if (project.backgroundAssetId) {
      const background = assetsById.get(project.backgroundAssetId);
      const backgroundPath = background?.kind === "image" ? await resolveAssetFile(background) : null;
      if (!backgroundPath) {
        return res.status(400).json({
          error:
            "The selected background image is missing. Choose another image from the media library.",
        });
      }
      args.push(
        "-loop",
        "1",
        "-framerate",
        String(frameRate),
        "-t",
        String(outputDuration),
        "-i",
        backgroundPath,
      );
      graph.push(
        `[1:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},setpts=PTS-STARTPTS[backgroundImage]`,
      );
      graph.push("[base][backgroundImage]overlay=shortest=1[background]");
      videoLabel = "background";
      inputCount = 2;
    }

    for (const clip of clips
      .filter((item) => item.kind === "video" || item.kind === "image")
      .sort(
        (a, b) =>
          Number(a.kind === "image") - Number(b.kind === "image") ||
          a.start - b.start,
      )) {
      const asset = assetsById.get(clip.assetId);
      const assetPath = asset ? await resolveAssetFile(asset) : null;
      if (!assetPath) {
        return res.status(400).json({
          error: `Media file for "${clip.name}" is missing. Re-import it before exporting.`,
        });
      }
      if (asset.kind !== clip.kind)
        return res.status(400).json({
          error: `Media type for "${clip.name}" does not match its timeline clip.`,
        });
      const inputIndex = inputCount++;
      if (asset.kind === "image") {
        args.push(
          "-loop",
          "1",
          "-framerate",
          String(frameRate),
          "-t",
          String(clip.duration),
          "-i",
          assetPath,
        );
        const imageScale =
          clip.crop === "fill"
            ? `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}`
            : `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black@0`;
        const imageFilters = [
          "setpts=PTS-STARTPTS",
          "format=rgba",
          imageScale,
          ...getVisualTransformFilters(clip, true),
          "format=rgba",
          ...getVisualEffects(clip),
          ...getOpacityFilters(clip),
          ...getAnimationFilters(clip),
          ...getTransitionFilters(clip),
          `setpts=PTS+${clip.start}/TB`,
        ];
        graph.push(
          `[${inputIndex}:v]${imageFilters.join(",")}[visual${inputIndex}]`,
        );
      } else {
        const videoPath = assetPath;
        args.push(
          "-ss",
          String(Math.max(0, Number(clip.sourceStart) || 0)),
          "-t",
          String(clip.duration * clip.speed),
          "-i",
          videoPath,
        );
        const videoScale =
          clip.crop === "fill"
            ? `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}`
            : `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black`;
        const videoFilters = [
          `trim=start=0:duration=${clip.duration * clip.speed}`,
          `setpts=(PTS-STARTPTS)/${clip.speed}`,
          videoScale,
          "setsar=1",
          ...(videoNeedsAlpha(clip) ? ["format=rgba"] : []),
          ...getVisualTransformFilters(clip),
          ...getVisualEffects(clip),
          ...getOpacityFilters(clip),
          ...getAnimationFilters(clip),
          ...getTransitionFilters(clip),
          `setpts=PTS+${clip.start}/TB`,
        ];
        graph.push(
          `[${inputIndex}:v]${videoFilters.join(",")}[visual${inputIndex}]`,
        );
        if (await probeHasAudio(videoPath)) {
          const audioLabel = `audio${inputIndex}`;
          const delay = Math.round(clip.start * 1000);
          const volume = clip.muted
            ? 0
            : Math.min(200, Math.max(0, Number(clip.volume ?? 100))) / 100;
          const audioFilters = getAudioTransitionFilters(clip);
          audioGraph.push(
            `[${inputIndex}:a]atrim=start=0:duration=${clip.duration * clip.speed},asetpts=PTS-STARTPTS,${tempoFilters(clip.speed)},volume=${volume}${audioFilters.length ? `,${audioFilters.join(",")}` : ""},adelay=${delay}:all=1[${audioLabel}]`,
          );
          audioLabels.push(`[${audioLabel}]`);
        }
      }
      const nextLabel = `composite${inputIndex}`;
      const x = getOverlayPosition(clip, "x");
      const y = getOverlayPosition(clip, "y");
      graph.push(
        `[${videoLabel}][visual${inputIndex}]overlay=x='${x}':y='${y}':eof_action=pass:enable='between(t,${clip.start},${clip.start + clip.duration})'[${nextLabel}]`,
      );
      videoLabel = nextLabel;
    }

    let textClipIndex = 0;
    const textClips = clips.filter((item) => item.kind === "text");
    if (textClips.some((clip) => !existsSync(getFontPath(clip.fontFamily, clip.isEmoji)))) {
      return res.status(503).json({
        error:
          "Text rendering needs a TrueType font. Set AURORA_FONT_PATH to an installed .ttf file on the server.",
      });
    }
    for (const clip of textClips.sort((a, b) => a.start - b.start)) {
      const escapedText = escapeFilterText(clip.text || "Your title");
      const { color, backgroundFilter, fontSize, xPosition, yPosition, animation } =
        getTextRenderSettings(clip, width);
      const escapedFontPath = getFontPath(clip.fontFamily, clip.isEmoji)
        .replace(/\\/g, "/")
        .replace(/:/g, "\\:");
      const inputIndex = inputCount++;
      const textLabel = `textLayer${textClipIndex}`;
      const nextLabel = `text${textClipIndex++}`;
      const y =
        Math.max(
          0,
          Math.min(
            100,
            Number(
              clip.y ??
                (clip.textPosition === "top"
                  ? 15
                  : clip.textPosition === "bottom"
                    ? 85
                    : 50),
            ),
          ),
        ) / 100;
      const rotation =
        (Math.max(-180, Math.min(180, Number(clip.rotation) || 0)) * Math.PI) /
        180;
      args.push(
        "-f",
        "lavfi",
        "-i",
        `color=c=black@0:s=${width}x${height}:r=${frameRate}:d=${clip.duration}`,
      );
      const textFilters = [
        "format=rgba",
        "colorchannelmixer=aa=0",
        `drawtext=fontfile='${escapedFontPath}':text='${escapedText}':fontcolor=0x${color}:fontsize=${fontSize}${backgroundFilter}:borderw=2:bordercolor=black:x='${xPosition}':y='${yPosition}'${animation}`,
        ...((Number(clip.scaleX ?? 1) !== 1 || Number(clip.scaleY ?? 1) !== 1)
          ? [`scale=w='iw*${Math.max(0.1, Math.min(5, Number(clip.scaleX) || 1))}':h='ih*${Math.max(0.1, Math.min(5, Number(clip.scaleY) || 1))}'`]
          : []),
        ...(rotation
          ? [`rotate=${rotation}:ow=iw:oh=ih:c=black@0`]
          : []),
        ...getTransitionFilters(clip),
        `setpts=PTS+${clip.start}/TB`,
      ];
      graph.push(
        `[${inputIndex}:v]${textFilters.join(",")}[${textLabel}]`,
      );
      graph.push(
        `[${videoLabel}][${textLabel}]overlay=x='${getOverlayPosition(clip, "x")}':y='${getOverlayPosition(clip, "y")}':eof_action=pass:enable='between(t,${clip.start},${clip.start + clip.duration})'[${nextLabel}]`,
      );
      videoLabel = nextLabel;
    }

    let shapeClipIndex = 0;
    for (const clip of clips
      .filter((item) => item.kind === "shape")
      .sort((a, b) => a.start - b.start)) {
      const shapePath = await createShapePng(clip, width, height);
      temporaryShapePaths.push(shapePath);
      const inputIndex = inputCount++;
      const shapeLabel = `shape${shapeClipIndex++}`;
      args.push(
        "-loop",
        "1",
        "-framerate",
        String(frameRate),
        "-t",
        String(clip.duration),
        "-i",
        shapePath,
      );
      const rotation = (Math.max(-180, Math.min(180, Number(clip.rotation) || 0)) * Math.PI) / 180;
      const opacity = Math.max(0, Math.min(100, Number(clip.opacity ?? 100))) / 100;
      const shapeFilters = [
        "format=rgba",
        ...(rotation ? [`rotate=${rotation}:ow=iw:oh=ih:c=black@0`] : []),
        ...(opacity < 1 ? [`colorchannelmixer=aa=${opacity}`] : []),
        ...getAnimationFilters(clip),
        ...getTransitionFilters(clip),
        `setpts=PTS+${clip.start}/TB`,
      ];
      const shapedLabel = `shapeLayer${shapeClipIndex}`;
      graph.push(`[${inputIndex}:v]${shapeFilters.join(",")}[${shapeLabel}]`);
      graph.push(
        `[${videoLabel}][${shapeLabel}]overlay=x='${getOverlayPosition(clip, "x")}':y='${getOverlayPosition(clip, "y")}':eof_action=pass:enable='between(t,${clip.start},${clip.start + clip.duration})'[${shapedLabel}]`,
      );
      videoLabel = shapedLabel;
    }

    for (const clip of clips.filter((item) => item.kind === "audio")) {
      const asset = assetsById.get(clip.assetId);
      const assetPath = asset ? await resolveAssetFile(asset) : null;
      if (!assetPath) {
        return res.status(400).json({
          error: `Audio file for "${clip.name}" is missing. Re-import it before exporting.`,
        });
      }
      if (asset.kind !== "audio")
        return res
          .status(400)
          .json({ error: `Media type for "${clip.name}" is not audio.` });
      const inputIndex = inputCount++;
      args.push(
        "-ss",
        String(Math.max(0, Number(clip.sourceStart) || 0)),
        "-t",
        String(clip.duration * clip.speed),
        "-i",
        assetPath,
      );
      const audioLabel = `audio${inputIndex}`;
      const delay = Math.round(clip.start * 1000);
      const volume = clip.muted
        ? 0
        : Math.min(200, Math.max(0, Number(clip.volume ?? 100))) / 100;
      const transition = clip.transition || {};
      const transitionDuration =
        transition.type === "fade" ? Number(transition.duration) || 0.5 : 0;
      const fadeIn = Math.max(
        0,
        Math.min(
          clip.duration / 2,
          Number(
            clip.fadeIn ??
              (["in", "both"].includes(transition.placement || "in")
                ? transitionDuration
                : 0),
          ) || 0,
        ),
      );
      const fadeOut = Math.max(
        0,
        Math.min(
          clip.duration / 2,
          Number(
            clip.fadeOut ??
              (["out", "both"].includes(transition.placement)
                ? transitionDuration
                : 0),
          ) || 0,
        ),
      );
      const audioFilters = [
        ...(fadeIn > 0 ? [`afade=t=in:st=0:d=${fadeIn}`] : []),
        ...(fadeOut > 0
          ? [`afade=t=out:st=${clip.duration - fadeOut}:d=${fadeOut}`]
          : []),
      ];
      audioGraph.push(
        `[${inputIndex}:a]atrim=start=0:duration=${clip.duration * clip.speed},asetpts=PTS-STARTPTS,${tempoFilters(clip.speed)},volume=${volume}${audioFilters.length ? `,${audioFilters.join(",")}` : ""},adelay=${delay}:all=1[${audioLabel}]`,
      );
      audioLabels.push(`[${audioLabel}]`);
    }

    if (audioLabels.length) {
      const mixed = "mixedAudio";
      audioGraph.push(
        `${audioLabels.join("")}amix=inputs=${audioLabels.length}:duration=longest:dropout_transition=0,apad,atrim=duration=${outputDuration},asetpts=N/SR/TB[${mixed}]`,
      );
    }
    args.push(
      "-filter_complex",
      [...graph, ...audioGraph].join(";"),
      "-map",
      `[${videoLabel}]`,
      "-t",
      String(outputDuration),
      "-r",
      String(frameRate),
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-crf",
      "23",
      "-threads",
      "0",
      "-pix_fmt",
      "yuv420p",
    );
    if (audioLabels.length) {
      args.push("-map", "[mixedAudio]", "-c:a", "aac", "-b:a", "192k");
    } else {
      args.push("-an");
    }
    args.push(
      "-stats_period",
      "0.25",
      "-progress",
      "pipe:1",
      "-nostats",
      "-movflags",
      "+faststart",
      outputPath,
    );

    const task = {
      projectId: String(project._id),
      progress: 0,
      status: "rendering",
      process: null,
      cancelled: false,
    };
    activeExports.set(exportKey, task);
    const pendingCancelExpiry = cancelledExports.get(exportKey);
    if (pendingCancelExpiry && pendingCancelExpiry > Date.now()) {
      activeExports.delete(exportKey);
      cancelledExports.delete(exportKey);
      await cleanupShapeFiles();
      return res.status(409).json({ error: "Export cancelled." });
    }
    const ffmpeg = spawn(process.env.FFMPEG_PATH || "ffmpeg", args, {
      windowsHide: true,
    });
    task.process = ffmpeg;
    let stderr = "";
    let progressBuffer = "";
    let finished = false;
    ffmpeg.stdout.on("data", (chunk) => {
      progressBuffer += chunk.toString();
      const lines = progressBuffer.split(/\r?\n/);
      progressBuffer = lines.pop() || "";
      for (const line of lines) {
        const [key, value] = line.split("=", 2);
        if (key === "out_time_us" || key === "out_time_ms") {
          const elapsed = Number(value) / 1_000_000;
          if (Number.isFinite(elapsed))
            task.progress = Math.min(
              99,
              Math.max(
                task.progress,
                Math.floor((elapsed / outputDuration) * 100),
              ),
            );
        } else if (key === "out_time") {
          const [hours, minutes, seconds] = value.split(":").map(Number);
          if ([hours, minutes, seconds].every(Number.isFinite)) {
            const elapsed = hours * 3600 + minutes * 60 + seconds;
            task.progress = Math.min(
              99,
              Math.max(
                task.progress,
                Math.floor((elapsed / outputDuration) * 100),
              ),
            );
          }
        } else if (key === "progress" && value === "end") {
          task.progress = 99;
        }
      }
    });
    ffmpeg.stderr.on("data", (chunk) => {
      stderr = `${stderr}${chunk}`.slice(-8000);
    });
    ffmpeg.on("error", (error) => {
      if (finished) return;
      finished = true;
      activeExports.delete(exportKey);
      void cleanupShapeFiles();
      unlink(outputPath).catch((cleanupError) => {
        if (cleanupError.code !== "ENOENT")
          console.error("Could not remove failed export:", cleanupError);
      });
      const failure = new Error(`Unable to start FFmpeg: ${error.message}`);
      failure.status = 503;
      failure.publicMessage =
        "FFmpeg is unavailable. Install it or set FFMPEG_PATH on the server.";
      next(failure);
    });
    ffmpeg.on("close", (code) => {
      if (finished) return;
      finished = true;
      task.process = null;
      void cleanupShapeFiles();
      if (task.cancelled) {
        task.status = "cancelled";
        activeExports.delete(exportKey);
        unlink(outputPath).catch((cleanupError) => {
          if (cleanupError.code !== "ENOENT")
            console.error("Could not remove cancelled export:", cleanupError);
        });
        if (!res.headersSent && !res.destroyed)
          res.status(409).json({ error: "Export cancelled." });
        return;
      }
      if (code !== 0) {
        task.status = "failed";
        activeExports.delete(exportKey);
        unlink(outputPath).catch((error) => {
          if (error.code !== "ENOENT")
            console.error("Could not remove failed export:", error);
        });
        const failure = new Error(
          `FFmpeg export failed: ${stderr.slice(-1500)}`,
        );
        failure.status = 422;
        failure.publicMessage = `FFmpeg export failed: ${stderr.slice(-900) || `process exited with code ${code}`}`;
        next(failure);
        return;
      }
      task.progress = 100;
      task.status = "complete";
      const exportName =
        String(req.body.name || project.name)
          .replace(/\.mp4$/i, "")
          .replace(/[^a-z0-9-_ ]/gi, "")
          .trim()
          .slice(0, 100) || "aurora-export";
      task.response = res;
      res.download(outputPath, `${exportName}.mp4`, (error) => {
        activeExports.delete(exportKey);
        unlink(outputPath).catch((cleanupError) => {
          if (cleanupError.code !== "ENOENT")
            console.error("Could not remove completed export:", cleanupError);
        });
        if (error && !res.destroyed) next(error);
      });
    });
  } catch (error) {
    await cleanupShapeFiles();
    next(error);
  }
};

export const getExportProgress = (req, res) => {
  const task = activeExports.get(`${req.clerkUserId}:${req.params.exportId}`);
  if (!task || task.projectId !== req.params.projectId)
    return res.status(404).json({ error: "Export not found." });
  return res.json({ progress: task.progress, status: task.status });
};

export const cancelExport = (req, res) => {
  const exportKey = `${req.clerkUserId}:${req.params.exportId}`;
  const task = activeExports.get(exportKey);
  if (task && task.projectId !== req.params.projectId)
    return res.status(404).json({ error: "Export not found." });
  if (task) {
    task.cancelled = true;
    task.status = "cancelling";
    if (task.process) task.process.kill("SIGTERM");
    else task.response?.destroy();
  } else {
    cancelledExports.set(exportKey, Date.now() + 5 * 60 * 1000);
  }
  return res.status(202).json({ cancelled: true });
};
