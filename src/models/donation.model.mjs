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
    payment: {
      orderId: { type: String },
      amount: { type: String },
      currency: { type: String },
      billingData: { type: Object },
      paymentKey: { type: String },
      iframeId: { type: String },
      default: {},
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
  },
  { timestamps: true }
);

const Donation = model("Donation", donationSchema);

export default Donation;
