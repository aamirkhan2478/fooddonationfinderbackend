import express from "express";
import {
  createContact,
  getContacts,
} from "../controllers/contact.controller.mjs";
import auth from "../middleware/auth.middleware.mjs";

const router = express.Router();



router.post("/add", createContact);
router.get("/all", auth, getContacts);

export default router;