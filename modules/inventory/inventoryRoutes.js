const express = require("express");
const db = require("../../core/db");

const router = express.Router();

/*
================================
POST /inventory
================================
*/
router.post("/", async (req, res) => {

  const { name, quantity } = req.body;

  const itemResult = await db.query(`
    SELECT id FROM items WHERE name = $1
  `, [name]);

  if (itemResult.rows.length === 0) {
    return res.status(404).json({ error: "Item no encontrado" });
  }

  const itemId = itemResult.rows[0].id;

  const existing = await db.query(`
    SELECT id FROM user_inventory WHERE item_id = $1
  `, [itemId]);

  if (existing.rows.length > 0) {

    await db.query(`
      UPDATE user_inventory
      SET quantity = $1
      WHERE item_id = $2
    `, [quantity, itemId]);

  } else {

    await db.query(`
      INSERT INTO user_inventory (item_id, quantity)
      VALUES ($1, $2)
    `, [itemId, quantity]);

  }

  res.json({ success: true });

});

/*
================================
GET /inventory
================================
*/
router.get("/", async (req, res) => {

  const result = await db.query(`
    SELECT items.name, user_inventory.quantity
    FROM user_inventory
    JOIN items ON items.id = user_inventory.item_id
  `);

  res.json(result.rows);

});

module.exports = router;