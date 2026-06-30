import express from "express";
import { geminiChat } from "../controller/gemini.js";

const router = express.Router();

router.post("/chat", geminiChat);

export default router;
