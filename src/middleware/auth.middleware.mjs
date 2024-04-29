import jwt from "jsonwebtoken";
import User from "../models/user.model.mjs";

const verifyToken = (token) => {
  if (!token) {
    throw new Error("No token provided", 401);
  }

  try {
    return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (error) {
    throw new Error("Invalid token", 401);
  }
};

const findUser = async (id) => {
  const user = await User.findById(id).select("-password -refreshToken");

  if (!user) {
    throw new Error("Invalid access token", 401);
  }

  return user;
};

const auth = async (req, res, next) => {
  try {
    const bearerToken = req.headers.authorization;
    const token = bearerToken.split(" ")[1];
    const decoded = verifyToken(token);
    req.user = await findUser(decoded.id);
    next();
  } catch (error) {
    return res.status(401).json({
      message: error?.message || "Not authorized to access this route",
      success: false,
    });
  }
};

export default auth;
