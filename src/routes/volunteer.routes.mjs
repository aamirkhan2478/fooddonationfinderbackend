import express from "express";
import {
  createVolunteer,
  getVolunteers,
} from "../controllers/volunteer.controller.mjs";
import auth from "../middleware/auth.middleware.mjs";

const router = express.Router();

router.post("/add", createVolunteer);
router.get("/all", auth, getVolunteers);

export default router;
