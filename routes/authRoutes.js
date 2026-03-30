  const express = require("express");
  const router = express.Router();

  const {
    createBranch,
// branchLogin,
    createAdmin,
    // adminLogin,
    loginUser,
    sendOtp,
    verifyOtp
  } = require("../controllers/authController");

const checkRole = require("../middleware/roleMiddleware");
const verifyToken = require("../middleware/authMiddleware");////

  router.post("/login", loginUser);
  router.post("/create-branch",verifyToken,checkRole("admin"),createBranch);
  router.post("/create-admin", createAdmin);
  router.post("/send-otp", sendOtp);
  router.post("/verify-otp", verifyOtp);

  module.exports = router;

