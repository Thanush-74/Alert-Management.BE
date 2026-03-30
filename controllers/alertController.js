// const pool = require("../config/db");

// // Get branch alerts
// const   getBranchAlerts = async (req, res) => {
//   try {

//     const branchId = req.params.branchId;

//     const result = await pool.query(
//       "SELECT * FROM alerts WHERE branch_id=$1 ORDER BY created_at DESC",
//       [branchId]
//     );

//     res.json(result.rows);

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({
//       message: "Server error"
//     });
//   }
// };


// const getAdminAlerts = async (req, res) => {
//   try {

//     const result = await pool.query(
//       `SELECT 
//          a.*,
//          b.address,
//          b.city,
//          b.branch_incharge,
//          b.contact_number
//        FROM alerts a
//        LEFT JOIN branches b
//        ON a.branch_id = b.id
//        ORDER BY a.created_at DESC`
//     );

//     res.json(result.rows);

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({
//       message: "Server error"
//     });
//   }
// };
// const markAlertRead = async (req, res) => {
//   try {
//     const alertId = req.params.id;

//     await pool.query(
//       "UPDATE alerts SET is_read = true WHERE id = $1",
//       [alertId]
//     );

//     res.json({ message: "Alert marked as read" });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// };


// module.exports = {
//   getBranchAlerts,
//   getAdminAlerts,
//   markAlertRead
// };


const pool = require("../config/db");


// ==============================
// ✅ Get Branch Alerts
// ==============================
const getBranchAlerts = async (req, res) => {
  try {
    const branchId = req.params.branchId;//readbranch id

    if (!branchId) {
      return res.status(400).json({ message: "Branch ID required" });
    }

    const result = await pool.query(
      `SELECT *
       FROM alerts
       WHERE branch_id = $1
       ORDER BY created_at DESC`,
      [branchId]
    );

    res.json(result.rows);

  } catch (err) {
    console.error("Branch Alerts Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};



// ==============================
// ✅ Get Admin Alerts
// ==============================
const getAdminAlerts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        a.*,
        b.address,
        b.city,
        b.branch_incharge,
        b.contact_number
      FROM alerts a
      LEFT JOIN branches b
        ON a.branch_id = b.id
      ORDER BY a.created_at DESC
    `);

    res.json(result.rows);

  } catch (err) {
    console.error("Admin Alerts Error:", err.message);
    res.status(500).json({ message: err.message });
  }
};


// ==============================
// ✅ Mark Alert as Read
// ==============================
const markAlertRead = async (req, res) => {
  try {
    const alertId = req.params.id;

    if (!alertId) {
      return res.status(400).json({ message: "Alert ID required" });
    }

    await pool.query(
      `UPDATE alerts
       SET is_read = true
       WHERE id = $1`,
      [alertId]
    );

    res.json({ message: "Alert marked as read" });

  } catch (err) {
    console.error("Mark Read Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ==============================
// ✅ Create Alert + Send Notification
// ==============================
const createAlert = async (req, res) => {
  try {

    const { message, pincode, branch_id } = req.body;

    const result = await pool.query(
      `INSERT INTO alerts (message, pincode, branch_id)
       VALUES ($1,$2,$3)
       RETURNING *`,
      [message, pincode, branch_id]
    );

    const alert = result.rows[0];

    // 🔔 Send realtime notification to admin
    const io = req.app.get("io");

    io.to("admin").emit("newAlert", alert);

    res.json(alert);

  } catch (err) {
    console.error("Create Alert Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
///////////////////////////////////////////////////////////////




const getWeeklyAlertStats = async (req, res) => {
  try {

    const result = await pool.query(`
      SELECT 
        EXTRACT(DOW FROM created_at) AS day_index,
        COUNT(*) AS alerts
      FROM alerts
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY day_index
      ORDER BY day_index
    `);

    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

    const data = days.map((day, index) => {
      const found = result.rows.find(
        (r) => Number(r.day_index) === index
      );

      return {
        day,
        alerts: found ? Number(found.alerts) : 0
      };
    });

    res.json(data);

  } catch (err) {
    console.error("Weekly Stats Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


module.exports = {
  getBranchAlerts,
  getAdminAlerts,
  markAlertRead,
  createAlert,
  getWeeklyAlertStats
};