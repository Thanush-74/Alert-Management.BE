const express = require("express");
const router = express.Router();

const { createOrder,getOrderDetails  } = require("../controllers/orderController");

// 🧾 Create Order Route
router.post("/", createOrder);
router.get("/order-details", getOrderDetails);

module.exports = router;

