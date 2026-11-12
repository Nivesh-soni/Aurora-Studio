import express from "express";
import { upload, uploadMedia } from "../controllers/media.controller.js";

const router = express.Router();

router.post("/upload", upload.array("files", 40), uploadMedia);

export default router;
