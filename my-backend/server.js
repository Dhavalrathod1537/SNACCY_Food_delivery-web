require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Razorpay = require("razorpay");

const app = express();

app.use(cors());
app.use(express.json());

console.log("🚀 SERVER STARTING...");

const SECRET = process.env.JWT_SECRET || "SNACCY_SECRET_KEY";

/* ================= DATABASE ================= */

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "food_delivery",
  port: 3307
});

db.getConnection((err) => {
  if (err) {
    console.log("❌ DB Connection Failed", err);
  } else {
    console.log("✅ DB Connected Successfully");
  }
});

/* ================= EMAIL SETUP ================= */

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "drathod1537@gmail.com",
    pass: "iusg enqg dxdj btbr"
  }
});

/* ================= RAZORPAY ================= */

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "YOUR_KEY_ID",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "YOUR_KEY_SECRET"
});

/* ================= JWT VERIFY ================= */

function verifyToken(req, res, next) {
  const token = req.headers["authorization"];

  if (!token) {
    return res.json({ success: false, message: "Token missing" });
  }

  jwt.verify(token, SECRET, (err, decoded) => {
    if (err) {
      return res.json({ success: false, message: "Invalid token" });
    }

    req.user = decoded;
    next();
  });
}

/* ================= SEND SIGNUP OTP ================= */

app.post("/send-signup-otp", (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.json({ success: false, message: "All fields required" });
  }

  db.query("SELECT * FROM users WHERE email=?", [email], (err, result) => {
    if (err) {
      console.log(err);
      return res.json({ success: false });
    }

    if (result.length > 0) {
      return res.json({ success: false, message: "Email already exists" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPassword = bcrypt.hashSync(password, 10);

    db.query("DELETE FROM signup_otps WHERE email=?", [email]);

    db.query(
      "INSERT INTO signup_otps (name,email,password,otp,expires_at) VALUES (?,?,?,?,?)",
      [name, email, hashedPassword, otp, new Date(Date.now() + 5 * 60000)],
      (err) => {
        if (err) {
          console.log(err);
          return res.json({ success: false });
        }

        transporter.sendMail(
          {
            from: "SNACCY <drathod1537@gmail.com>",
            to: email,
            subject: "SNACCY Signup OTP",
            text: `Your SNACCY OTP is ${otp}. It is valid for 5 minutes.`
          },
          (err) => {
            if (err) {
              console.log("EMAIL ERROR:", err);
              return res.json({ success: false, message: "OTP email not sent" });
            }

            res.json({ success: true, message: "OTP sent to email" });
          }
        );
      }
    );
  });
});

/* ================= VERIFY OTP + CREATE USER ================= */

app.post("/verify-signup-otp", (req, res) => {
  const { email, otp } = req.body;

  db.query(
    "SELECT * FROM signup_otps WHERE email=? AND otp=? AND expires_at > NOW()",
    [email, otp],
    (err, result) => {
      if (err) {
        console.log(err);
        return res.json({ success: false });
      }

      if (result.length === 0) {
        return res.json({ success: false, message: "Invalid or expired OTP" });
      }

      const user = result[0];

      db.query(
        "INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)",
        [user.name, user.email, user.password, "user"],
        (err) => {
          if (err) {
            console.log(err);
            return res.json({ success: false });
          }

          db.query("DELETE FROM signup_otps WHERE email=?", [email]);

          res.json({ success: true, message: "Signup successful" });
        }
      );
    }
  );
});

/* ================= LOGIN ================= */

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM users WHERE email=?", [email], (err, result) => {
    if (err) {
      console.log(err);
      return res.json({ success: false });
    }

    if (result.length === 0) {
      return res.json({ success: false, message: "User not found" });
    }

    const user = result[0];

    let passwordMatch = false;

    if (user.password && user.password.startsWith("$2")) {
      passwordMatch = bcrypt.compareSync(password, user.password);
    } else {
      passwordMatch = password === user.password;

      if (passwordMatch) {
        const newHash = bcrypt.hashSync(password, 10);
        db.query("UPDATE users SET password=? WHERE id=?", [newHash, user.id]);
        user.password = newHash;
      }
    }

    if (!passwordMatch) {
      return res.json({ success: false, message: "Wrong password" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role || "user" },
      SECRET,
      { expiresIn: "7d" }
    );

    delete user.password;

    res.json({
      success: true,
      token,
      user
    });
  });
});

/* ================= UPDATE PROFILE ================= */

app.put("/update-profile/:id", verifyToken, (req, res) => {
  const { name, email, phone, dob, gender, anniversary } = req.body;

  db.query(
    `UPDATE users
     SET name=?, email=?, phone=?, dob=?, gender=?, anniversary=?
     WHERE id=?`,
    [
      name || null,
      email || null,
      phone || null,
      dob || null,
      gender || null,
      anniversary || null,
      req.params.id
    ],
    (err) => {
      if (err) {
        console.log("❌ PROFILE UPDATE ERROR:", err);
        return res.json({ success: false });
      }

      res.json({ success: true });
    }
  );
});

/* ================= CREATE RAZORPAY PAYMENT ================= */

app.post("/create-payment", verifyToken, async (req, res) => {
  try {
    const { amount } = req.body;

    const order = await razorpay.orders.create({
      amount: Math.round(Number(amount) * 100),
      currency: "INR",
      receipt: "SNACCY_" + Date.now()
    });

    res.json({ success: true, order });
  } catch (err) {
    console.log("❌ PAYMENT ERROR:", err);
    res.json({ success: false, message: "Payment create failed" });
  }
});

/* ================= PLACE ORDER ================= */

function placeOrder(req, res) {
  const {
    user_id,
    items,
    total_price,
    name,
    phone,
    email,
    address,
    area,
    pincode,
    city,
    state
  } = req.body;

  if (!items || !total_price) {
    return res.json({ success: false, message: "Missing order data" });
  }

  db.query(
    `INSERT INTO orders
    (user_id, items, total_price, name, phone, email, address, area, pincode, city, state, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user_id || null,
      JSON.stringify(items),
      total_price,
      name || null,
      phone || null,
      email || null,
      address || null,
      area || null,
      pincode || null,
      city || null,
      state || null,
      "Placed"
    ],
    (err) => {
      if (err) {
        console.log("❌ ORDER SAVE ERROR:", err);
        return res.json({ success: false, message: "Order not saved" });
      }

      res.json({ success: true, message: "✅ Order Saved Successfully" });
    }
  );
}

app.post("/order", verifyToken, placeOrder);
app.post("/place-order", verifyToken, placeOrder);

/* ================= ORDER HISTORY ================= */

app.get("/orders/:user_id", verifyToken, (req, res) => {
  db.query(
    "SELECT * FROM orders WHERE user_id=? ORDER BY id DESC",
    [req.params.user_id],
    (err, result) => {
      if (err) {
        console.log("❌ ORDER HISTORY ERROR:", err);
        return res.json([]);
      }

      res.json(result);
    }
  );
});

/* ================= NOTIFICATIONS ================= */

app.get("/notifications/:user_id", verifyToken, (req, res) => {
  db.query(
    "SELECT id, status, total_price, created_at FROM orders WHERE user_id=? ORDER BY id DESC LIMIT 5",
    [req.params.user_id],
    (err, result) => {
      if (err) {
        console.log(err);
        return res.json([]);
      }

      res.json(result);
    }
  );
});

/* ================= ADMIN GET ALL ORDERS ================= */

app.get("/admin/orders", verifyToken, (req, res) => {
  if (req.user.role !== "admin") {
    return res.json({ success: false, message: "Admin only" });
  }

  db.query("SELECT * FROM orders ORDER BY id DESC", (err, result) => {
    if (err) {
      console.log(err);
      return res.json([]);
    }

    res.json(result);
  });
});

/* ================= ADMIN UPDATE ORDER STATUS ================= */

app.put("/admin/order/:id", verifyToken, (req, res) => {
  if (req.user.role !== "admin") {
    return res.json({ success: false, message: "Admin only" });
  }

  const { status } = req.body;

  db.query(
    "UPDATE orders SET status=? WHERE id=?",
    [status, req.params.id],
    (err) => {
      if (err) {
        console.log(err);
        return res.json({ success: false });
      }

      res.json({ success: true });
    }
  );
});

/* ================= SERVER START ================= */

app.listen(3000, () => {
  console.log("🔥 Server running on http://localhost:3000");
});
/* ================= SUPPORT TICKET CREATE ================= */

app.post("/support-ticket", (req, res) => {
  const { user_id, name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.json({
      success: false,
      message: "All fields required"
    });
  }

  const ticket_id = "SNACCY-" + Date.now();

  db.query(
    `INSERT INTO support_tickets
    (ticket_id, user_id, name, email, message, status)
    VALUES (?, ?, ?, ?, ?, ?)`,
    [
      ticket_id,
      user_id || null,
      name,
      email,
      message,
      "Open"
    ],
    (err) => {
      if (err) {
        console.log("❌ SUPPORT TICKET ERROR:", err);
        return res.json({
          success: false,
          message: "Ticket not saved"
        });
      }

      res.json({
        success: true,
        ticket_id,
        message: "Support ticket created"
      });
    }
  );
});

/* ================= USER SUPPORT HISTORY ================= */

app.get("/support-tickets/:user_id", (req, res) => {
  db.query(
    "SELECT * FROM support_tickets WHERE user_id=? ORDER BY id DESC",
    [req.params.user_id],
    (err, result) => {
      if (err) {
        console.log(err);
        return res.json([]);
      }

      res.json(result);
    }
  );
});

/* ================= ADMIN ALL SUPPORT TICKETS ================= */

app.get("/admin/support-tickets", verifyToken, (req, res) => {
  if (req.user.role !== "admin") {
    return res.json({ success: false, message: "Admin only" });
  }

  db.query(
    "SELECT * FROM support_tickets ORDER BY id DESC",
    (err, result) => {
      if (err) {
        console.log(err);
        return res.json([]);
      }

      res.json(result);
    }
  );
});

/* ================= ADMIN UPDATE SUPPORT STATUS ================= */

app.put("/admin/support-ticket/:id", verifyToken, (req, res) => {
  if (req.user.role !== "admin") {
    return res.json({ success: false, message: "Admin only" });
  }

  const { status } = req.body;

  db.query(
    "UPDATE support_tickets SET status=? WHERE id=?",
    [status, req.params.id],
    (err) => {
      if (err) {
        console.log(err);
        return res.json({ success: false });
      }

      res.json({ success: true });
    }
  );
});