const express = require("express");

const router = express.Router();

const {
    forgotPassword,
    showResetPasswordPage,
    resetPassword
} = require("../controllers/passwordController");



router.post(
    "/forgotpassword",
    forgotPassword
);



router.get(
    "/resetpassword/:requestId",
    showResetPasswordPage
);



router.post(
    "/resetpassword/:requestId",
    resetPassword
);


module.exports = router;