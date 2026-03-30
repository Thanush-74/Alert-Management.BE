
// const express = require("express");
// const router = express.Router();
// const pool = require("../config/db");

// const verifyToken = require("../middleware/authMiddleware");
// const checkRole = require("../middleware/roleMiddleware");

// router.get("/customers", verifyToken, checkRole("admin"), async (req, res) => {
//   try {
//     const result = await pool.query(`
//       SELECT
//         c.name,
//         c.phone,
//         cr.pincode,
//         cr.status,
//         cr.created_at
//       FROM customer_requests cr
//       JOIN customers c
//       ON cr.customer_id = c.id
//       ORDER BY cr.created_at DESC
//     `);
//     res.json(result.rows);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({
//       message: "Failed to fetch customers"
//     });
//   }
// });

// module.exports = router;


const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const verifyToken = require("../middleware/authMiddleware");
const checkRole = require("../middleware/roleMiddleware");

// ✅ ADD THIS - Admin Login (no auth needed for login)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1 AND role = 'admin'",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const admin = result.rows[0];

    if (!admin.is_active) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });

  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Existing route
router.get("/customers", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        c.name,
        c.phone,
        cr.pincode,
        cr.status,
        cr.created_at
      FROM customer_requests cr
      JOIN customers c
      ON cr.customer_id = c.id
      ORDER BY cr.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to fetch customers"
    });
  }
});

module.exports = router;