const verifyOtp = async (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({ message: "Phone and OTP required" });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM otp_codes
       WHERE phone=$1 AND otp=$2 AND expires_at > NOW()
       ORDER BY id DESC LIMIT 1`,
      [phone, Number(otp)]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // ✅ DELETE OTP
    await pool.query(`DELETE FROM otp_codes WHERE phone=$1`, [phone]);

    let customer = await pool.query(
      "SELECT * FROM customers WHERE phone=$1",
      [phone]
    );

    let isNewUser = customer.rows.length === 0;

    const token = jwt.sign(
      { phone, role: "customer" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login success",
      token,
      isNewUser,
      customer: customer.rows[0] || null
    });

  } catch (err) {
    res.status(500).json({ message: "Error verifying OTP" });
  }
};