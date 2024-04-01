import nodemailer from "nodemailer";
import User from "../models/user.model.mjs";
import bcrypt from "bcryptjs";

export const sendEmail = async ({ email, emailType, userId }) => {
  try {
    // Generate token
    const hashToken = await bcrypt.hash(userId.toString(), 12);

    // Set token expiry
    const expiry = new Date(Date.now() + 3600000);

    switch (emailType) {
      // Update user with token and expiry
      case "verify":
        await User.findByIdAndUpdate(
          userId,
          {
            verifyToken: hashToken,
            verifyTokenExpiry: expiry,
          },
          { new: true }
        );
        break;
      // Update user with token and expiry
      case "reset":
        await User.findByIdAndUpdate(
          userId,
          {
            forgotPasswordToken: hashToken,
            forgotPasswordTokenExpiry: expiry,
          },
          { new: true }
        );
        break;
    }

    let transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    let mailOptions = {
      from: {
        name: "Food Donation Finder",
        email: process.env.EMAIL_USER,
      },
      to: email,
      subject: emailType === "verify" ? "Verify Email" : "Reset Password",
      html:
        emailType === "verify"
          ? `<h1>Verify Email</h1>
      <p>Click <a href="${process.env.CLIENT_URL}/verify/${hashToken}">here</a> to verify your email</p>`
          : `<h1>Reset Password</h1>
      <p>Click <a href="${process.env.CLIENT_URL}/reset-password/${hashToken}">here</a> to reset your password</p>`,
    };

    const mailResponse = await transporter.sendMail(mailOptions);

    return mailResponse;
  } catch (error) {
    throw new Error(error.message);
  }
};
