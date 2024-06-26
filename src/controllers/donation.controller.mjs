import mongoose from "mongoose";
import Donation from "../models/donation.model.mjs";
import User from "../models/user.model.mjs";
import Chat from "../models/chat.model.mjs";
import Message from "../models/message.model.mjs";

// @route   POST /api/donation/add
// @desc    Create a new donation
// @access  Private
export const createDonation = async (req, res) => {
  const { item, donationType, payment } = req.body;
  const errors = [];

  if (!donationType) {
    errors.push({ message: "Donation Type is required" });
  }

  if (donationType === "Food Items" && !item) {
    errors.push({ message: "Items are required" });
  }

  if (donationType === "Money" && !payment) {
    errors.push({ message: "Payment is required" });
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: errors[0].message });
  }

  try {
    if (donationType === "Money") {
      // create new donation
      const donation = new Donation({
        donor: req.user._id,
        donationType,
        payment,
      });

      await donation.save();

      return res.status(201).json({
        success: true,
        message: "Donation created successfully",
      });
    }

    if (donationType === "Food Items") {
      const donation = new Donation({
        donor: req.user._id,
        donationType,
        item,
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
        },
        isApproved: true,
      })
        .populate("donor", "name")
        .populate("recipient", "name");

      return res.status(200).json({ success: true, donations });
    } else if (user.userType === "Admin") {
      const donations = await Donation.find({})
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
      $or: [
        { recipient: req.user._id },
        { donor: req.user._id }
      ]
    }).select("amount donationStatusDescription donationStatus");

    return res.status(200).json({ status, success: true });
  } catch (error) {
    console.error(error.message);
    return res.status(404).json({ success: false, message: error.message });
  }
};

// @route   GET /api/donation/delivered
// @desc    Show all delivered donations
// @access  Private
export const deliveredDonations = async (req, res) => {
  const { id } = req.user;
  try {
    const delivered = await Donation.find({
      donationStatus: "Delivered",
      isApproved: true,
      donor: id,
    }).populate("donor", "name");

    return res.status(200).json({ delivered, success: true });
  } catch (error) {
    console.error(error.message);
    return res.status(404).json({ success: false, message: error.message });
  }
};

// @route   GET /api/donation/claimed
// @desc    Show all claimed donations
// @access  Private
export const claimedDonations = async (req, res) => {
  const { id } = req.user;
  try {
    const claimed = await Donation.find({
      donationStatus: "Claimed",
      isApproved: true,
      recipient: id,
    })
      .populate("donor", "name")
      .populate("recipient", "name");

    return res.status(200).json({ claimed, success: true });
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
  const { item, donationType, payment } = req.body;
  const errors = [];

  if (!donationType) {
    errors.push({ message: "Donation Type is required" });
  }

  if (donationType === "Food Items" && !item) {
    errors.push({ message: "Items are required" });
  }

  if (donationType === "Money" && !payment) {
    errors.push({ message: "Payment is required" });
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: errors[0].message });
  }

  try {
    const donation = await Donation.findById(req.params.id);

    if (donationType === "Money") {
      donation.donationType = donationType;
      donation.payment = payment;
    }

    if (donationType === "Food Items") {
      donation.donationType = donationType;
      donation.item = item;
    }

    await donation.save();

    return res.status(200).json({
      success: true,
      message: "Donation updated successfully",
    });
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
    const donation = await Donation.findById(req.params.id);

    donation.recipient = req.user._id;
    donation.donationStatus = "Claimed";
    donation.donationStatusDescription = `You claimed this donation with ${
      donation.item.name || donation.payment.amount
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

      // Send message to the donor
      const newMessage = new Message({
        sender: req.user._id,
        content: `I have claimed ${
          donation.item.name || donation.payment.amount
        }`,
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
    const user = await User.findById(req.user._id);

    if (user.userType === "Admin") {
      const count = await Donation.countDocuments();
      return res.status(200).json({ success: true, count });
    } else {
      const count = await Donation.countDocuments({
        $and: [{ donor: req.user._id }],
      });
      return res.status(200).json({ success: true, count });
    }
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

// @route   PATCH /api/donation/:id/approved
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
