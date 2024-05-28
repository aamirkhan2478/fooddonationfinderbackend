import Volunteer from "../models/volunteer.model.mjs";

// @route   POST /api/volunteer/add
// @desc    Create a new volunteer
// @access  Public
export const createVolunteer = async (req, res) => {
  const { name, email, message } = req.body;
  const errors = [];

  if (!name) {
    errors.push({ message: "Name is required" });
  }

  if (!email) {
    errors.push({ message: "Email is required" });
  }

  if (!message) {
    errors.push({ message: "Message is required" });
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: errors[0].message });
  }

  // Check if email is valid
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9-]+.+.[A-Z]{2,4}$/i;
  if (!emailRegex.test(email)) {
    return res
      .status(400)
      .json({ message: "Email is not valid", success: false });
  }

  try {
    // Create a new volunteer
    const volunteer = new Volunteer({
      name,
      email,
      message,
    });

    // Save the volunteer to the database
    await volunteer.save();

    // Send the volunteer as a response
    return res
      .status(201)
      .json({ success: true, message: "Volunteer added successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route   GET /api/volunteer/all
// @desc    Show all volunteers
// @access  Private
export const getVolunteers = async (_, res) => {
  try {
    // Find all volunteers
    const volunteers = await Volunteer.find();

    // Send the volunteers as a response
    return res.status(200).json({ success: true, volunteers });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
