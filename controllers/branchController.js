const pool = require("../config/db");
const bcrypt = require("bcrypt");

exports.getBranches = async (req, res) => {
  try {
    const { page = 1, limit = 10, activeOnly } = req.query;

    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const offset = (pageNumber - 1) * pageSize;

    // 🔹 Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT b.id) AS total
      FROM branches b
      LEFT JOIN branch_pincodes bp
        ON b.id = bp.branch_id
      ${activeOnly === "true" ? "WHERE b.is_active = true" : ""}
    `;

    const countResult = await pool.query(countQuery);
    const total = parseInt(countResult.rows[0].total);

    // 🔹 Get paginated data
    const dataQuery = `
      SELECT 
        b.id,
        b.branch_name,
        b.address,
        b.city,
        b.branch_incharge,
        
        b.contact_number,
        b.is_active,
        STRING_AGG(bp.pincode, ', ') AS pincodes
      FROM branches b
      LEFT JOIN branch_pincodes bp
        ON b.id = bp.branch_id
      ${activeOnly === "true" ? "WHERE b.is_active = true" : ""}
      GROUP BY b.id
      ORDER BY b.id DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await pool.query(dataQuery, [pageSize, offset]);

    res.json({
      data: result.rows,
      total,
      page: pageNumber,
      limit: pageSize,
    });

  } catch (err) {
    console.error("Pagination Error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.searchBranchesByPincode = async (req, res) => {
  try {
    const { pincode } = req.query;

    if (!pincode) {
      return res.status(400).json({
        message: "Pincode is required"
      });
    }

    const result = await pool.query(
      `SELECT DISTINCT 
       b.id,
       b.branch_name,
       b.city,
       b.address,
       b.contact_number,
       b.branch_incharge,  
       b.is_active,
       STRING_AGG(bp.pincode, ', ') AS pincodes
FROM branches b
JOIN branch_pincodes bp
ON b.id = bp.branch_id
WHERE bp.pincode = $1
GROUP BY b.id
ORDER BY b.id DESC`,
      [pincode]
    );

    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error"
    });
  }
};


// ==========================================
// ✅ ADMIN DASHBOARD SUMMARY
// ==========================================
exports.getDashboardSummary = async (req, res) => {
  try {
    const totalBranchesQuery = `
      SELECT COUNT(*) FROM branches
    `;

    const activeBranchesQuery = `
      SELECT COUNT(*) FROM branches WHERE is_active = true
    `;

    const inactiveBranchesQuery = `
      SELECT COUNT(*) FROM branches WHERE is_active = false
    `;

    const totalAlertsQuery = `
      SELECT COUNT(*) FROM alerts
    `;

    const [
      totalBranches,
      activeBranches,
      inactiveBranches,
      totalAlerts,
    ] = await Promise.all([
      pool.query(totalBranchesQuery),
      pool.query(activeBranchesQuery),
      pool.query(inactiveBranchesQuery),
      pool.query(totalAlertsQuery),
    ]);

    res.json({
      totalBranches: parseInt(totalBranches.rows[0].count),
      activeBranches: parseInt(activeBranches.rows[0].count),
      inactiveBranches: parseInt(inactiveBranches.rows[0].count),
      totalAlerts: parseInt(totalAlerts.rows[0].count),
    });

  } catch (error) {
    console.error("Dashboard summary error:", error);
    res.status(500).json({ message: "Failed to load dashboard summary" });
  }
};



// ==========================================
// ✅ ADMIN GET SINGLE BRANCH (WITH PINCODES)
// ==========================================
exports.getSingleBranch = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT 
        b.id,
        b.branch_name,
        b.address,
        b.city,
        b.branch_incharge,
      
        b.contact_number,
        b.is_active,
        STRING_AGG(bp.pincode, ', ') AS pincodes
      FROM branches b
      LEFT JOIN branch_pincodes bp
        ON b.id = bp.branch_id
      WHERE b.id = $1
      GROUP BY b.id
    `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Branch not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};





// ==========================================
// ✅ADMIN CREATE BRANCH (WITH MULTIPLE PINCODES)
// ==========================================
exports.createBranch = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      branch_name,
      address,
      city,
      branch_incharge,
      contact_number,
      username,
      password,
      pincodes = [],
      is_active = true,
    } = req.body;

    await client.query("BEGIN");

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 1️⃣ Insert Branch
    const branchResult = await client.query(
      `INSERT INTO branches
      (branch_name, address, city, branch_incharge, contact_number, is_active)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING id`,
      [
        branch_name,
        address,
        city,
        branch_incharge,
        contact_number,
        is_active,
      ]
    );

    const branchId = branchResult.rows[0].id;

    // 2️⃣ Insert User
    const userResult = await client.query(
      `INSERT INTO users (name, email, password, role, is_active)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING id`,
      [
        branch_incharge,
        username,
        hashedPassword,
        "branch_user",
        true,
      ]
    );

    const userId = userResult.rows[0].id;

    // 3️⃣ Map user to branch
    await client.query(
      `INSERT INTO branch_user_mapping (user_id, branch_id)
       VALUES ($1,$2)`,
      [userId, branchId]
    );

    // 4️⃣ Insert pincodes
    for (let pincode of pincodes) {
      await client.query(
        `INSERT INTO branch_pincodes (branch_id, pincode)
         VALUES ($1,$2)`,
        [branchId, pincode]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Branch created successfully",
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Create branch error:", error);
    res.status(500).json({
      message: "Failed to create branch",
    });
  } finally {
    client.release();
  }
};


// ==========================================
// ✅ EDIT UPDATE BRANCH (WITH MULTIPLE PINCODES)
// ==========================================
exports.updateBranch = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    const {
      branch_name,
      address,
      city,
      branch_incharge,
      username,
      contact_number,
      is_active,
      pincodes = [],
    } = req.body;

    await client.query("BEGIN");

    // 1️⃣ Update branch details
    const result = await client.query(
    `UPDATE branches 
SET branch_name = $1,
    address = $2,
    city = $3,
    branch_incharge = $4,
    contact_number = $5,
    is_active = $6
WHERE id = $7`,
[
  branch_name,
  address,
  city,
  branch_incharge,
  contact_number,
  is_active,
  id
]
    );

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Branch not found" });
    }

    // 2️⃣ Delete old pincodes
    await client.query(`DELETE FROM branch_pincodes WHERE branch_id = $1`, [
      id,
    ]);

    // 3️⃣ Insert new pincodes (only if exists)
    if (Array.isArray(pincodes) && pincodes.length > 0) {
      for (const pincode of pincodes) {
        await client.query(
          `INSERT INTO branch_pincodes (branch_id, pincode)
           VALUES ($1, $2)`,
          [id, pincode],
        );
      }
    }

    await client.query("COMMIT");

    res.json({ message: "Branch updated successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Update branch error:", error);
    res.status(500).json({ message: "Failed to update branch" });
  } finally {
    client.release();
  }
};


// ==========================================
// ADMIN TOGGLE BRANCH STATUS
// ==========================================
exports.toggleBranchStatus = async (req, res) => {
  try {
    console.log("Request Body:", req.body);
    const { id } = req.params;

    const branch = await pool.query(
      "SELECT is_active FROM branches WHERE id = $1",
      [id]
    );

    if (branch.rows.length === 0) {
      return res.status(404).json({ message: "Branch not found" });
    }

    const currentStatus = branch.rows[0].is_active;

    await pool.query(
      "UPDATE branches SET is_active = $1 WHERE id = $2",
      [!currentStatus, id]
    );

    res.json({ message: "Branch status updated" });
  } catch (error) {
    console.error("Toggle error:", error);
    res.status(500).json({ message: "Server error" });
  }
};





