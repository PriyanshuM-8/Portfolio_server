import Skill from "../models/Skill.js";

export const getSkills = async (req, res) => {
  try {
    const skills = await Skill.find().sort({ createdAt: 1 });
    return res.status(200).json(skills);
  } catch {
    return res.status(500).json({ error: "Server error while fetching skills." });
  }
};

export const createSkill = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Skill name is required." });
    const skill = new Skill({ name });
    await skill.save();
    return res.status(201).json(skill);
  } catch {
    return res.status(500).json({ error: "Server error while creating skill." });
  }
};

export const deleteSkill = async (req, res) => {
  try {
    const skill = await Skill.findByIdAndDelete(req.params.id);
    if (!skill) return res.status(404).json({ error: "Skill not found." });
    return res.status(200).json({ message: "Skill deleted successfully." });
  } catch {
    return res.status(500).json({ error: "Server error while deleting skill." });
  }
};
