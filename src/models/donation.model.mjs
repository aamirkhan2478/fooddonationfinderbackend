import { Schema, model } from "mongoose";

const donationSchema = new Schema(
  {
    donor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    item: { type: Object },
    payment: { type: Object },
    donationType: {
      type: String,
      required: true,
    },
    donationStatus: {
      type: String,
      required: true,
      enum: ["Pending", "Claimed", "Ready for Delivery", "Delivered"],
      default: "Pending",
    },
    donationStatusDescription: {
      type: String,
      default: "You donation is pending",
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Donation = model("Donation", donationSchema);

export default Donation;
