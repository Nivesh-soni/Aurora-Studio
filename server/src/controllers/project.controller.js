import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { unlink } from "node:fs/promises";
import { spawn } from "node:child_process";
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
const filenamePattern = /^[\da-f-]+\.[a-z\d]+$/i;
const activeExports = new Map();
const cancelledExports = new Map();
const supportedAspectRatios = new Set(["16:9", "9:16", "1:1", "4:3", "21:9"]);
const fontPath =
  process.env.AURORA_FONT_PATH ||
  (process.platform === "win32"
    ? path.join(process.env.WINDIR || "C:\\Windows", "Fonts", "arial.ttf")
    : "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf");
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
const getFontPath = (family) => {
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
  if (type !== "fade" && type !== "zoom") return [];
  const duration = Math.min(
    5,
    Math.max(0.1, Number(transition.duration) || 0.5),
    clip.duration / 2,
  );
  const placement = transition.placement || "in";
  const filters = [];
  if (placement === "in" || placement === "both")
    filters.push(`fade=t=in:st=0:d=${duration}:alpha=1`);
  if (placement === "out" || placement === "both")
    filters.push(
      `fade=t=out:st=${clip.duration - duration}:d=${duration}:alpha=1`,
    );
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
  if (animation.type !== "fade") return [];
  const duration = Math.min(
    5,
    Math.max(0.1, Number(animation.duration) || 0.5),
    clip.duration,
  );
  return [`fade=t=in:st=0:d=${duration}:alpha=1`];
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

  if (
    axis === "x" &&
    (transition.type === "slide-left" || transition.type === "slide-right")
  ) {
    const direction = transition.type === "slide-left" ? -1 : 1;
    const placement = transition.placement || "in";
    if (placement === "in" || placement === "both") {
      offsets.push(
        `if(lt(t,${clip.start + transitionDuration}),(1-min(1,max(0,(t-${clip.start})/${transitionDuration})))*${direction}*W,0)`,
      );
    }
    if (placement === "out" || placement === "both") {
      offsets.push(
        `if(gt(t,${end - transitionDuration}),(1-min(1,max(0,(${end}-t)/${transitionDuration})))*${direction}*W,0)`,
      );
    }
  }
  if (axis === "y" && clip.kind === "image" && animation.type === "slide-up") {
    offsets.push(
      `if(lt(t,${clip.start + animationDuration}),(1-min(1,max(0,(t-${clip.start})/${animationDuration})))*H*0.08,0)`,
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
  Number(clip.rotation || 0) !== 0 ||
  Number(clip.opacity ?? 100) < 100 ||
  getTransitionFilters(clip).length > 0;

const getVisualTransformFilters = (clip, includeCrop = false) => {
  const scale = Math.max(10, Math.min(300, Number(clip.scale ?? 100))) / 100;
  const degrees = Math.max(-180, Math.min(180, Number(clip.rotation) || 0));
  const rotation = (degrees * Math.PI) / 180;
  const filters = [];
  if (scale !== 1) filters.push(`scale=w='iw*${scale}':h='ih*${scale}'`);
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
  const position = "(h-text_h)/2";
  const animationConfig = clip.animation || {};
  const animationDuration = Math.max(
    0.1,
    Math.min(Number(animationConfig.duration) || 0.5, clip.duration),
  );
  let animationFilter = "";

  if (animationConfig.type === "fade") {
    animationFilter = `:alpha='if(lt(t\\,${animationDuration})\\,t/${animationDuration}\\,1)'`;
  } else if (animationConfig.type === "slide-up") {
    animationFilter = `:y='${position}+if(lt(t\\,${animationDuration})\\,(1-t/${animationDuration})*48\\,0)'`;
  } else if (animationConfig.type === "zoom") {
    animationFilter = `:fontsize='${fontSize}*if(lt(t\\,${animationDuration})\\,0.6+0.4*t/${animationDuration}\\,1)'`;
  }

  return {
    color,
    backgroundFilter:
      backgroundOpacity > 0
        ? `:box=1:boxcolor=0x${backgroundColor}@${backgroundOpacity}:boxborderw=10`
        : "",
    fontSize,
    position,
    animation: animationFilter,
  };
};

export const exportProject = async (req, res, next) => {
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
      if (
        !background ||
        background.kind !== "image" ||
        !filenamePattern.test(background.fileName) ||
        !existsSync(path.join(uploadsDirectory, background.fileName))
      ) {
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
        path.join(uploadsDirectory, background.fileName),
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
      if (
        !asset ||
        !filenamePattern.test(asset.fileName) ||
        !existsSync(path.join(uploadsDirectory, asset.fileName))
      ) {
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
          path.join(uploadsDirectory, asset.fileName),
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
        const videoPath = path.join(uploadsDirectory, asset.fileName);
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
    if (textClips.some((clip) => !existsSync(getFontPath(clip.fontFamily)))) {
      return res.status(503).json({
        error:
          "Text rendering needs a TrueType font. Set AURORA_FONT_PATH to an installed .ttf file on the server.",
      });
    }
    for (const clip of textClips.sort((a, b) => a.start - b.start)) {
      const escapedText = escapeFilterText(clip.text || "Your title");
      const { color, backgroundFilter, fontSize, position, animation } =
        getTextRenderSettings(clip, width);
      const escapedFontPath = getFontPath(clip.fontFamily)
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
        `drawtext=fontfile='${escapedFontPath}':text='${escapedText}':fontcolor=0x${color}:fontsize=${fontSize}${backgroundFilter}:borderw=2:bordercolor=black:x='(w-text_w)/2':y='${position}'${animation}`,
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

    for (const clip of clips.filter((item) => item.kind === "audio")) {
      const asset = assetsById.get(clip.assetId);
      if (
        !asset ||
        !filenamePattern.test(asset.fileName) ||
        !existsSync(path.join(uploadsDirectory, asset.fileName))
      ) {
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
        path.join(uploadsDirectory, asset.fileName),
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
