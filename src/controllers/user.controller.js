import User from "../models/user.model.js";
import { sendEmail } from "../utils/mailer.utils.js";

export const register = async (req, res) => {
  const { userName, email, password, userType } = req.body;

  // Check if all fields are provided
  if (!userName || !email || !password || !userType) {
    return res
      .status(400)
      .json({ message: "All fields are required", success: false });
  }

  // Check if password is strong
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?&_])[A-Za-z\d$@$!%*?&_]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res
      .status(400)
      .json({ message: "Password is not strong enough", success: false });
  }

  // Check if email is valid
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9-]+.+.[A-Z]{2,4}$/i;
  if (!emailRegex.test(email)) {
    return res
      .status(400)
      .json({ message: "Email is not valid", success: false });
  }

  // Check if userType is valid
  const userTypes = ["Admin", "Donor", "Recipient"];
  if (!userTypes.includes(userType)) {
    return res
      .status(400)
      .json({ message: "Invalid user type", success: false });
  }

  try {
    // Check if user already exists
    const userExists = await User.findOne({ $or: [{ userName }, { email }] });
    if (userExists) {
      return res
        .status(400)
        .json({ message: "User already exists", success: false });
    }

    const user = new User({ userName, email, password, userType });
    const savedUser = await user.save();

    // send verification email
    await sendEmail({ email, emailType: "verify", userId: savedUser._id });

    const userWithOutPass = await User.findOne(savedUser._id).select(
      "-password"
    );
    return res.status(201).json({
      message: "Registered Successfully",
      success: true,
      user: userWithOutPass,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

export const verifyEmail = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: "Invalid token", success: false });
  }

  try {
    const user = await User.findOne({
      verifyToken: token,
      verifyTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired token", success: false });
    }

    user.isVerified = true;
    user.verifyToken = undefined;
    user.verifyTokenExpiry = undefined;

    await user.save();

    return res
      .status(200)
      .json({ message: "Email verified successfully", success: true });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "All fields are required", success: false });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(400)
        .json({ message: "User not found", success: false });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Invalid credentials", success: false });
    }

    if (!user.isVerified) {
      return res
        .status(400)
        .json({ message: "Email not verified", success: false });
    }

    const token = user.generateAccessToken();

    return res
      .status(200)
      .json({ message: "Logged in successfully", token, success: true });
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};
