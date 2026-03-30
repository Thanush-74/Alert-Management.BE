const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();///
const pool = require("./config/db"); // database connection
const bcrypt = require("bcrypt");
const branchRoutes = require("./routes/branchRoutes");
const customerRoutes = require("./routes/customerRoutes");
const authRoutes = require("./routes/authRoutes");
const alertRoutes = require("./routes/alertRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const productsRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/ordersRoutes");

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
      methods: ["GET", "POST"],
    credentials: true
  },
});

// Middlewares
app.use(cors());
app.use(express.json());

// Make io available in controllers
app.set("io", io);

// Routes
app.use("/api/customer", customerRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products",productsRoutes)
app.use("/api/orders", orderRoutes);

// app.use("/api/products", require("./routes/productRoutes"));

// Socket connection
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinBranch", (branchId) => {
    socket.join(`branch_${branchId}`);
    console.log(`Branch ${branchId} joined room`);
  });

  socket.on("joinAdmin", () => {
    socket.join("admin");
    console.log("Admin joined room");
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });

  socket.on("joinCustomer", (phone) => {
  socket.join(`customer_${phone}`);
  console.log(`Customer ${phone} joined room`);
});
});



/* -------------------------------------------------
   Create default admin if it does not exist
--------------------------------------------------- */
async function createDefaultAdmin() {
  try {

    const result = await pool.query(
      "SELECT * FROM users WHERE role='admin'"
    );

    if (result.rows.length === 0) {

      const hashedPassword = await bcrypt.hash("admin123", 10);

      await pool.query(
        `INSERT INTO users (name, email, password, role, is_active)
         VALUES ($1,$2,$3,$4,$5)`,
        ["Admin", "admin@gmail.com", hashedPassword, "admin", true]
      );

      console.log("Default Admin Created");
    }

  } catch (err) {
    console.error("Error creating admin:", err);
  }
}


// Start server
const PORT = 5000;

server.listen(PORT, async () => {

  console.log(`Server running on port ${PORT}`);

  // check admin when server starts
  await createDefaultAdmin();

});
























// const express = require("express");
// const cors = require("cors");
// const http = require("http");
// const { Server } = require("socket.io");

// const branchRoutes = require("./routes/branchRoutes");
// const customerRoutes = require("./routes/customerRoutes");
// const authRoutes = require("./routes/authRoutes");
// const alertRoutes = require("./routes/alertRoutes");
// const userRoutes = require("./routes/userRoutes");
// const adminRoutes = require("./routes/adminRoutes");


// const app = express();
// const server = http.createServer(app);

// // Socket.IO setup
// const io = new Server(server, {
//   cors: {
//     origin: "*",
//   },
// });

// // Middlewares
// app.use(cors());
// app.use(express.json());

// // Make io available in controllers
// app.set("io", io);

// // Routes (temporarily disabled)
// app.use("/api/customer", customerRoutes);
// app.use("/api/auth", authRoutes);
// app.use("/api/alerts", alertRoutes);
// app.use("/api/branches", branchRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/admin", adminRoutes);

// // Socket connection
// io.on("connection", (socket) => {
//   console.log("User connected:", socket.id);

//   socket.on("joinBranch", (branchId) => {
//     socket.join(`branch_${branchId}`);
//     console.log(`Branch ${branchId} joined room`);
//   });

//   socket.on("joinAdmin", () => {
//     socket.join("admin");
//     console.log("Admin joined room");
//   });

//   socket.on("disconnect", () => {
//     console.log("User disconnected:", socket.id);
//   });
// });

// // Start server
// const PORT = 5000;
// server.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });