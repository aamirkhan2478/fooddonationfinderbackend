import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const verifyToken = (res, token) => {
  if (!token) {
    res.status(401).json({ message: "No token provided", success: false });
  }

  try {
    return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (error) {
    res
      .status(401)
      .json({ message: error?.message || "Invalid token", success: false });
  }
};

const findUser = async (res, id) => {
  const user = await User.findById(id).select("-password -refreshToken");

  if (!user) {
    res.status(404).json({ message: "Invalid access token", success: false });
  }

  return user;
};

const auth = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    const decoded = verifyToken(res, token);
    req.user = await findUser(res, decoded.id);
    next();
  } catch (error) {
    res.status(401).json({
      message: error?.message || "Not authorized to access this route",
      success: false,
    });
  }
};

export default auth;
