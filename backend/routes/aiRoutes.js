const express = require("express");
const router = express.Router();

const { getCategorySuggestion } = require("../controllers/aiController");

router.get("/suggest-category", getCategorySuggestion);

module.exports = router;