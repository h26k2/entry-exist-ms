const db = require("../config/db");

// Get all user categories
exports.getAllCategories = async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM user_categories ORDER BY name"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user categories" });
  }
};

// Add a new user category
exports.addCategory = async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });
  try {
    await db.execute(
      "INSERT INTO user_categories (name, description) VALUES (?, ?)",
      [name, description]
    );
    res.status(201).json({ message: "Category added" });
  } catch (err) {
    res.status(500).json({ error: "Failed to add category" });
  }
};

// Update a user category
exports.updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  try {
    await db.execute(
      "UPDATE user_categories SET name = ?, description = ? WHERE id = ?",
      [name, description, id]
    );
    res.json({ message: "Category updated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update category" });
  }
};

// Delete a user category
exports.deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute("DELETE FROM user_categories WHERE id = ?", [id]);
    res.json({ message: "Category deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete category" });
  }
};
