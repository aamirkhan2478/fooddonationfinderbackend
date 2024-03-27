import express from "express";
import {
  register,
  login,
  verifyEmail,
  forgotPassword,
  getUser,
  resetPassword,
  updateUser,
} from "../controllers/user.controller.js";
import auth from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/verify-email", verifyEmail);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/", auth, getUser);
router.put("/", auth, updateUser);

export default router;
