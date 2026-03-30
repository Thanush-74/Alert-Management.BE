const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {

  const authHeader = req.headers.authorization;

  // 1️⃣ Check if header exists
  if (!authHeader) {
    return res.status(401).json({
      message: "No token provided"
    });
  }

  // 2️⃣ Check if format is "Bearer TOKEN"
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Invalid token format"
    });
  }

  // 3️⃣ Extract token
  const token = authHeader.split(" ")[1];

  try {

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = decoded;

    next();

  } catch (err) {

    return res.status(401).json({
      message: "Invalid token"
    });

  }

};

module.exports = verifyToken;