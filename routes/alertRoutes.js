const express = require("express");
const router = express.Router();

const { getBranchAlerts,getAdminAlerts,markAlertRead,createAlert,getWeeklyAlertStats} = require("../controllers/alertController");

const verifyToken = require("../middleware/authMiddleware");
const checkRole = require("../middleware/roleMiddleware");

router.get("/branch/:branchId", verifyToken, getBranchAlerts);
router.get("/admin", verifyToken, checkRole("admin"), getAdminAlerts);
router.put("/mark-read/:id", verifyToken, markAlertRead);
router.post("/create", verifyToken, createAlert);
router.get("/weekly-stats", verifyToken, checkRole("admin"), getWeeklyAlertStats);

module.exports = router;
