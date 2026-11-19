import express from "express";
import { retryAssetUpload, upload, uploadMedia } from "../controllers/media.controller.js";

const router = express.Router();

router.post("/upload", upload.array("files", 40), uploadMedia);
router.post("/projects/:projectId/assets/:assetId/retry", retryAssetUpload);

export default router;
