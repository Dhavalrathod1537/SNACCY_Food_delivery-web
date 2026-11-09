import javax.swing.*;
import java.awt.*;

public class FoodSlider extends JFrame {

    String[] items = {
        "What's on your mind?",
        "Homely",
        "Cake",
        "Biryani",
        "Samosa",
        "Pizza",
        "Burger",
        "Tea",
        "Idly",
        "Roll",
        "Momos",
        "Dosa",
        "Parotta",
        "Vada",
        "Shawarma",
        "Waffle",
        "Juice",
        "Noodles",
        "Poori",
        "Pasta",
        "Salad"
    };

    JLabel label;
    int index = 0;

    public FoodSlider() {

        setTitle("Food Slider");
        setSize(700, 200);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLocationRelativeTo(null);

        // Label
        label = new JLabel(items[index], SwingConstants.CENTER);
        label.setFont(new Font("Arial", Font.BOLD, 28));
        label.setForeground(Color.WHITE);

        // Panel
        JPanel panel = new JPanel(new BorderLayout());
        panel.setBackground(Color.BLACK);
        panel.add(label, BorderLayout.CENTER);

        add(panel);

        // Timer
        Timer timer = new Timer(2000, e -> {
            index = (index + 1) % items.length;
            label.setText(items[index]);
        });

        timer.start();
    }

    public static void main(String[] args) {

        SwingUtilities.invokeLater(() -> {
            new FoodSlider().setVisible(true);
        });

    }
    // LOGIN API
app.post("/login", (req, res) => {

    const { email, password } = req.body;

    const sql = "SELECT * FROM users WHERE email = ? AND password = ?";

    db.query(sql, [email, password], (err, result) => {

        if (err) {
            return res.json({ success: false });
        }

        if (result.length > 0) {
            res.json({ success: true, user: result[0] });
        } else {
            res.json({ success: false });
        }

    });

app.post("/signup", (req, res) => {

    const { name, email, password } = req.body;

    console.log("DATA RECEIVED:", name, email, password); // DEBUG

    if (!name || !email || !password) {
        return res.json({ success: false });
    }

    const sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";

    db.query(sql, [name, email, password], (err, result) => {

        if (err) {
            console.log("DB ERROR:", err); // VERY IMPORTANT
            return res.json({ success: false });
        }

        res.json({ success: true });
    });

});
});

const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "snaccy"
});

db.connect();

app.post("/signup", (req, res) => {
    const { email, password } = req.body;

    db.query(
        "INSERT INTO users (email, password) VALUES (?, ?)",
        [email, password],
        (err) => {
            if (err) {
                return res.json({ success: false });
            }
            res.json({ success: true });
        }
    );
});

app.post("/login", (req, res) => {
    const { email, password } = req.body;

    db.query(
        "SELECT * FROM users WHERE email=? AND password=?",
        [email, password],
        (err, result) => {
            if (result.length > 0) {
                res.json({ success: true });
            } else {
                res.json({ success: false });
            }
        }
    );
});



}