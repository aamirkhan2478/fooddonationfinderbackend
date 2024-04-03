import { Schema, model } from "mongoose";

const donationSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    donationType: {
      type: String,
      required: true,
      enum: ["Cash", "In-kind"],
    },
    amount: {
      type: Number,
      required: true,
    },
    donationStatus: {
      type: String,
      required: true,
      enum: ["Pending", "Accepted", "Rejected"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

const Donation = model("Donation", donationSchema);

export default Donation;
