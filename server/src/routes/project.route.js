import express from "express";
import {
  createProject,
  cancelExport,
  deleteProject,
  exportProject,
  getExportProgress,
  getProject,
  listProjects,
  updateProject,
} from "../controllers/project.controller.js";

const router = express.Router();

router.get("/", listProjects);
router.post("/", createProject);
router.get("/:projectId", getProject);
router.patch("/:projectId", updateProject);
router.delete("/:projectId", deleteProject);
router.get("/:projectId/export/:exportId/progress", getExportProgress);
router.delete("/:projectId/export/:exportId", cancelExport);
router.post("/:projectId/export", exportProject);

export default router;
