const express = require("express");
const { getDatabase } = require("../../core/database");

const router = express.Router();

/*
================================
POST /inventory
Guardar o actualizar cantidad
================================
*/
router.post("/", (req, res) => {

  const db = getDatabase();
  const { name, quantity } = req.body;

  const item = db.prepare(`
    SELECT id FROM items WHERE name = ?
  `).get(name);

  if (!item) {
    return res.status(404).json({ error: "Item no encontrado" });
  }

  const existing = db.prepare(`
    SELECT id FROM user_inventory WHERE item_id = ?
  `).get(item.id);

  if (existing) {
    db.prepare(`
      UPDATE user_inventory
      SET quantity = ?
      WHERE item_id = ?
    `).run(quantity, item.id);
  } else {
    db.prepare(`
      INSERT INTO user_inventory (item_id, quantity)
      VALUES (?, ?)
    `).run(item.id, quantity);
  }

  res.json({ success: true });

});

/*
================================
GET /inventory
Traer inventario completo
================================
*/
router.get("/", (req, res) => {

  const db = getDatabase();

  const rows = db.prepare(`
    SELECT items.name, user_inventory.quantity
    FROM user_inventory
    JOIN items ON items.id = user_inventory.item_id
  `).all();

  res.json(rows);

});

module.exports = router;