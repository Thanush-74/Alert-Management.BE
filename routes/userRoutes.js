const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");
const checkRole = require("../middleware/roleMiddleware");

const {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserById,
} = require("../controllers/userController");

// Get all users (Admin only)
router.get("/", verifyToken, checkRole("admin"), getUsers);

router.get("/:id", verifyToken, checkRole("admin"), getUserById);

// Create user (Admin only)
router.post("/", verifyToken, checkRole("admin"), createUser);

// Update user (Admin only)
router.put("/:id", verifyToken, checkRole("admin"), updateUser);

// Delete user (Admin only)
router.delete("/:id", verifyToken, checkRole("admin"), deleteUser);


module.exports = router;