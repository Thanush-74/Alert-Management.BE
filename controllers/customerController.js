const pool = require("../config/db");

const createCustomerRequest = async (req, res) => {
  const client = await pool.connect();

  try {
    const io = req.app.get("io");

    // ✅ Get phone from JWT token (if using auth middleware)
    // OR from request body (if not using auth)
    const { name, pincode } = req.body;
    const phone = req.user?.phone || req.body.phone; // Support both

    // 🔐 Auth check
    if (!phone) {
      return res.status(401).json({
        message: "Phone number is required. Please login again."
      });
    }

    // 🧾 Validation
    if (!name?.trim()) {
      return res.status(400).json({
        message: "Name is required"
      });
    }

    if (!pincode || pincode.length !== 6) {
      return res.status(400).json({
        message: "Valid 6-digit pincode is required"
      });
    }

    if (phone.length !== 10) {
      return res.status(400).json({
        message: "Phone must be 10 digits"
      });
    }

    await client.query("BEGIN");

    // 🔎 Find branch
    const branchResult = await client.query(
      `SELECT DISTINCT b.*
       FROM branches b
       JOIN branch_pincodes bp
       ON b.id = bp.branch_id
       WHERE bp.pincode = $1
       AND b.is_active = true
       LIMIT 1`,
      [pincode]
    );

    const branch = branchResult.rows[0] || null;
    const status = branch ? "Branch Found" : "No Branch";

    // 👤 UPSERT customer (BEST PRACTICE)
const customerResult = await client.query(
  `INSERT INTO customers (name, phone, pincode)
   VALUES ($1, $2, $3)
   ON CONFLICT (phone)
   DO UPDATE SET 
     name = EXCLUDED.name,
     pincode = EXCLUDED.pincode
   RETURNING id`,
  [name.trim(), phone, pincode]
);

    const customerId = customerResult.rows[0].id;

    // 📝 Save request
    await client.query(
      `INSERT INTO customer_requests (customer_id, pincode, status)
       VALUES ($1, $2, $3)`,
      [customerId, pincode, status]
    );

    // ❌ No branch case
    if (!branch) {
      await client.query("COMMIT");

      // 📡 Emit to customer
      io.to(`customer_${phone}`).emit("customerAlert", {
        message: "No branch available for this pincode",
        branch: null
      });

      return res.status(200).json({
        branchAvailable: false,
        message: "No branch available for this pincode. Check out our products!"
      });
    }

    // 🔔 Create alert for branch
    const alertResult = await client.query(
      `INSERT INTO alerts (branch_id, pincode, message)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [branch.id, pincode, `New customer request from ${name} for pincode ${pincode}`]
    );

    const alert = alertResult.rows[0];

    await client.query("COMMIT");

    // 📡 Emit socket events
    io.to(`branch_${branch.id}`).emit("newAlert", alert);
    io.to("admin").emit("newAlert", alert);
    io.to(`customer_${phone}`).emit("customerAlert", {
      message: "Branch found successfully",
      branch: {
        id: branch.id,
        branch_name: branch.branch_name,
        address: branch.address,
        phone: branch.contact_number
      }
    });

    // ✅ Success response
    res.status(200).json({
      branchAvailable: true,
      message: "Branch found successfully",
      branch: {
        id: branch.id,
        branch_name: branch.branch_name,
        address: branch.address,
        phone: branch.contact_number
      }
    });

  } catch (err) {
    await client.query("ROLLBACK");

    console.error("Create Customer Request Error:", err);

    res.status(500).json({
      message: "Server error while processing request"
    });

  } finally {
    client.release();
  }
};

const getCustomerBranch = async (req, res) => {
  try {
    const { phone } = req.query;

    if (!phone) {
      return res.status(400).json({ 
        message: "Phone number is required" 
      });
    }

    if (phone.length !== 10) {
      return res.status(400).json({ 
        message: "Invalid phone number" 
      });
    }

    const result = await pool.query(`
      SELECT b.id, b.branch_name, b.address, b.contact_number
      FROM customer_requests cr
      JOIN customers c ON c.id = cr.customer_id
      LEFT JOIN branch_pincodes bp ON bp.pincode = cr.pincode
      LEFT JOIN branches b 
        ON b.id = bp.branch_id 
        AND b.is_active = true
      WHERE c.phone = $1
        AND cr.status = 'Branch Found'
      ORDER BY cr.created_at DESC
      LIMIT 1
    `, [phone]);

    if (result.rows.length === 0 || !result.rows[0].id) {
      return res.json({ 
        branch: null,
        message: "No branch found for this customer"
      });
    }

    const branch = result.rows[0];

    res.json({
      branch: {
        id: branch.id,
        branch_name: branch.branch_name,
        address: branch.address,
        phone: branch.contact_number
      }
    });

  } catch (err) {
    console.error("Get Customer Branch Error:", err);
    res.status(500).json({ 
      message: "Server error while fetching branch" 
    });
  }
};

module.exports = {
  createCustomerRequest,
  getCustomerBranch
};

// const pool = require("../config/db");

// const createCustomerRequest = async (req, res) => {
//   const client = await pool.connect();

//   try {
//     const io = req.app.get("io");

//     const { name, pincode } = req.body;
//     const phone = req.user?.phone;
//     // const { name, pincode, phone } = req.body;
//     // const { phone } = req.query;

//     // 🔐 Auth check
//     if (!phone) {
//       return res.status(401).json({
//         message: "Unauthorized"
//       });
//     }

//     // 🧾 Validation
//     if (!name || !pincode) {
//       return res.status(400).json({
//         message: "Name and pincode are required"
//       });
//     }

//     if (phone.length !== 10) {
//       return res.status(400).json({
//         message: "Phone must be 10 digits"
//       });
//     }

//     if (pincode.length !== 6) {
//       return res.status(400).json({
//         message: "Pincode must be 6 digits"
//       });
//     }

//     await client.query("BEGIN");

//     // 🔎 Find branch
//     const branchResult = await client.query(
//       `SELECT DISTINCT b.*
//        FROM branches b
//        JOIN branch_pincodes bp
//        ON b.id = bp.branch_id
//        WHERE bp.pincode = $1
//        AND b.is_active = true`,
//       [pincode]
//     );

//     const branch = branchResult.rows[0] || null;
//     const status = branch ? "Branch Found" : "No Branch";

//     // 👤 UPSERT customer (BEST PRACTICE)
//     const customerResult = await client.query(
//       `INSERT INTO customers (name, phone, pincode)
//        VALUES ($1, $2, $3)
//        ON CONFLICT (phone)
//        DO UPDATE SET 
//          name = EXCLUDED.name,
//          pincode = EXCLUDED.pincode
//        RETURNING id`,
//       [name, phone, pincode]
//     );

//     const customerId = customerResult.rows[0].id;

//     // 📝 Save request
//     await client.query(
//       `INSERT INTO customer_requests (customer_id, pincode, status)
//        VALUES ($1,$2,$3)`,
//       [customerId, pincode, status]
//     );

//     // ❌ No branch case
//     if (!branch) {
//       await client.query("COMMIT");

//       return res.status(200).json({
//         branchAvailable: false,
//         message: "No branch available for this pincode"
//       });
//     }

//     // 🔔 Create alert
//     const alertResult = await client.query(
//       `INSERT INTO alerts (branch_id, pincode, message)
//        VALUES ($1,$2,$3)
//        RETURNING *`,
//       [branch.id, pincode, `New customer request for pincode ${pincode}`]
//     );

//     const alert = alertResult.rows[0];

//     await client.query("COMMIT");

//     // 📡 Emit socket events
//     io.to(`branch_${branch.id}`).emit("newAlert", alert);
//     io.to("admin").emit("newAlert", alert);
//     io.to(`customer_${phone}`).emit("customerAlert", {
//   message: "Branch found successfully",
//   branch
// });

//     // ✅ Success response
//     res.status(200).json({
//       branchAvailable: true,
//       message: "Branch found",
//       branch: {
//         id: branch.id,
//         branch_name: branch.branch_name,
//         address: branch.address,
//         phone: branch.contact_number
//       }
//     });

//   } catch (err) {
//     await client.query("ROLLBACK");

//     console.error(err);

//     res.status(500).json({
//       message: "Server error"
//     });

//   } finally {
//     client.release();
//   }
// };
// const getCustomerBranch = async (req, res) => {
//   try {
//     const { phone } = req.query;

//     if (!phone) {
//       return res.status(400).json({ message: "Phone required" });
//     }

//     const result = await pool.query(`
//       SELECT b.id, b.branch_name, b.address, b.contact_number
//       FROM customer_requests cr
//       JOIN customers c ON c.id = cr.customer_id
//       LEFT JOIN branch_pincodes bp ON bp.pincode = cr.pincode
//       LEFT JOIN branches b 
//       ON b.id = bp.branch_id 
//       AND b.is_active = true
//       WHERE c.phone = $1
//       ORDER BY cr.created_at DESC
//       LIMIT 1
//     `, [phone]);

//     if (result.rows.length === 0 || !result.rows[0].id) {
//       return res.json({ branch: null });
//     }

//     const branch = result.rows[0];

//     res.json({
//       branch: {
//         id: branch.id,
//         branch_name: branch.branch_name,
//         address: branch.address,
//         phone: branch.contact_number
//       }
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// module.exports = {
//   createCustomerRequest,
//   getCustomerBranch
// };