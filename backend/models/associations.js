// const User = require("./User");
// const Expense = require("./expenseModel");
// const Payment = require("./paymentModel");
// const ForgotPasswordRequests = require("./ForgotPasswordRequests");

// User.hasMany(Expense, {
//     foreignKey: "userId"
// });

// Expense.belongsTo(User, {
//     foreignKey: "userId"
// });

// User.hasMany(Payment, {
//     foreignKey: "userId"
// });

// Payment.belongsTo(User, {
//     foreignKey: "userId"
// });

// // Forgot Password relationship

// User.hasMany(ForgotPasswordRequests, {
//     foreignKey: "userId"
// });

// ForgotPasswordRequests.belongsTo(User, {
//     foreignKey: "userId"
// });

// module.exports = {
//     User,
//     Expense,
//     Payment,
//     ForgotPasswordRequests
// };