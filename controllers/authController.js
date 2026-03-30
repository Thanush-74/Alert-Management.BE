



// const bcrypt = require("bcrypt");
// const pool = require("../config/db");
// const jwt = require("jsonwebtoken");
// /* ============================
//    CREATE BRANCH
// ============================ */
// const createBranch = async (req, res) => {
//   try {
//     const {
//       branch_name,
//       address,
//       city,
//       contact_number,
//       branch_incharge,
//       username,
//       password
//     } = req.body;

//     if (!username?.trim() || !password?.trim()) {
//       return res.status(400).json({
//         message: "Username and password are required"
//       });
//     }

//     const existingUser = await pool.query(
//       "SELECT id FROM branches WHERE LOWER(username) = LOWER($1)",
//       [username.trim()]
//     );

//     if (existingUser.rows.length > 0) {
//       return res.status(409).json({
//         message: "Username already exists"
//       });
//     }

//     const hashedPassword = await bcrypt.hash(password.trim(), 10);

//     await pool.query(
//       `INSERT INTO branches 
//       (branch_name, address, city, contact_number, branch_incharge, username, password) 
//       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
//       [
//         branch_name,
//         address,
//         city,
//         contact_number,
//         branch_incharge,
//         username.trim(),
//         hashedPassword
//       ]
//     );

//     res.status(201).json({
//       message: "Branch created successfully"
//     });

//   } catch (err) {
//     console.error("Create Branch Error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// /* ============================
//    CREATE ADMIN
// ============================ */
// const createAdmin = async (req, res) => {
//   try {
//     const { username, password } = req.body;

//     if (!username?.trim() || !password?.trim()) {
//       return res.status(400).json({
//         message: "Username and password are required"
//       });
//     }

//     const existingAdmin = await pool.query(
//       "SELECT id FROM admin WHERE LOWER(username)=LOWER($1)",
//       [username.trim()]
//     );

//     if (existingAdmin.rows.length > 0) {
//       return res.status(409).json({
//         message: "Admin already exists"
//       });
//     }

//     const hashedPassword = await bcrypt.hash(password.trim(), 10);

//     await pool.query(
//       "INSERT INTO admin (username, password) VALUES ($1,$2)",
//       [username.trim(), hashedPassword]
//     );

//     res.status(201).json({
//       message: "Admin created successfully"
//     });

//   } catch (err) {
//     console.error("Create Admin Error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };


// // ============================================
// // ✅ UNIFIED LOGIN (ADMIN + BRANCH USER)
// // ============================================
// const loginUser = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // 1️⃣ Validate input
//     if (!email?.trim() || !password?.trim()) {
//       return res.status(400).json({
//         message: "Email and password are required",
//       });
//     }

//     // 2️⃣ Find user
//     const result = await pool.query(
//       `SELECT id, name, email, password, role, is_active
//        FROM users
//        WHERE LOWER(email) = LOWER($1)`,
//       [email.trim()]
//     );

//     if (result.rows.length === 0) {
//       return res.status(401).json({
//         message: "Invalid credentials",
//       });
//     }

//     const user = result.rows[0];

//     // 3️⃣ Check active
//     if (!user.is_active) {
//       return res.status(403).json({
//         message: "User account is inactive",
//       });
//     }

//     // 4️⃣ Check password
//     const isMatch = await bcrypt.compare(password.trim(), user.password);

//     if (!isMatch) {
//       return res.status(401).json({
//         message: "Invalid credentials",
//       });
//     }

//     let branch = null;

//     // 5️⃣ If branch user → fetch branch
//     if (user.role === "branch_user") {
//       const branchResult = await pool.query(
//         `
//         SELECT b.id, b.branch_name, b.city, b.address
//         FROM branches b
//         JOIN branch_user_mapping bum
//           ON b.id = bum.branch_id
//         WHERE bum.user_id = $1
//         AND b.is_active = true
//         `,
//         [user.id]
//       );

//       if (branchResult.rows.length === 0) {
//         return res.status(403).json({
//           message: "No active branch assigned",
//         });
//       }

//       branch = branchResult.rows[0];
//     }

//     // 6️⃣ Remove password before sending response
//     const { password: _, ...safeUser } = user;

//     // 7️⃣ Generate JWT token
//     const token = jwt.sign(
//       {
//         id: user.id,
//         role: user.role,
//         email: user.email,
//       },
//       process.env.JWT_SECRET,
//       {
//         expiresIn: process.env.JWT_EXPIRE,
//       }
//     );

//     // 8️⃣ Send response
//     res.status(200).json({
//       message: "Login successful",
//       token,
//       user: safeUser,
//       branch,
//     });

//   } catch (err) {
//     console.error("Login error:", err);
//     res.status(500).json({
//       message: "Login failed",
//     });
//   }
// };



// const sendOtp = async (req, res) => {
//   const { phone } = req.body;

//   if (!phone) {
//     return res.status(400).json({ message: "Phone is required" });
//   }

//   if (!/^\d{10}$/.test(phone)) {
//     return res.status(400).json({ message: "Invalid phone number" });
//   }

//   const otp = Math.floor(100000 + Math.random() * 900000);

//   try {
//     // Delete old OTP
//     await pool.query(`DELETE FROM otp_codes WHERE phone=$1`, [phone]);

//     // Insert new OTP (PLAIN)
//     await pool.query(
//       `INSERT INTO otp_codes (phone, otp, expires_at)
//        VALUES ($1, $2, NOW() + INTERVAL '5 minutes')`,
//       [phone, otp]
//     );

//     console.log("OTP:", otp); // 👈 see in terminal

//     res.status(200).json({
//       message: "OTP sent successfully"
//     });

//   } catch (err) {
//     console.error("Send OTP Error:", err);
//     res.status(500).json({ message: "Error sending OTP" });
//   }
// };

// const verifyOtp = async (req, res) => {
//   const { phone, otp } = req.body;

//   if (!phone || !otp) {
//     return res.status(400).json({ message: "Phone and OTP required" });
//   }

//   try {
//     const result = await pool.query(
//       `SELECT * FROM otp_codes
//        WHERE phone=$1 AND otp=$2 AND expires_at > NOW()
//        ORDER BY id DESC LIMIT 1`,
//       [phone, Number(otp)]
//     );

//     if (result.rows.length === 0) {
//       return res.status(400).json({ message: "Invalid or expired OTP" });
//     }

//     // Delete OTP after success
//     await pool.query(`DELETE FROM otp_codes WHERE phone=$1`, [phone]);

//     // Check customer
//     const customer = await pool.query(
//       "SELECT * FROM customers WHERE phone=$1",
//       [phone]
//     );

//     const token = jwt.sign(
//       { phone, role: "customer" },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     res.json({
//       message: "Login success",
//       token,
//       isNewUser: customer.rows.length === 0,
//       customer: customer.rows[0] || null
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Error verifying OTP" });
//   }
// };

// module.exports = {
//   createBranch,
//   // branchLogin,
//   createAdmin,
//   // adminLogin,
//   loginUser,
//   sendOtp,
//   verifyOtp
// };




const bcrypt = require("bcrypt");
const pool = require("../config/db");
const jwt = require("jsonwebtoken");

/* ============================
   CREATE BRANCH
============================ */
const createBranch = async (req, res) => {
  try {
    const {
      branch_name,
      address,
      city,
      contact_number,
      branch_incharge,
      username,
      password
    } = req.body;

    if (!username?.trim() || !password?.trim()) {
      return res.status(400).json({
        message: "Username and password are required"
      });
    }

    const existingUser = await pool.query(
      "SELECT id FROM branches WHERE LOWER(username) = LOWER($1)",
      [username.trim()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: "Username already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    await pool.query(
      `INSERT INTO branches 
      (branch_name, address, city, contact_number, branch_incharge, username, password) 
      VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        branch_name,
        address,
        city,
        contact_number,
        branch_incharge,
        username.trim(),
        hashedPassword
      ]
    );

    res.status(201).json({
      message: "Branch created successfully"
    });

  } catch (err) {
    console.error("Create Branch Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================
   CREATE ADMIN
============================ */
const createAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username?.trim() || !password?.trim()) {
      return res.status(400).json({
        message: "Username and password are required"
      });
    }

    const existingAdmin = await pool.query(
      "SELECT id FROM admin WHERE LOWER(username)=LOWER($1)",
      [username.trim()]
    );

    if (existingAdmin.rows.length > 0) {
      return res.status(409).json({
        message: "Admin already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    await pool.query(
      "INSERT INTO admin (username, password) VALUES ($1,$2)",
      [username.trim(), hashedPassword]
    );

    res.status(201).json({
      message: "Admin created successfully"
    });

  } catch (err) {
    console.error("Create Admin Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================
   UNIFIED LOGIN (ADMIN + BRANCH)
============================ */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Validate input
    if (!email?.trim() || !password?.trim()) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // 2️⃣ Find user
    const result = await pool.query(
      `SELECT id, name, email, password, role, is_active
       FROM users
       WHERE LOWER(email) = LOWER($1)`,
      [email.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const user = result.rows[0];

    // 3️⃣ Check active
    if (!user.is_active) {
      return res.status(403).json({
        message: "User account is inactive",
      });
    }

    // 4️⃣ Check password
    const isMatch = await bcrypt.compare(password.trim(), user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    let branch = null;

    // 5️⃣ If branch user → fetch branch
    if (user.role === "branch_user") {
      const branchResult = await pool.query(
        `SELECT b.id, b.branch_name, b.city, b.address
         FROM branches b
         JOIN branch_user_mapping bum ON b.id = bum.branch_id
         WHERE bum.user_id = $1
           AND b.is_active = true`,
        [user.id]
      );

      if (branchResult.rows.length === 0) {
        return res.status(403).json({
          message: "No active branch assigned",
        });
      }

      branch = branchResult.rows[0];
    }

    // 6️⃣ Remove password before sending response
    const { password: _, ...safeUser } = user;

    // 7️⃣ Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRE || "7d",
      }
    );

    // 8️⃣ Send response
    res.status(200).json({
      message: "Login successful",
      token,
      user: safeUser,
      branch,
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      message: "Login failed",
    });
  }
};

/* ============================
   SEND OTP (CUSTOMER)
============================ */
const sendOtp = async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ message: "Phone is required" });
  }

  if (!/^\d{10}$/.test(phone)) {
    return res.status(400).json({ message: "Invalid phone number. Must be 10 digits." });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000);

  try {
    // Delete old OTP for this phone
    await pool.query(`DELETE FROM otp_codes WHERE phone = $1`, [phone]);

    // Insert new OTP
    await pool.query(
      `INSERT INTO otp_codes (phone, otp, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '5 minutes')`,
      [phone, otp]
    );

    console.log(`📱 OTP for ${phone}: ${otp}`); // 👈 For development

    // TODO: In production, send SMS via Twilio/SNS/etc
    // await sendSMS(phone, `Your OTP is: ${otp}`);

    res.status(200).json({
      message: "OTP sent successfully"
    });

  } catch (err) {
    console.error("Send OTP Error:", err);
    res.status(500).json({ message: "Error sending OTP" });
  }
};

/* ============================
   VERIFY OTP (CUSTOMER)
============================ */
const verifyOtp = async (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({ message: "Phone and OTP are required" });
  }

  try {
    // Check if OTP is valid and not expired
    const result = await pool.query(
      `SELECT * FROM otp_codes
       WHERE phone = $1 
         AND otp = $2 
         AND expires_at > NOW()
       ORDER BY id DESC 
       LIMIT 1`,
      [phone, Number(otp)]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ 
        message: "Invalid or expired OTP" 
      });
    }

    // Delete OTP after successful verification
    await pool.query(`DELETE FROM otp_codes WHERE phone = $1`, [phone]);

    // Check if customer exists
    const customerResult = await pool.query(
      "SELECT * FROM customers WHERE phone = $1",
      [phone]
    );

    const customer = customerResult.rows[0] || null;
    const isNewUser = !customer;

    // Generate JWT token
    const token = jwt.sign(
      { phone, role: "customer" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "OTP verified successfully",
      token,
      isNewUser,
      customer
    });

  } catch (err) {
    console.error("Verify OTP Error:", err);
    res.status(500).json({ message: "Error verifying OTP" });
  }
};

module.exports = {
  createBranch,
  createAdmin,
  loginUser,
  sendOtp,
  verifyOtp
};