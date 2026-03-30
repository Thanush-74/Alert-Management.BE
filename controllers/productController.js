const pool = require("../config/db");

const getProducts = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products ORDER BY id DESC");

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Error fetching products" });
  }
};
const addProduct = async (req, res) => {
  let { name, price, image } = req.body;

  try {
    // ✅ Fix empty image
    if (!image) {
      image = null;
    }

    const result = await pool.query(
      "INSERT INTO products (name, price, image) VALUES ($1, $2, $3) RETURNING *",
      [name, price, image]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("ADD PRODUCT ERROR:", err); // 🔥 VERY IMPORTANT
    res.status(500).json({ message: "Error adding product" });
  }
};

const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, price, image } = req.body;

  try {
    const result = await pool.query(
      "UPDATE products SET name=$1, price=$2, image=$3 WHERE id=$4 RETURNING *",
      [name, price, image, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Error updating product" });
  }
};

const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM products WHERE id=$1", [id]);
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ message: "Error deleting product" });
  }
};

module.exports = {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
};
