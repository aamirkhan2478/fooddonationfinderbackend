import Donation from "../models/donation.model.mjs";

// @route   POST /api/donation/add
// @desc    Create a new donation
// @access  Private
export const createDonation = async (req, res) => {
  const { recipient, items, donationType } = req.body;
  const errors = [];

  if (!recipient) {
    errors.push({ message: "Recipient is required" });
  }

  if (!items || items.length === 0) {
    errors.push({ message: "Donation items are required" });
  }

  if(!donationType){
    errors.push({message: "Donation Type is required"})
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: errors[0].message});
  }


  try {
    // Create a new donation
    const donation = new Donation({
      donar: req.user._id,
      recipient,
      donationType,
      items,
    });

    // Save the donation to the database
    await donation.save();

    // Send the donation as a response
    return res.status(201).json(donation);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/donation/all
// @desc    Show all donations
// @access  Private
export const getDonations = async (req, res) => {
  try {
    const donations = await Donation.aggregate([
      {
        $match: {
          $or: [
            { donor: req.user._id },
            { recipient: req.user._id },
          ],
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
        $lookup: {
          from: "users",
          localField: "recipient",
          foreignField: "_id",
          as: "recipient",
        },
      },
      {
        $unwind: "$donor",
      },
      {
        $unwind: "$recipient",
      },
    ]);
    res.status(200).json(donations);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// @route   GET /api/donation/show/:id
// @desc    Show a single donation
// @access  Private
export const getDonation = async (req, res) => {
  try {
    const donation = await Donation.aggregate([
      {
        $match: {
          _id: req.params.id,
          $or: [
            { donor: req.user._id },
            { recipient: req.user._id },
          ],
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
        $lookup: {
          from: "users",
          localField: "recipient",
          foreignField: "_id",
          as: "recipient",
        },
      },
      {
        $unwind: "$donor",
      },
      {
        $unwind: "$recipient",
      },
    ]);
    res.status(200).json(donation);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// @route   PUT /api/donation/update/:id
// @desc    Update a donation
// @access  Private
export const updateDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (donation.donor.toString() !== req.user._id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    donation.donationStatus = req.body.donationStatus;
    await donation.save();
    res.status(200).json(donation);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// @route   DELETE /api/donation/delete/:id
// @desc    Delete a donation
// @access  Private
export const deleteDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (donation.donor.toString() !== req.user._id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    await donation.remove();
    res.status(200).json({ message: "Donation deleted successfully" });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};
