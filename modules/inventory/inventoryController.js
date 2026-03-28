const { getDatabase } = require("../../core/database");

function getInventory(req, res) {

  const db = getDatabase();

  const rows = db.prepare(`
    SELECT item_name, quantity
    FROM user_inventory
  `).all();

  const result = {};

  rows.forEach(r => {
    result[r.item_name] = r.quantity;
  });

  res.json(result);
}

function updateInventory(req, res) {

  const db = getDatabase();
  const { name, quantity } = req.body;

  db.prepare(`
    INSERT INTO user_inventory (item_name, quantity)
    VALUES (?, ?)
    ON CONFLICT(item_name)
    DO UPDATE SET quantity = excluded.quantity
  `).run(name, quantity);

  res.json({ success: true });
}

module.exports = {
  getInventory,
  updateInventory
};