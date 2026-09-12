const path = require("path");

const Payment = require("../models/paymentModel");
const User = require("../models/User");

const {
    createOrder,
    getPaymentStatus
} = require("../services/cashfreeService");


// exports.getPaymentPage = (req, res) => {
//     res.sendFile(
//         path.join(__dirname, "../public/pages/payment/index.html")
//     );
// };
exports.getPaymentPage = (req, res) => {
    res.sendFile(
        path.join(__dirname, "../frontend/public/pages/payment/index.html")
    );
};


exports.processPayment = async (req, res) => {

    const orderId = "ORDER-" + Date.now();
    const orderAmount = 2000;
    const orderCurrency = "INR";
    const customerID = String(req.user.id);
    const customerPhone = "9999999999";

    try {

        // Create order in Cashfree
        const paymentSessionId = await createOrder(
            orderId,
            orderAmount,
            orderCurrency,
            customerID,
            customerPhone
        );

        // Save payment details in database, linked to the logged-in user
        await Payment.create({
            userId: req.user.id,
            orderId,
            paymentSessionId,
            orderAmount,
            orderCurrency,
            paymentStatus: "Pending"
        });

        res.json({
            paymentSessionId,
            orderId
        });

    } catch (error) {

        console.error(
            "Error processing payment:",
            error.message
        );

        res.status(500).json({
            error: error.message
        });
    }
};



exports.getPaymentStatus = async (req, res) => {
    try {
        const { orderId } = req.params;

        // Make sure this order actually belongs to the logged-in user
        const payment = await Payment.findOne({ where: { orderId } });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        if (payment.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to view this order"
            });
        }

        // Get payment status from Cashfree
        const orderData = await getPaymentStatus(orderId);

        // Get calculated payment status ("Success" | "Pending" | "Failure")
        const orderStatus = orderData.orderStatus;

        // Update payment status in database
        await Payment.update(
            {
                paymentStatus: orderStatus
            },
            {
                where: {
                    orderId: orderId
                }
            }
        );

        // On success, mark this user as premium so it persists in the DB
        if (orderStatus === "Success") {
            await User.update(
                { isPremium: true },
                { where: { id: req.user.id } }
            );
        }

        // Send response
        res.json({
            success: true,
            orderId: orderId,
            orderStatus: orderStatus,
            isPremium: orderStatus === "Success",
            orderData: orderData.data
        });

    } catch (error) {
        console.error(
            "Error getting payment status:",
            error.message
        );

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};


// Lets the frontend check "is this logged-in user premium?" on page
// load / after login, independent of any specific order.
exports.getPremiumStatus = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: ["id", "name", "isPremium"]
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            isPremium: user.isPremium,
            name: user.name
        });

    } catch (error) {
        console.error("Error fetching premium status:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch premium status"
        });
    }
};