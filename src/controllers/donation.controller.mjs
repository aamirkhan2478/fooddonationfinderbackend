import mongoose from "mongoose";
import Donation from "../models/donation.model.mjs";
import Item from "../models/item.model.mjs";
import User from "../models/user.model.mjs";
import Chat from "../models/chat.model.mjs";
import Message from "../models/message.model.mjs";
import axios from "axios";

// @route   POST /api/donation/add
// @desc    Create a new donation
// @access  Private
export const createDonation = async (req, res) => {
  const { items, donationType, amount, currency, billingData } = req.body;
  const errors = [];

  if (!donationType) {
    errors.push({ message: "Donation Type is required" });
  }

  if (donationType === "Food Items" && items.length === 0) {
    errors.push({ message: "Items are required" });
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: errors[0].message });
  }

  try {
    if (donationType === "Money") {
      // Step 1: Authentication
      const authResponse = await axios.post(
        "https://pakistan.paymob.com/api/auth/tokens",
        { api_key: process.env.PAYMOB_API_KEY }
      );
      const token = authResponse.data.token;

      // Step 2: Create Order
      const orderResponse = await axios.post(
        "https://pakistan.paymob.com/api/ecommerce/orders",
        {
          auth_token: token,
          delivery_needed: false,
          amount_cents: amount * 100,
          currency: currency,
          items: [],
        }
      );
      const orderId = orderResponse.data.id;

      
      // Step 3: Generate Payment Key
      const paymentKeyResponse = await axios.post(
        "https://pakistan.paymob.com/api/acceptance/post_pay",
        {
          auth_token: token,
          amount_cents: amount * 100,
          expiration: 3600,
          order_id: orderId,
          billing_data: billingData,
          currency: currency,
          integration_id: process.env.PAYMOB_INTEGRATION_ID,
        }
      );

      console.log(paymentKeyResponse);

      const convertParseData = JSON.parse(paymentKeyResponse.config.data);
      // Store order and payment details in MongoDB
      const payment = {
        orderId,
        amount,
        currency,
        billingData,
        paymentKey: convertParseData.auth_token,
        iframeId: process.env.PAYMOB_IFRAME_ID,
      };

      // check if the there is no error in the payment
      if (paymentKeyResponse.data.error) {
        return res.status(400).json({
          success: false,
          message: paymentKeyResponse.data.error,
        });
      }

      // create new donation
      const donation = new Donation({
        donor: req.user._id,
        donationType,
        payment,
      });

      // await donation.save();

      return res.status(201).json({
        payment_key: convertParseData.auth_token,
        iframe_id: process.env.PAYMOB_IFRAME_ID,
        success: true,
        message: "Donation created successfully",
      });
    }

    if (donationType === "Food Items") {
      // Check if the items are available
      for (let i = 0; i < items.length; i++) {
        const item = await Item.findById(items[i]);
        if (item.quantity < 1) {
          return res.status(400).json({
            success: false,
            message: `${item.name} is not available`,
          });
        }
      }

      // Reduce the quantity of the items
      for (let i = 0; i < items.length; i++) {
        const item = await Item.findById(items[i]);
        item.quantity = item.quantity - item.quantity;
        await item.save();
      }

      const donation = new Donation({
        donor: req.user._id,
        donationType,
        items,
      });

      await donation.save();

      return res
        .status(201)
        .json({ success: true, message: "Donation created successfully" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route   GET /api/donation/all
// @desc    Show all donations
// @access  Private
export const getDonations = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // Check if user is recipient
    if (user.userType === "Recipient") {
      // Show only status is not equal to Claimed, Ready for Delivery and Delivered and isApproved is true
      const donations = await Donation.find({
        donationStatus: {
          $nin: ["Claimed", "Ready for Delivery", "Delivered"],
        }
      })
        .populate("items", "name")
        .populate("donor", "name")
        .populate("recipient", "name");

      return res.status(200).json({ success: true, donations });
    } else if (user.userType === "Admin") {
      const donations = await Donation.find({})
        .populate("items", "name")
        .populate("donor", "name")
        .populate("recipient", "name");

      return res.status(200).json({ success: true, donations });
    } else {
      // If donor, retrieve donations specific to the donor
      const donations = await Donation.aggregate([
        {
          $match: {
            donor: req.user._id,
          },
        },
        {
          $lookup: {
            from: "items",
            localField: "items",
            foreignField: "_id",
            as: "items",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "donor",
            foreignField: "_id",
            as: "donor",
          },
        },
        {
          $unwind: "$donor",
        },
        {
          $project: {
            "donor.password": 0,
            "donor.email": 0,
            "donor.phone": 0,
            "donor.isVerified": 0,
            "donor.userType": 0,
            "donor.createdAt": 0,
            "donor.updatedAt": 0,
            "donor.__v": 0,
          },
        },
      ]);
      return res.status(200).json({ success: true, donations });
    }
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message });
  }
};

// @route   GET /api/donation/show-status
// @desc    Show a recipient status
// @access  Private
export const status = async (req, res) => {
  try {
    const status = await Donation.find({
      recipient: req.user._id,
    })
      .select("amount items donationStatusDescription donationStatus")
      .populate("items", "name");

    return res.status(200).json({ status, success: true });
  } catch (error) {
    console.error(error.message);
    return res.status(404).json({ success: false, message: error.message });
  }
};

// @route   GET /api/donation/:id/show
// @desc    Show a single donation
// @access  Private
export const getDonation = async (req, res) => {
  try {
    const donation = await Donation.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(req.params.id),
        },
      },
      {
        $lookup: {
          from: "items",
          localField: "items",
          foreignField: "_id",
          as: "items",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "donor",
          foreignField: "_id",
          as: "donor",
        },
      },
      {
        $unwind: "$donor",
      },
      {
        $project: {
          "donor.password": 0,
          "donor.email": 0,
          "donor.phone": 0,
          "donor.isVerified": 0,
          "donor.userType": 0,
          "donor.createdAt": 0,
          "donor.updatedAt": 0,
          "donor.__v": 0,
        },
      },
    ]);
    return res.status(200).json({ success: true, donation: donation[0] });
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message });
  }
};

// @route   PUT /api/donation/:id/update-donation
// @desc    Update a donation
// @access  Private
export const updateDonation = async (req, res) => {
  const { items, donationType, amount, cardNumber, cardName, expiry, cvv } =
    req.body;
  const errors = [];

  if (!donationType) {
    errors.push({ message: "Donation Type is required" });
  }

  if (donationType === "Money") {
    if (!cardNumber) {
      errors.push({ message: "Card Number is required" });
    }

    if (!cardName) {
      errors.push({ message: "Card Name is required" });
    }

    if (!expiry) {
      errors.push({ message: "Expiry is required" });
    }

    if (!cvv) {
      errors.push({ message: "CVV is required" });
    }
  }

  if (donationType === "Food Items" && items.length === 0) {
    errors.push({ message: "Items are required" });
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: errors[0].message });
  }

  try {
    const donation = await Donation.findById(req.params.id);

    donation.donationType = donationType;
    donation.amount = amount;
    donation.items = items;
    donation.cardNumber = cardNumber;
    donation.cardName = cardName;
    donation.expiry = expiry;
    donation.cvv = cvv;

    await donation.save();

    return res
      .status(200)
      .json({ success: true, message: "Donation updated successfully" });
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message });
  }
};

// @route   PATCH /api/donation/:id/update
// @desc    Update a donation status
// @access  Private
export const updateDonationStatus = async (req, res) => {
  const { donationStatus, donationStatusDescription } = req.body;

  if (!donationStatus || !donationStatusDescription) {
    return res.status(400).json({
      success: false,
      message: "Donation Status and Description are required",
    });
  }
  try {
    const donation = await Donation.findById(req.params.id);

    donation.donationStatus = donationStatus;
    donation.donationStatusDescription = donationStatusDescription;
    await donation.save();
    return res.status(200).json({
      success: true,
      message: "Donation status is updated successfully",
    });
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message });
  }
};

// @route   DELETE /api/donation/:id/delete
// @desc    Delete a donation
// @access  Private
export const deleteDonation = async (req, res) => {
  try {
    await Donation.findByIdAndDelete(req.params.id);

    // Revert the quantity of the items
    const donation = await Donation.findById(req.params.id);
    if (donation.donationType === "Food Items") {
      for (let i = 0; i < donation.items.length; i++) {
        const item = await Item.findById(donation.items[i]);
        item.quantity = item.quantity + donation.quantity[i];
        await item.save();
      }
    }

    return res
      .status(200)
      .json({ success: true, message: "Donation deleted successfully" });
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message });
  }
};

// @route  PATCH /api/donation/:id/claim
// @desc   Claim a donation
// @access Private
export const claimDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id).populate("items");

    // Map the items and add comma between them
    const items = donation.items.map((item) => item.name).join(", ");

    donation.recipient = req.user._id;
    donation.donationStatus = "Claimed";
    donation.donationStatusDescription = `You claimed this donation with ${
      items || donation.amount
    }`;
    await donation.save();

    const chat = await Chat.find({
      $and: [
        { users: { $elemMatch: { $eq: donation.donor } } },
        { users: { $elemMatch: { $eq: donation.recipient } } },
      ],
    });

    if (chat.length === 0) {
      const newChat = new Chat({
        chatName: "sender",
        users: [donation.donor, donation.recipient],
      });
      await newChat.save();

      // Map the items and add comma between them
      const items = donation.items.map((item) => item.name).join(", ");

      // Send message to the donor
      const newMessage = new Message({
        sender: req.user._id,
        content: `I have claimed ${items || donation.amount}`,
        chat: newChat._id,
      });
      await newMessage.save();
    }

    return res
      .status(200)
      .json({ success: true, message: "Donation claimed successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route  GET /api/donation/count
// @desc   Count the number of donations
// @access Private
export const countDonations = async (req, res) => {
  try {
    const count = await Donation.countDocuments();
    return res.status(200).json({ success: true, count });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route  GET /api/donation/count/donors-recipients
// @desc   Count the number of donors and recipients
// @access Private
export const countDonorsRecipients = async (_req, res) => {
  try {
    const donors = await User.countDocuments({
      $and: [{ userType: "Donor" }, { isVerified: true }],
    });
    const recipients = await User.countDocuments({
      $and: [{ userType: "Recipient" }, { isVerified: true }],
    });
    return res.status(200).json({ success: true, donors, recipients });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/donation/count/claimed-donations
// @desc Count the number of claimed donations
// @access Private
export const countClaimedDonations = async (_req, res) => {
  try {
    const claimedDonations = await Donation.countDocuments({
      donationStatus: "Claimed",
    });
    return res.status(200).json({ success: true, claimedDonations });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route   PATCH /api/donation/:id/approve
// @desc    Approve a donation
// @access  Private
export const approveDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);

    donation.isApproved = true;
    await donation.save();

    return res
      .status(200)
      .json({ success: true, message: "Donation approved successfully" });
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message });
  }
};

export const createOrder = async (req, res) => {
  try {
    const { amount, currency, billingData } = req.body;

    // Step 1: Authentication
    const authResponse = await axios.post(
      "https://accept.paymobsolutions.com/api/auth/tokens",
      {
        api_key: process.env.PAYMOB_API_KEY,
      }
    );
    const token = authResponse.data.token;

    // Step 2: Create Order
    const orderResponse = await axios.post(
      "https://accept.paymobsolutions.com/api/ecommerce/orders",
      {
        auth_token: token,
        delivery_needed: false,
        amount_cents: amount * 100, // amount in cents
        currency: currency,
        items: [],
      }
    );
    const orderId = orderResponse.data.id;

    // Step 3: Generate Payment Key
    const paymentKeyResponse = await axios.post(
      "https://accept.paymobsolutions.com/api/acceptance/payment_keys",
      {
        auth_token: token,
        amount_cents: amount * 100,
        expiration: 3600,
        order_id: orderId,
        billing_data: billingData,
        currency: currency,
        integration_id: process.env.PAYMOB_INTEGRATION_ID,
      }
    );

    // Store order and payment details in MongoDB
    const payment = new Payment({
      orderId,
      amount,
      currency,
      billingData,
      paymentKey: paymentKeyResponse.data.token,
      iframeId: process.env.PAYMOB_IFRAME_ID,
    });

    await payment.save();

    res.json({
      payment_key: paymentKeyResponse.data.token,
      iframe_id: PAYMOB_IFRAME_ID,
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
};
