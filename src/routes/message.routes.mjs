import express from "express";
import {
  allMessages,
  sendMessage,
} from "../controllers/message.controller.mjs";

const router = express.Router();

router.post("/send", sendMessage);
router.get("/:id/all", allMessages);

export default router;
