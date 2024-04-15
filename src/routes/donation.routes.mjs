import express from "express";
import {
  createDonation,
  getDonations,
  deleteDonation,
  getDonation,
  updateDonationStatus,
} from "../controllers/donation.controller.mjs";
import auth from "../middleware/auth.middleware.mjs";

const router = express.Router();

router.post("/add", auth, createDonation);
router.get("/all", auth, getDonations);
router.get("/show/:id", auth, getDonation);
router.delete("/delete/:id", auth, deleteDonation);
router.patch("/update/:id", auth, updateDonationStatus);

export default router;
