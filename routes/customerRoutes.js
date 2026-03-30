const express = require("express");
const router = express.Router();

// ✅ IMPORT BOTH
const {
  createCustomerRequest,
  getCustomerBranch
} = require("../controllers/customerController");

// ✅ USE SAME NAME
const verifyToken = require("../middleware/authMiddleware");

// Routes
router.post("/request", verifyToken, createCustomerRequest);
// router.post("/request", createCustomerRequest);
// router.get("/customer/branch", getCustomerBranch);
router.get("/branch", getCustomerBranch);

module.exports = router;


