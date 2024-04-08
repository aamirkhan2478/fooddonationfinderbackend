import { Schema, model } from "mongoose";

const donationSchema = new Schema(
  {
    donar: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        type: Schema.Types.ObjectId,
        ref: "Item",
        required: true,
      },
    ],
    donationType: {
      type: String,
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
