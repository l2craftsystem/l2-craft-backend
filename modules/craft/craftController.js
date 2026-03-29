const db = require("../../core/db");

async function getUserInventory() {

  const result = await db.query(`
    SELECT i.name, ui.quantity
    FROM user_inventory ui
    JOIN items i ON i.id = ui.item_id
  `);

  const inventory = {};

  result.rows.forEach(row => {
    inventory[row.name] = row.quantity;
  });

  return inventory;
}

// 🔹 TOTAL RECURSIVO
async function aggregateMaterials(itemId, amount, totals = {}) {

  const recipeResult = await db.query(`
    SELECT id, result_count
    FROM recipes
    WHERE result_item_id = $1
  `, [itemId]);

  if (recipeResult.rows.length === 0) {

    const itemResult = await db.query(`
      SELECT name FROM items WHERE id = $1
    `, [itemId]);

    const name = itemResult.rows[0].name;

    if (!totals[name]) totals[name] = 0;
    totals[name] += amount;

    return totals;
  }

  const recipe = recipeResult.rows[0];

  const crafts = Math.ceil(amount / recipe.result_count);

  const materialsResult = await db.query(`
    SELECT m.id, m.name, rm.count
    FROM recipe_materials rm
    JOIN items m ON m.id = rm.item_id
    WHERE rm.recipe_id = $1
  `, [recipe.id]);

  for (const mat of materialsResult.rows) {
    const total = mat.count * crafts;
    await aggregateMaterials(mat.id, total, totals);
  }

  return totals;
}

// 🔹 TREE
async function buildNode(id, quantity) {

  const itemResult = await db.query(`
    SELECT id, name FROM items WHERE id = $1
  `, [id]);

  const item = itemResult.rows[0];

  const recipeResult = await db.query(`
    SELECT id, result_count
    FROM recipes
    WHERE result_item_id = $1
  `, [id]);

  const node = {
    id: item.id,
    name: item.name,
    quantity,
    materials: []
  };

  if (recipeResult.rows.length === 0) return node;

  const recipe = recipeResult.rows[0];

  const crafts = Math.ceil(quantity / recipe.result_count);

  const matsResult = await db.query(`
    SELECT item_id, count
    FROM recipe_materials
    WHERE recipe_id = $1
  `, [recipe.id]);

  for (const m of matsResult.rows) {
    node.materials.push(
      await buildNode(m.item_id, m.count * crafts)
    );
  }

  return node;
}

// 🔹 TREE API
async function craftTree(req, res) {

  const itemId = parseInt(req.params.itemId);
  const amount = parseInt(req.params.amount);

  const tree = await buildNode(itemId, amount);

  res.json(tree);
}

// 🔹 TOTAL
async function craftTotal(req, res) {

  const itemId = parseInt(req.params.itemId);
  const amount = parseInt(req.params.amount);

  const totals = await aggregateMaterials(itemId, amount);
  const inventory = await getUserInventory();

  const materials = Object.entries(totals).map(([name, required]) => {

    const owned = inventory[name] || 0;
    const missing = Math.max(0, required - owned);

    return {
      name,
      required,
      owned,
      missing
    };

  });

  res.json({ materials });
}

// 🔥 CONSUMO REAL
async function executeCraft(req, res) {

  const itemId = parseInt(req.params.itemId);
  const amount = parseInt(req.params.amount);

  const invResult = await db.query(`
    SELECT ui.item_id, i.name, ui.quantity
    FROM user_inventory ui
    JOIN items i ON i.id = ui.item_id
  `);

  const inventory = {};

  invResult.rows.forEach(i => {
    inventory[i.name] = {
      id: i.item_id,
      quantity: i.quantity
    };
  });

  const tree = await buildNode(itemId, amount);

  async function process(node, needed) {

    const inv = inventory[node.name];
    let available = inv ? inv.quantity : 0;

    const used = Math.min(available, needed);

    if (inv) inv.quantity -= used;

    const remaining = needed - used;

    if (remaining === 0) return;

    const recipeResult = await db.query(`
      SELECT id FROM recipes WHERE result_item_id = $1
    `, [node.id]);

    if (remaining > 0 && recipeResult.rows.length === 0) {
      throw new Error(`Faltan materiales base: ${node.name}`);
    }

    for (const child of node.materials) {
      const ratio = child.quantity / node.quantity;
      const childNeeded = remaining * ratio;
      await process(child, childNeeded);
    }
  }

  try {
    for (const child of tree.materials) {
      await process(child, child.quantity);
    }
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }

  for (const item of Object.values(inventory)) {
    await db.query(`
      UPDATE user_inventory
      SET quantity = $1
      WHERE item_id = $2
    `, [item.quantity, item.id]);
  }

  res.json({ success: true });
}

module.exports = {
  craftTree,
  craftTotal,
  executeCraft
};