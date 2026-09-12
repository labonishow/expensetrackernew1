const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {


const authHeader = req.headers.authorization;

// Check Authorization header
if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
        success: false,
        message: "No token provided"
    });
}

// Get token
const token = authHeader.split(" ")[1];

try {

    // Verify token (decrypts/validates the signed userId payload)
    const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
    );

    // Store user information
    req.user = {
        id: decoded.userId
    };

    next();

} catch (error) {

    console.error("JWT error:", error.message);

    return res.status(401).json({
        success: false,
        message: "Invalid or expired token"
    });
}


}

module.exports = {
authMiddleware
};
