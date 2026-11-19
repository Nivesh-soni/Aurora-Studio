# Aurora Studio

Aurora Studio is a React and Node.js browser video editor with media, text, shape, timeline, preview, project, and FFmpeg export support.

## Requirements

- Node.js 20 or newer
- MongoDB
- Clerk application credentials
- FFmpeg and FFprobe (required for export)
- Cloudinary credentials (optional)
- Redis and BullMQ are not required

## Setup

1. Copy `server/.env.example` to `server/.env`.
2. Copy `client/.env.example` to `client/.env`.
3. Configure MongoDB and Clerk.
4. Install dependencies:

```powershell
cd client
npm install
npm run build

cd ../server
npm install
npm run dev
```

Run the client in a separate terminal:

```powershell
cd client
npm run dev
```

The API defaults to `http://localhost:3000`.

## Cloudinary and local fallback

Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` on the server to enable Cloudinary uploads.

- Media is always retained in `server/uploads` until synchronization succeeds.
- If Cloudinary is unavailable or upload fails, the asset remains usable locally and is marked `pending` or `failed`.
- The server automatically retries pending assets every 60 seconds.
- Retries run in the API process after MongoDB connects; Redis/BullMQ and a separate worker are not configured.
- Same-process retries are guarded per project and asset. Cloudinary uses a stable public ID with overwrite for retries.
- After a successful database update, the local temporary copy is deleted.
- `POST /api/media/projects/:projectId/assets/:assetId/retry` provides an explicit retry endpoint.
- Cloudinary SDK calls are isolated in `server/src/services/cloudinary.service.js`; project/media retry orchestration is in `server/src/services/mediaSync.service.js`.

Cloudinary is optional. Without credentials, uploads continue to work using local storage.

## FFmpeg

Install FFmpeg, FFprobe, and TrueType fonts in the server environment and make the binaries available on `PATH`. The `FFMPEG_PATH`, `FFPROBE_PATH`, `AURORA_FONT_PATH`, and `AURORA_EMOJI_FONT_PATH` variables are optional overrides for deployments where the defaults are unavailable; do not copy machine-specific absolute paths between environments. Text export uses system font fallbacks, including DejaVu on Linux and Arial on Windows.

## Shapes

The Elements panel under Text supports rectangle, rounded rectangle, circle, ellipse, triangle, line, arrow, and emoji clips. New shapes start with no fill and a black 3 px outline. Enable a fill by choosing its color; use **No fill** to return to outline-only. Shapes support timeline duration, position, size, scale, rotation, opacity, fill, stroke, stroke width, corner radius, animations, and transitions. They are saved as clip properties and composited into FFmpeg exports.

Preview media, text, and shape layers have full side-edge resize hit areas: left/right change width only and top/bottom change height only. Corner handles retain proportional resizing. Select an image and use **Crop image** in the preview to reveal the separate crop handles.

Transitions and animations include fade, four-direction slides, and zoom variants. Their visual effects are applied in preview and FFmpeg export.
