import Project from "../models/Project.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../services/cloudinary.js";

/**
 * Get all projects sorted by creation time (newest first).
 */
export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    return res.status(200).json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return res.status(500).json({ error: "Server error while fetching projects." });
  }
};

/**
 * Create a new project.
 * Handles optional image upload to Cloudinary.
 */
export const createProject = async (req, res) => {
  try {
    const { title, type, desc, githubLink, liveLink } = req.body;

    if (!title || !type || !desc) {
      return res.status(400).json({ error: "Title, type, and description are required fields." });
    }

    let imageUrl = "";
    let imagePublicId = "";

    // If a file is uploaded, send it to Cloudinary
    if (req.file) {
      try {
        const uploadResult = await uploadToCloudinary(req.file.buffer, "portfolio_projects");
        imageUrl = uploadResult.secure_url;
        imagePublicId = uploadResult.public_id;
      } catch (uploadError) {
        console.error("Cloudinary upload failed:", uploadError);
        return res.status(500).json({ error: "Image upload failed. Project was not created." });
      }
    }

    const newProject = new Project({
      title,
      type,
      desc,
      githubLink,
      liveLink,
      imageUrl,
      imagePublicId,
    });

    await newProject.save();

    return res.status(201).json({
      message: "Project created successfully.",
      project: newProject,
    });
  } catch (error) {
    console.error("Error creating project:", error);
    return res.status(500).json({ error: "Server error while creating project." });
  }
};

/**
 * Update an existing project.
 * Handles optional image update, deleting the old image from Cloudinary if a new one is provided.
 */
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, type, desc, githubLink, liveLink } = req.body;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ error: "Project not found." });
    }

    // Update fields if provided
    if (title) project.title = title;
    if (type) project.type = type;
    if (desc) project.desc = desc;
    if (githubLink !== undefined) project.githubLink = githubLink;
    if (liveLink !== undefined) project.liveLink = liveLink;

    // If a new image is provided, upload it and delete the old one
    if (req.file) {
      try {
        // Delete old image from Cloudinary if it exists
        if (project.imagePublicId) {
          await deleteFromCloudinary(project.imagePublicId);
        }

        // Upload new image
        const uploadResult = await uploadToCloudinary(req.file.buffer, "portfolio_projects");
        project.imageUrl = uploadResult.secure_url;
        project.imagePublicId = uploadResult.public_id;
      } catch (uploadError) {
        console.error("Cloudinary update failed:", uploadError);
        return res.status(500).json({ error: "New image upload failed. Project was not updated." });
      }
    }

    await project.save();

    return res.status(200).json({
      message: "Project updated successfully.",
      project,
    });
  } catch (error) {
    console.error("Error updating project:", error);
    return res.status(500).json({ error: "Server error while updating project." });
  }
};

/**
 * Delete a project.
 * Deletes associated image from Cloudinary before deleting project from database.
 */
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ error: "Project not found." });
    }

    // Delete image from Cloudinary if it exists
    if (project.imagePublicId) {
      try {
        await deleteFromCloudinary(project.imagePublicId);
      } catch (cloudinaryError) {
        console.error("Failed to delete image from Cloudinary during project deletion:", cloudinaryError);
        // We continue with project deletion even if Cloudinary delete fails, or handle it as required.
      }
    }

    // Delete from DB
    await project.deleteOne();

    return res.status(200).json({
      message: "Project deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    return res.status(500).json({ error: "Server error while deleting project." });
  }
};
