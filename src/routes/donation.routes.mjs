import express from "express";
import {
  createDonation,
  getDonations,
  deleteDonation,
  getDonation,
  updateDonationStatus,
  getRecipients,
} from "../controllers/donation.controller.mjs";

const router = express.Router();

router.post("/add", createDonation);
router.get("/all", getDonations);
router.get("/:id/show", getDonation);
router.delete("/:id/delete", deleteDonation);
router.patch("/:id/update", updateDonationStatus);
router.get("/recipients", getRecipients);

export default router;
