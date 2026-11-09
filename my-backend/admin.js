const express = require("express");
const router = express.Router();

/* ================= GET ALL ORDERS ================= */

router.get("/admin/orders", (req, res) => {

  const db = req.app.get("db");

  db.query("SELECT * FROM orders ORDER BY id DESC", (err, result) => {
    if (err) {
      console.log(err);
      return res.json([]);
    }

    res.json(result);
  });
});

/* ================= UPDATE ORDER STATUS ================= */

router.put("/admin/order/:id", (req, res) => {

  const db = req.app.get("db");
  const { status } = req.body;

  db.query(
    "UPDATE orders SET status=? WHERE id=?",
    [status, req.params.id],
    (err) => {
      if (err) {
        console.log(err);
        return res.json({ success:false });
      }

      res.json({ success:true });
    }
  );
});

module.exports = router;