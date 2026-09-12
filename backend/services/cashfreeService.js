require("dotenv").config();
const { Cashfree, CFEnvironment } = require("cashfree-pg");

const cashfree = new Cashfree(
  CFEnvironment.SANDBOX,
  process.env.CASHFREE_CLIENT_ID,
  process.env.CASHFREE_CLIENT_SECRET
);

exports.createOrder = async (
  orderId,
  orderAmount,
  orderCurrency,
  customerId,
  customerPhone
) => {
  try {
    const expiryDate = new Date(Date.now() + 60 * 60 * 1000);
    const formattedExpiryDate = expiryDate.toISOString();

    const request = {
      order_amount: orderAmount,

      order_currency: orderCurrency,

      order_id: orderId,

      customer_details: {
        customer_id: customerId,
        customer_phone: customerPhone,
      },

      order_meta: {
        return_url:
          `${process.env.APP_BASE_URL}/payment/return?order_id={order_id}`,

        payment_methods: "cc,dc,upi",
      },

      order_expiry_time: formattedExpiryDate,
    };

    const response = await cashfree.PGCreateOrder(request);

    console.log("Order created successfully:", response.data);

    // The frontend SDK only needs the payment_session_id to launch checkout
    return response.data.payment_session_id;
  } catch (error) {
    console.error(
      "Cashfree Error:",
      error.response?.data || error.message
    );

    throw error;
  }
};


exports.getPaymentStatus = async (orderId) => {
  try {
    // Get all payments/transactions for the order
    const response = await cashfree.PGOrderFetchPayments(orderId);

    console.log("Payment transactions:", response.data);

    const getOrderResponse = response.data;

    let orderStatus;

    // Check SUCCESS payment
    if (
      getOrderResponse.filter(
        (transaction) => transaction.payment_status === "SUCCESS"
      ).length > 0
    ) {
      orderStatus = "Success";
    }

    // Check PENDING payment
    else if (
      getOrderResponse.filter(
        (transaction) => transaction.payment_status === "PENDING"
      ).length > 0
    ) {
      orderStatus = "Pending";
    }

    // Otherwise payment failed
    else {
      orderStatus = "Failure";
    }

    return {
      orderStatus,
      data: getOrderResponse,
    };
  } catch (error) {
    console.error(
      "Cashfree Error:",
      error.response?.data || error.message
    );

    throw error;
  }
};

