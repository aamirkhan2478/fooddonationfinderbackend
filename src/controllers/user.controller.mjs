import User from "../models/user.model.mjs";
import { sendEmail } from "../utils/mailer.utils.mjs";

// @route   POST /api/user/register
// @desc    Register new user
// @access  Public
export const register = async (req, res) => {
  // Get user details from request body
  const { name, email, password, userType } = req.body;

  // Check if all fields are provided
  if (!name || !email || !password || !userType) {
    return res
      .status(400)
      .json({ message: "All fields are required", success: false });
  }

  // Check if password is strong
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?&#_])[A-Za-z\d$@$!%*?&#_]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res
      .status(400)
      .json({ message: "Password must be 8 characters long, 1 special character, any number and one capital character", success: false });
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
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(400)
        .json({ message: "User already exists", success: false });
    }

    const user = new User({ name, email, password, userType });
    const savedUser = await user.save();

    // send verification email
    await sendEmail({ email, emailType: "verify", userId: savedUser._id });

    // return user without password
    const userWithOutPass = await User.findOne(savedUser._id).select(
      "-password -isVerified -verifyToken -verifyTokenExpiry"
    );

    // return success response
    return res.status(201).json({
      message: "Registered Successfully",
      success: true,
      user: userWithOutPass,
    });
  } catch (error) {
    // return error response
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

// @route   POST /api/user/verify-email
// @desc    Verify user email
// @access  Public
export const verifyEmail = async (req, res) => {
  // Get token from request body
  const { token } = req.body;

  // Check if token is provided
  if (!token) {
    return res.status(400).json({ message: "Invalid token", success: false });
  }

  try {
    // Find user with token and expiry
    const user = await User.findOne({
      verifyToken: token,
      verifyTokenExpiry: { $gt: Date.now() },
    });

    // Check if user exists
    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired token", success: false });
    }

    // Update user with verified email
    user.isVerified = true;

    // Remove token and expiry
    user.verifyToken = undefined;
    user.verifyTokenExpiry = undefined;

    // Save user
    await user.save();

    // return success response
    return res
      .status(200)
      .json({ message: "Email verified successfully", success: true });
  } catch (error) {
    // return error response
    return res.status(500).json({ message: error.message });
  }
};

// @route   POST /api/user/login
// @desc    Login user
// @access  Public
export const login = async (req, res) => {
  // Get email and password from request body
  const { email, password } = req.body;

  // Check if email and password are provided
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "All fields are required", success: false });
  }

  try {
    // Find user with email
    const user = await User.findOne({ email });

    // Check if user exists
    if (!user) {
      return res
        .status(400)
        .json({ message: "User not found", success: false });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Invalid credentials", success: false });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res
        .status(400)
        .json({ message: "Email not verified", success: false });
    }

    // Generate access token
    const token = user.generateAccessToken();

    const userWithOutPass = await User.findOne(user._id).select(
      "-password -isVerified -verifyToken -verifyTokenExpiry"
    );

    // return success response
    return res.status(200).json({
      message: "User loggedIn successfully",
      token,
      success: true,
      user: userWithOutPass,
    });
  } catch (error) {
    // return error response
    return res.status(500).json({ message: error.message, success: false });
  }
};

// @route   POST /api/user/forgot-password
// @desc    Forgot password
// @access  Public
export const forgotPassword = async (req, res) => {
  // Get email from request body
  const { email } = req.body;

  // Check if email is provided
  if (!email) {
    return res
      .status(400)
      .json({ message: "Email is required", success: false });
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return res
      .status(400)
      .json({ message: "Email is not valid", success: false });
  }

  try {
    // Find user with email
    const user = await User.findOne({ email });

    // Check if user exists
    if (!user) {
      return res
        .status(400)
        .json({ message: "User not found", success: false });
    }

    // send reset password email
    await sendEmail({ email, emailType: "reset", userId: user._id });

    // return success response
    return res
      .status(200)
      .json({ message: "Reset link sent to email", success: true });
  } catch (error) {
    // return error response
    return res.status(500).json({ message: error.message, success: false });
  }
};

// @route   POST /api/user/reset-password
// @desc    Reset password
// @access  Public
export const resetPassword = async (req, res) => {
  // Get token and password from request body
  const { token, password } = req.body;

  // Check if token and password are provided
  if (!token || !password) {
    return res
      .status(400)
      .json({ message: "All fields are required", success: false });
  }

  // Check if password is strong
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?&#_])[A-Za-z\d$@$!%*?&#_]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res
      .status(400)
      .json({ message: "Password must be 8 characters long, 1 special character, any number and one capital character", success: false });
  }

  try {
    // Find user with token and expiry
    const user = await User.findOne({
      forgotPasswordToken: token,
      forgotPasswordTokenExpiry: { $gt: Date.now() },
    });

    // Check if user exists
    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired token", success: false });
    }

    // Update user with new password
    user.password = password;

    // Remove token and expiry
    user.forgotPasswordToken = undefined;
    user.forgotPasswordTokenExpiry = undefined;

    // Save user
    await user.save();

    // return success response
    return res
      .status(200)
      .json({ message: "Password reset successfully", success: true });
  } catch (error) {
    // return error response
    return res.status(500).json({ message: error.message, success: false });
  }
};

// @route   GET /api/user
// @desc    Get loggedIn user
// @access  Private
export const getUser = async (req, res) => {
  try {
    // Find user by id and exclude password
    const user = await User.findById(req.user._id).select("-password");

    // return loggedIn user
    return res.status(200).json({ user, success: true });
  } catch (error) {
    // return error response
    return res.status(500).json({ message: error.message, success: false });
  }
};

// @route   PATCH /api/user/update-image
// @desc    Update loggedIn user image
// @access  Private
export const updateImage = async (req, res) => {
  // Get image from request body
  const { pic } = req.body;

  try {
    // Find user by id
    const user = await User.findById(req.user._id);

    // Check if user exists
    if (!user) {
      return res
        .status(400)
        .json({ message: "User not found", success: false });
    }

    
    if (!pic ) {
      return res
        .status(400)
        .json({ message: "Please select an image!", success: false });
    }

    // Update user with new image
    user.pic = pic;

    // Save user
    await user.save();

    // return success response
    return res
      .status(200)
      .json({ message: "Image updated successfully", success: true });
  } catch (error) {
    // return error response
    return res.status(500).json({ message: error.message, success: false });
  }
};

// @route   PUT /api/user
// @desc    Update loggedIn user
// @access  Private
export const updateUser = async (req, res) => {
  try {
    // Find user by id
    const user = await User.findById(req.user._id);

    // Check if user exists
    if (!user) {
      return res
        .status(400)
        .json({ message: "User not found", success: false });
    }

    // Get user details from request body
    const { name, email } = req.body;

    // Update user details
    if (name) user.name = name;
    if (email) user.email = email;

    // Save user
    await user.save();

    // return success response
    return res
      .status(200)
      .json({ message: "User updated successfully", success: true });
  } catch (error) {
    // return error response
    return res.status(500).json({ message: error.message, success: false });
  }
};

// @route   PUT api/user/change-password
// @desc    Change user password
// @access  Private
export const changePassword = async (req, res) => {
  // Get current password and new password from request body
  const { currentPassword, newPassword } = req.body;

  // Check if current password and new password are provided
  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: "All fields are required", success: false });
  }

  try {
    // Find user by id
    const user = await User.findById(req.user._id);

    // Check if user exists
    if (!user) {
      return res
        .status(400)
        .json({ message: "User not found", success: false });
    }

    // Check if current password matches
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Invalid current password", success: false });
    }

    // Update user with new password
    user.password = newPassword;

    // Save user
    await user.save();

    // return success response
    return res
      .status(200)
      .json({ message: "Password changed successfully", success: true });
  } catch (error) {
    // return error response
    return res.status(500).json({ message: error.message, success: false });
  }
};
