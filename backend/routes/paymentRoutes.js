const express = require('express');
const router = express.Router();
const {
    getPaymentPage,
    processPayment,
    getPaymentStatus,
    getPremiumStatus
} = require('../controllers/paymentController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', getPaymentPage);
router.post('/pay', authMiddleware, processPayment);
router.get('/status/:orderId', authMiddleware, getPaymentStatus);
router.get('/premium-status', authMiddleware, getPremiumStatus);

module.exports = router;