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
    quantity: {
      type: Number,
    },
    items: [
      {
        type: Schema.Types.ObjectId,
        ref: "Item",
      },
    ],
    donationType: {
      type: String,
      required: true,
    },
    amount: {
      type: String,
    },
    cardNumber: {
      type: String,
    },
    cardName: {
      type: String,
    },
    expiry: {
      type: String,
    },
    cvv: {
      type: String,
    },
    donationStatus: {
      type: String,
      required: true,
      enum: ["Pending", "Claimed", "Accepted", "Rejected", "Delivered"],
      default: "Pending",
    },
    donationStatusDescription: {
      type: String,
      default:"You donation is pending"
    },
  },
  { timestamps: true }
);

const Donation = model("Donation", donationSchema);

export default Donation;
