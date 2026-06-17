import Service from "../models/Service.js";

export const getServices = async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
    return res.status(200).json(services);
  } catch (error) {
    return res.status(500).json({ error: "Server error while fetching services." });
  }
};

export const createService = async (req, res) => {
  try {
    const { title, desc } = req.body;
    if (!title || !desc) return res.status(400).json({ error: "Title and description are required." });
    const service = new Service({ title, desc });
    await service.save();
    return res.status(201).json(service);
  } catch (error) {
    return res.status(500).json({ error: "Server error while creating service." });
  }
};

export const updateService = async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!service) return res.status(404).json({ error: "Service not found." });
    return res.status(200).json(service);
  } catch (error) {
    return res.status(500).json({ error: "Server error while updating service." });
  }
};

export const deleteService = async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) return res.status(404).json({ error: "Service not found." });
    return res.status(200).json({ message: "Service deleted successfully." });
  } catch (error) {
    return res.status(500).json({ error: "Server error while deleting service." });
  }
};
