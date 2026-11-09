const express = require("express");
const Razorpay = require("razorpay");

const router = express.Router();

// Razorpay instance
const razorpay = new Razorpay({
  key_id: "rzp_test_SkwZnt3oxvD8TZ",
  key_secret: "908AJack1pbwwCLxOWioksBC"
});

/* ================= CREATE PAYMENT ================= */

router.post("/create-payment", async (req, res) => {
  try {
    const { amount } = req.body;

    const options = {
      amount: amount * 100, // convert to paisa
      currency: "INR",
      receipt: "order_" + Date.now()
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      order
    });

  } catch (err) {
    console.log("❌ Payment Error:", err);
    res.json({ success: false });
  }
});

module.exports = router;