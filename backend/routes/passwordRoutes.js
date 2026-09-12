const express = require("express");

const router = express.Router();

const {
    forgotPassword,
    showResetPasswordPage,
    resetPassword
} = require("../controllers/passwordController");


// User clicks "Forgot Password"
router.post(
    "/forgotpassword",
    forgotPassword
);


// User clicks reset URL from email
router.get(
    "/resetpassword/:requestId",
    showResetPasswordPage
);


// User submits new password
router.post(
    "/resetpassword/:requestId",
    resetPassword
);


module.exports = router;