const pool = require("../config/db");
const bcrypt = require("bcrypt");

// ✅ Get All Users
exports.getUsers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.*, b.branch_name
      FROM users u
      LEFT JOIN branch_user_mapping bum ON u.id = bum.user_id
      LEFT JOIN branches b ON bum.branch_id = b.id
      ORDER BY u.id DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

// ✅ Create User
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, branch_id } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const userResult = await pool.query(
      `INSERT INTO users (name, email, password, role, is_active)
       VALUES ($1,$2,$3,$4,true)
       RETURNING id`,
      [name, email, hashedPassword, role]
    );

    const userId = userResult.rows[0].id;

    if (branch_id) {
      await pool.query(
        `INSERT INTO branch_user_mapping (user_id, branch_id)
         VALUES ($1,$2)`,
        [userId, branch_id]
      );
    }

    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create user" });
  }
};

// ✅ Update User
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, is_active, branch_id } = req.body;

    await pool.query(
      `UPDATE users
       SET name=$1, email=$2, role=$3, is_active=$4
       WHERE id=$5`,
      [name, email, role, is_active, id]
    );

    await pool.query(
      `DELETE FROM branch_user_mapping WHERE user_id=$1`,
      [id]
    );

    if (branch_id) {
      await pool.query(
        `INSERT INTO branch_user_mapping (user_id, branch_id)
         VALUES ($1,$2)`,
        [id, branch_id]
      );
    }

    res.json({ message: "User updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update user" });
  }
};

// ✅ Delete User
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(`DELETE FROM branch_user_mapping WHERE user_id=$1`, [id]);
    await pool.query(`DELETE FROM users WHERE id=$1`, [id]);

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete user" });
  }
};


// ✅ GET SINGLE USER (FOR EDIT PAGE)
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT u.*, b.branch_name, bum.branch_id
       FROM users u
       LEFT JOIN branch_user_mapping bum ON u.id = bum.user_id
       LEFT JOIN branches b ON bum.branch_id = b.id
       WHERE u.id = $1`,
      [id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch user" });
  }
};