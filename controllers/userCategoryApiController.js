const db = require("../config/db");

exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM user_categories ORDER BY id DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, description } = req.body;
    await db.query(
      "INSERT INTO user_categories (name, description) VALUES (?, ?)",
      [name, description]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to create category" });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    await db.query(
      "UPDATE user_categories SET name = ?, description = ? WHERE id = ?",
      [name, description, id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update category" });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM user_categories WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete category" });
  }
};
