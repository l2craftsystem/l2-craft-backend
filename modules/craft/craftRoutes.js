const express = require("express");
const { getDatabase } = require("../../core/database");
const { executeCraft } = require("./craftController");

const router = express.Router();
router.post("/:itemId/craft/:amount", executeCraft);


/*
================================
GET /craft/:itemId/tree
Craft tree limpio (sin duplicados)
================================
*/

router.get("/:itemId/tree", (req, res) => {

  const db = getDatabase();
  const itemId = Number(req.params.itemId);

  function buildNode(id, quantity) {

  const item = db.prepare(`
    SELECT id, name
    FROM items
    WHERE id = ?
  `).get(id);

  if (!item) return null;

  const node = {
    id: item.id,
    name: item.name,
    quantity,
    materials: []
  };

  const recipe = db.prepare(`
    SELECT id, result_count
    FROM recipes
    WHERE result_item_id = ?
  `).get(id);

  if (!recipe) {
    return node;
  }

  const crafts = Math.ceil(quantity / recipe.result_count);

  const materials = db.prepare(`
    SELECT item_id, count
    FROM recipe_materials
    WHERE recipe_id = ?
  `).all(recipe.id);

  for (const mat of materials) {

    const child = buildNode(
      mat.item_id,
      mat.count * crafts
    );

    if (child) {
      node.materials.push(child);
    }

  }

  return node;
}

  const inventory = {};

// 🔹 cargar inventory real
const rows = db.prepare(`
  SELECT i.name, ui.quantity
  FROM user_inventory ui
  JOIN items i ON i.id = ui.item_id
`).all();

rows.forEach(row => {
  inventory[row.name] = row.quantity;
});

const tree = buildNode(itemId, 1);

  res.json(tree);

});

module.exports = router;