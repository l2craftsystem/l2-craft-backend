const { getDatabase } = require("../../core/database");

function getUserInventory(db) {

  const rows = db.prepare(`
    SELECT i.name, ui.quantity
    FROM user_inventory ui
    JOIN items i ON i.id = ui.item_id
  `).all();

  const inventory = {};

  rows.forEach(row => {
    inventory[row.name] = row.quantity;
  });

  return inventory;
}

// 🔹 TOTAL RECURSIVO (sin consumo)
function aggregateMaterials(db, itemId, amount, totals = {}) {

  const recipe = db.prepare(`
    SELECT id, result_count
    FROM recipes
    WHERE result_item_id = ?
  `).get(itemId);

  if (!recipe) {
    const item = db.prepare(`SELECT name FROM items WHERE id = ?`).get(itemId);

    if (!totals[item.name]) totals[item.name] = 0;
    totals[item.name] += amount;

    return totals;
  }

  const crafts = Math.ceil(amount / recipe.result_count);

  const materials = db.prepare(`
    SELECT m.id, m.name, rm.count
    FROM recipe_materials rm
    JOIN items m ON m.id = rm.item_id
    WHERE rm.recipe_id = ?
  `).all(recipe.id);

  materials.forEach((mat) => {
    const total = mat.count * crafts;
    aggregateMaterials(db, mat.id, total, totals);
  });

  return totals;
}

// 🔹 TREE SIMPLE
function buildNode(db, id, quantity) {

  const item = db.prepare(`SELECT id, name FROM items WHERE id = ?`).get(id);

  const recipe = db.prepare(`
    SELECT id, result_count
    FROM recipes
    WHERE result_item_id = ?
  `).get(id);

  const node = {
    id: item.id,
    name: item.name,
    quantity,
    materials: []
  };

  if (!recipe) return node;

  const crafts = Math.ceil(quantity / recipe.result_count);

  const mats = db.prepare(`
    SELECT item_id, count
    FROM recipe_materials
    WHERE recipe_id = ?
  `).all(recipe.id);

  mats.forEach(m => {
    node.materials.push(
      buildNode(db, m.item_id, m.count * crafts)
    );
  });

  return node;
}

// 🔹 CALCULATOR SIMPLE
function craftCalculator(req, res) {

  const db = getDatabase();

  const itemId = parseInt(req.params.itemId);
  const amount = parseInt(req.params.amount);

  const recipe = db.prepare(`
    SELECT id, result_count
    FROM recipes
    WHERE result_item_id = ?
  `).get(itemId);

  if (!recipe) {
    return res.json({
      materials: [{ name: "Base Item", quantity: amount }]
    });
  }

  const crafts = Math.ceil(amount / recipe.result_count);

  const materials = db.prepare(`
    SELECT m.name, rm.count
    FROM recipe_materials rm
    JOIN items m ON m.id = rm.item_id
    WHERE rm.recipe_id = ?
  `).all(recipe.id);

  const result = materials.map((mat) => ({
    name: mat.name,
    quantity: mat.count * crafts
  }));

  res.json({ materials: result });
}

// 🔹 TREE
function craftTree(req, res) {

  const db = getDatabase();

  const itemId = parseInt(req.params.itemId);
  const amount = parseInt(req.params.amount);

  const tree = buildNode(db, itemId, amount);

  res.json(tree);
}

// 🔹 TOTAL (sin consumo)
function craftTotal(req, res) {

  const db = getDatabase();

  const itemId = parseInt(req.params.itemId);
  const amount = parseInt(req.params.amount);

  const totals = aggregateMaterials(db, itemId, amount);
  const inventory = getUserInventory(db);

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

  res.json({
    materials
  });
}

// 🔥🔥🔥 CONSUMO REAL (LO IMPORTANTE)
function executeCraft(req, res) {

  const db = getDatabase();

  const itemId = parseInt(req.params.itemId);
  const amount = parseInt(req.params.amount);

  if (!itemId || !amount) {
    return res.status(400).json({ error: "itemId y amount requeridos" });
  }

  // 🔹 traer inventario
  const inventoryRows = db.prepare(`
    SELECT ui.item_id, i.name, ui.quantity
    FROM user_inventory ui
    JOIN items i ON i.id = ui.item_id
  `).all();

  const inventory = {};
  inventoryRows.forEach(i => {
    inventory[i.name] = {
      id: i.item_id,
      quantity: i.quantity
    };
  });

  const tree = buildNode(db, itemId, amount);

  function process(node, needed) {

    if (!node) return;

    const inv = inventory[node.name];

    let available = inv ? inv.quantity : 0;

    const used = Math.min(available, needed);

    if (inv) {
      inv.quantity -= used;
    }

    const remaining = needed - used;

    if (remaining === 0) return;
	
	// 🔥 verificar en DB si es crafteable
	const recipe = db.prepare(`
	  SELECT id FROM recipes WHERE result_item_id = ?
	`).get(node.id);

	if (remaining > 0 && !recipe) {
	  throw new Error(`Faltan materiales base: ${node.name}`);
	}

    if (node.materials && node.materials.length > 0) {

      node.materials.forEach(child => {

        const ratio = child.quantity / node.quantity;
        const childNeeded = remaining * ratio;

        process(child, childNeeded);

      });

    }

  }

  // 🔥 aplicar consumo desde root
  try {

	  tree.materials.forEach(child => {
		process(child, child.quantity);
	  });

	} catch (err) {
	  return res.status(400).json({
		success: false,
		error: err.message
	  });
	}
  
  // 🔹 guardar en DB
  const update = db.prepare(`
    UPDATE user_inventory
    SET quantity = ?
    WHERE item_id = ?
  `);

  const transaction = db.transaction(() => {

    Object.values(inventory).forEach(item => {
      update.run(item.quantity, item.id);
    });

  });

  transaction();

  res.json({ success: true });
}

module.exports = {
  craftCalculator,
  craftTree,
  craftTotal,
  executeCraft
};