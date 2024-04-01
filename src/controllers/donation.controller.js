import Donation from "../models/donation.model";

export const createDonation = async (req, res) => {
  try {
    const donation = new Donation({
      donor: req.user._id,
      recipient: req.body.recipient,
      donationItems: req.body.donationItems,
    });

    await donation.save();
    res.status(201).json(donation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getDonations = async (req, res) => {
  try {
    const donations = await Donation.find({ donor: req.user._id });
    res.status(200).json(donations);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const getDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    res.status(200).json(donation);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

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
