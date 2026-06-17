import express from "express";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from "../controller/projects.js";
import auth from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Public route to view all projects
router.get("/", getProjects);

// Protected routes (Admin only)
// POST: Add new project + image upload
router.post("/", auth, upload.single("image"), createProject);

// PUT: Edit existing project + optional image upload
router.put("/:id", auth, upload.single("image"), updateProject);

// DELETE: Remove project + delete image from Cloudinary
router.delete("/:id", auth, deleteProject);

export default router;
