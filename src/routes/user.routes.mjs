import express from "express";
import {
  register,
  login,
  verifyEmail,
  forgotPassword,
  getUser,
  resetPassword,
  updateUser,
  changePassword,
  updateImage,
  resendEmail
} from "../controllers/user.controller.mjs";
import auth from "../middleware/auth.middleware.mjs";

const router = express.Router();

router.post("/register", register);
router.post("/verify-email", verifyEmail);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/current-user", auth, getUser);
router.put("/update-user", auth, updateUser);
router.put("/change-password", auth, changePassword);
router.patch("/update-image", auth, updateImage);
router.post("/resend-email", resendEmail);

export default router;
