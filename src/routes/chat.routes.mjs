import express from "express";
import { accessChat, fetchChats } from "../controllers/chat.controller.mjs";

const router = express.Router();

router.post("/", accessChat);
router.get("/", fetchChats);

export default router;
