const pool = require("../config/db");
exports.getAdminSummary = async (req, res) => {
  try {
    const totalBranches = await pool.query(
      "SELECT COUNT(*) FROM branches"
    );

    const activeBranches = await pool.query(
      "SELECT COUNT(*) FROM branches WHERE is_active = true"
    );

    const totalUsers = await pool.query(
      "SELECT COUNT(*) FROM users"
    );

    res.json({
      totalBranches: totalBranches.rows[0].count,
      activeBranches: activeBranches.rows[0].count,
      totalUsers: totalUsers.rows[0].count
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
