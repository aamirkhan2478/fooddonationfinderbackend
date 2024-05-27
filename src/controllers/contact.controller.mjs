import Contact from "../models/contact.model.mjs";

// @route   POST /api/contact/add
// @desc    Create a new contact
// @access  Public
export const createContact = async (req, res) => {
  const { name, phone, email, message } = req.body;
  const errors = [];

  if (!name) {
    errors.push({ message: "Name is required" });
  }

  if (!phone) {
    errors.push({ message: "Phone is required" });
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
    // Create a new contact
    const contact = new Contact({
      name,
      phone,
      email,
      message,
    });

    // Save the contact to the database
    await contact.save();

    // Send the contact as a response
    return res
      .status(201)
      .json({ success: true, message: "Thank you for contacting us." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route   GET /api/contact/all
// @desc    Show all contacts
// @access  Private
export const getContacts = async (_, res) => {
  try {
    // Find all contacts
    const contacts = await Contact.find();

    // Send the contacts as a response
    return res.status(200).json({ success: true, contacts });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
