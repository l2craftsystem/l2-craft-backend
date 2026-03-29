const db = require("../../core/db");

async function getInventory(req, res) {

  const result = await db.query(`
    SELECT i.name as item_name, ui.quantity
    FROM user_inventory ui
    JOIN items i ON i.id = ui.item_id
  `);

  const rows = result.rows;

  const inventory = {};

  rows.forEach(r => {
    inventory[r.item_name] = r.quantity;
  });

  res.json(inventory);
}

async function updateInventory(req, res) {

  const { name, quantity } = req.body;

  const itemResult = await db.query(`
    SELECT id FROM items WHERE name = $1
  `, [name]);

  if (itemResult.rows.length === 0) {
    return res.status(404).json({ error: "Item no encontrado" });
  }

  const itemId = itemResult.rows[0].id;

  await db.query(`
    INSERT INTO user_inventory (item_id, quantity)
    VALUES ($1, $2)
    ON CONFLICT (item_id)
    DO UPDATE SET quantity = EXCLUDED.quantity
  `, [itemId, quantity]);

  res.json({ success: true });
}

module.exports = {
  getInventory,
  updateInventory
};