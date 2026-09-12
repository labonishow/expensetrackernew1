const express = require("express");

const router = express.Router();

const {
  createExpense,
  getExpenses,
  deleteExpense,
  downloadExpenses,
} = require("../controllers/expressController");

const Middleware = require("../middleware/authMiddleware");

router.get("/download", Middleware.authMiddleware, downloadExpenses);

router.post("/", Middleware.authMiddleware, createExpense);

router.get("/", Middleware.authMiddleware, getExpenses);

router.delete("/:id", Middleware.authMiddleware, deleteExpense);

module.exports = router;