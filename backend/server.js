require("dotenv").config();
const express = require("express");
const path = require("path");
const fs = require("fs");
const sequelize = require("./config/database");
const authRoutes = require("./routes/authRoutes");
const expenseRoutes = require("./routes/expressRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");
const aiRoutes = require("./routes/aiRoutes");
const passwordRoutes = require("./routes/passwordRoutes");
const compression = require('compression');
const morgan = require('morgan')
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

app.use("/users", authRoutes);
app.use("/expense", expenseRoutes);
app.use("/payment", paymentRoutes);
app.use("/premium", leaderboardRoutes);
app.use("/ai", aiRoutes);
app.use("/password", passwordRoutes);
const accessLogStream = fs.createWriteStream(path.join(__dirname,'access.log'),{flags:'a'});
app.use(compression());
app.use(morgan('combined',{stream:accessLogStream}));

const PORT = process.env.PORT || 3000;
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully");

    await sequelize.sync();
    console.log("Database synchronized");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Unable to start server:", error);
  }
};

startServer();