// const pool = require("../config/db");

// const createOrder = async (req, res) => {
//   let client;

//   try {
//     client = await pool.connect();

//     const {
//       customerId,
//       items,
//       total,
//       address,
//       deliveryType,
//       branchId,
//     } = req.body;

//     await client.query("BEGIN");

//     // 🔥 GET CUSTOMER ID FROM PHONE
// const customerResult = await client.query(
//   "SELECT id FROM customers WHERE phone = $1",
//   [customerId] // here customerId = phone
// );

// if (customerResult.rows.length === 0) {
//   throw new Error("Customer not found");
// }

// const finalCustomerId = customerResult.rows[0].id;

//   const orderResult = await client.query(
//   `INSERT INTO orders
//   (customer_id, total, address, delivery_type, branch_id)
//   VALUES ($1,$2,$3,$4,$5)
//   RETURNING id`,
//   [
//     finalCustomerId, // ✅ FIXED
//     total,
//     deliveryType === "pickup" ? null : address,
//     deliveryType,
//     branchId || null,
//   ]
// );

//     const orderId = orderResult.rows[0].id;

//     for (const item of items) {
//       await client.query(
//         `INSERT INTO order_items
//         (order_id, product_id, quantity, price)
//         VALUES ($1,$2,$3,$4)`,
//         [orderId, item.id, item.qty, item.price]
//       );
//     }

//     await client.query("COMMIT");

//     res.status(201).json({ message: "Order created", orderId });

//   } catch (err) {
//     console.error("ORDER ERROR:", err); // 🔥 DEBUG

//     if (client) await client.query("ROLLBACK");
//     res.status(500).json({ error: err.message });
//   } finally {
//     if (client) client.release();
//   }
// };

// module.exports = { createOrder };

const pool = require("../config/db");

const createOrder = async (req, res) => {
  let client;

  try {
    client = await pool.connect();

    const {
      customerId, // phone
      items,
      total,
      address,
      deliveryType,
      branchId,
    } = req.body;

    // ✅ VALIDATIONS
    if (
      !customerId ||
      !items ||
      items.length === 0 ||
      !total ||
      !deliveryType
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // ✅ DELIVERY RULES
    if (deliveryType === "delivery" && !branchId) {
      return res.status(400).json({ error: "Branch required for delivery" });
    }

    if (deliveryType === "pickup" && address) {
      console.warn("Pickup order should not have address");
    }

    await client.query("BEGIN");

    // ✅ GET CUSTOMER
    const customerResult = await client.query(
      "SELECT id FROM customers WHERE phone = $1",
      [customerId],
    );

    if (customerResult.rows.length === 0) {
      throw new Error("Customer not found");
    }

    const finalCustomerId = customerResult.rows[0].id;

    // ✅ INSERT ORDER
    const orderResult = await client.query(
      `INSERT INTO orders 
      (customer_id, total, address, delivery_type, branch_id) 
      VALUES ($1,$2,$3,$4,$5) 
      RETURNING id`,
      [
        finalCustomerId,
        total,
        deliveryType === "pickup" ? null : address,
        deliveryType,
        deliveryType === "delivery" ? branchId : null, // 🔥 FIXED
      ],
    );

    const orderId = orderResult.rows[0].id;

    // ✅ INSERT ITEMS
    for (const item of items) {
      if (!item.id || !item.qty || !item.price) {
        throw new Error("Invalid item data");
      }

      await client.query(
        `INSERT INTO order_items 
        (order_id, product_id, quantity, price) 
        VALUES ($1,$2,$3,$4)`,
        [orderId, item.id, item.qty, item.price],
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Order created successfully",
      orderId,
    });
  } catch (err) {
    console.error("ORDER ERROR:", err);

    if (client) await client.query("ROLLBACK");

    res.status(500).json({ error: err.message });
  } finally {
    if (client) client.release();
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const { customer, status, fromDate, toDate } = req.query;

    let query = `
      SELECT 
        o.id AS order_id,
        o.created_at,
        o.status,
        c.name AS customer_name,
        p.name AS product_name,
        oi.quantity,
        oi.price
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE 1=1
    `;

    let values = [];
    let index = 1;

    if (customer) {
      query += ` AND c.name ILIKE $${index++}`;
      values.push(`%${customer}%`);
    }

    if (status) {
      query += ` AND o.status = $${index++}`;
      values.push(status);
    }

    if (fromDate && toDate) {
      query += ` AND o.created_at BETWEEN $${index++} AND $${index++}`;
      values.push(fromDate, toDate);
    }

    query += ` ORDER BY o.id DESC`;

    const result = await pool.query(query, values);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { createOrder, getOrderDetails };
