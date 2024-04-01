import jwt from "jsonwebtoken";
import User from "../models/user.model.mjs";

const verifyToken = (res, token) => {
  if (!token) {
    return res.status(401).json({ message: "No token provided", success: false });
  }

  try {
    return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (error) {
    return res
      .status(401)
      .json({ message: error?.message || "Invalid token", success: false });
  }
};

const findUser = async (res, id) => {
  const user = await User.findById(id).select("-password -refreshToken");

  if (!user) {
    return res.status(404).json({ message: "Invalid access token", success: false });
  }

  return user;
};

const auth = async (req, res, next) => {
  try {
    // Get bearer token from header
    const bearerToken = req.headers.authorization;
    const token = bearerToken.split(" ")[1];
    const decoded = verifyToken(res, token);
    req.user = await findUser(res, decoded.id);
    next();
  } catch (error) {
    return res.status(401).json({
      message: error?.message || "Not authorized to access this route",
      success: false,
    });
  }
};

export default auth;
