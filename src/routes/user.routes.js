import express from "express";
const router = express.Router();
import { register, login, verifyEmail } from '../controllers/user.controller.js';

router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/login', login);

export default router;
