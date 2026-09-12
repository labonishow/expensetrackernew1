require("dotenv").config();

const SibApiV3Sdk = require("sib-api-v3-sdk");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

const User = require("../models/User");
const ForgotPasswordRequests = require("../models/ForgotPasswordRequests");


const client = SibApiV3Sdk.ApiClient.instance;
const apiKey = client.authentications["api-key"];
apiKey.apiKey = process.env.MAIL_SERVICE_API_KEY;

const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

const forgotPassword = async (req, res) => {
  try {
    const email = req.body.email?.trim();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Find user
    const user = await User.findOne({
      where: {
        email: email,
      },
    });

    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "If an account exists for this email, a password reset link has been sent.",
      });
    }
    //generate uid
    const requestId = uuidv4();
    await ForgotPasswordRequests.create({
      id: requestId,
      userId: user.id,
      isActive: true,
    });

    const resetUrl = `${process.env.FRONTEND_BASE_URL}/resetpassword.html?requestId=${requestId}`;

    try {
      await tranEmailApi.sendTransacEmail({
        sender: {
          email: process.env.MAIL_SENDER_EMAIL,
          name: "Expense Tracker",
        },

        replyTo: {
          email: user.email,
        },

        to: [
          {
            email: process.env.MAIL_SENDER_EMAIL,
          },
        ],

        subject: "Reset your Expense Tracker password",

        textContent: `Hello ${user.name},

We received a request to reset your Expense Tracker password.

Click the link below to reset your password:

${resetUrl}

If you did not request a password reset, you can ignore this email.

Thank you.`,
      });
    } catch (emailError) {
      console.log(
        "Email could not be sent:",
        emailError.response?.body || emailError.message,
      );

      return res.status(200).json({
        success: true,
        message: "Reset request created but email could not be sent.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Password reset email sent successfully.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      success: false,

      message: "Something went wrong while creating password reset request.",
    });
  }
};
// GET /password/resetpassword/:requestId
const showResetPasswordPage = async (req, res) => {
  try {
    const requestId = req.params.requestId;

    // Find UUID in database
    const request = await ForgotPasswordRequests.findOne({
      where: {
        id: requestId,
        isActive: true,
      },
    });

    // UUID doesn't exist OR already used
    if (!request) {
      return res.status(400).json({
        success: false,
        message: "This password reset link has already been used or does not exist.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Valid reset link",
    });
  } catch (error) {
    console.error("Reset password page error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const requestId = req.params.requestId;

    const password = req.body.password;

    
    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 6 characters",
      });
    }

    
    const request = await ForgotPasswordRequests.findOne({
      where: {
        id: requestId,
        isActive: true,
      },
    });

    // Request doesn't exist
    if (!request) {
      return res.status(400).json({
        success: false,
        message: "Invalid or already used reset link",
      });
    }

    // Find user
    const user = await User.findByPk(request.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    
    const hashedPassword = await bcrypt.hash(password, 10);
    await user.update({
      password: hashedPassword,
    });

    
    await request.update({
      isActive: false,
    });

    return res.status(200).json({
      success: true,
      message:
        "Password updated successfully. You can now login with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while resetting password.",
    });
  }
};

module.exports = {
  forgotPassword,
  showResetPasswordPage,
  resetPassword,
};