import express from "express";
import { getSkills, createSkill, deleteSkill } from "../controller/skills.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.get("/", getSkills);
router.post("/", auth, createSkill);
router.delete("/:id", auth, deleteSkill);

export default router;
