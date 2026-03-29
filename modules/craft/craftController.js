const supabase = require("../../core/supabase");

// 🔹 USER INVENTORY
async function getUserInventory() {
  const { data, error } = await supabase
    .from("user_inventory")
    .select("item_id, quantity, items(name)");

  if (error) throw error;

  const inventory = {};
  data.forEach(row => {
    inventory[row.items.name] = row.quantity;
  });
  return inventory;
}

// 🔹 TOTAL RECURSIVO
async function aggregateMaterials(itemId, amount, totals = {}) {
  const { data: recipeData } = await supabase
    .from("recipes")
    .select("id, result_count")
    .eq("result_item_id", itemId)
    .limit(1);

  if (!recipeData || recipeData.length === 0) {
    const { data: itemData } = await supabase
      .from("items")
      .select("name")
      .eq("id", itemId)
      .limit(1);

    const name = itemData[0].name;
    if (!totals[name]) totals[name] = 0;
    totals[name] += amount;
    return totals;
  }

  const recipe = recipeData[0];
  const crafts = Math.ceil(amount / recipe.result_count);

  const { data: mats } = await supabase
    .from("recipe_materials")
    .select("item_id, count")
    .eq("recipe_id", recipe.id);

  for (const mat of mats) {
    const total = mat.count * crafts;
    await aggregateMaterials(mat.item_id, total, totals);
  }

  return totals;
}

// 🔹 TREE
async function buildNode(id, quantity) {
  const { data: itemData } = await supabase
    .from("items")
    .select("id,name")
    .eq("id", id)
    .limit(1);

  const item = itemData[0];

  const { data: recipeData } = await supabase
    .from("recipes")
    .select("id, result_count")
    .eq("result_item_id", id)
    .limit(1);

  const node = {
    id: item.id,
    name: item.name,
    quantity,
    materials: []
  };

  if (!recipeData || recipeData.length === 0) return node;

  const recipe = recipeData[0];
  const crafts = Math.ceil(quantity / recipe.result_count);

  const { data: mats } = await supabase
    .from("recipe_materials")
    .select("item_id, count")
    .eq("recipe_id", recipe.id);

  for (const m of mats) {
    node.materials.push(await buildNode(m.item_id, m.count * crafts));
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
    return { name, required, owned, missing };
  });

  res.json({ materials });
}

// 🔹 EXECUTE CRAFT
async function executeCraft(req, res) {
  const itemId = parseInt(req.params.itemId);
  const amount = parseInt(req.params.amount);

  const inventoryRows = await getUserInventory();

  const tree = await buildNode(itemId, amount);

  async function process(node, needed) {
    const available = inventoryRows[node.name] || 0;
    const used = Math.min(available, needed);
    inventoryRows[node.name] = available - used;

    const remaining = needed - used;
    if (remaining === 0) return;

    const { data: recipeData } = await supabase
      .from("recipes")
      .select("id")
      .eq("result_item_id", node.id)
      .limit(1);

    if (remaining > 0 && (!recipeData || recipeData.length === 0)) {
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
    return res.status(400).json({ success: false, error: err.message });
  }

  // Guardar inventario actualizado
  for (const [name, obj] of Object.entries(inventoryRows)) {
    const { data: items } = await supabase
      .from("items")
      .select("id")
      .eq("name", name)
      .limit(1);
    if (items.length > 0) {
      await supabase
        .from("user_inventory")
        .upsert({ item_id: items[0].id, quantity: obj });
    }
  }

  res.json({ success: true });
}

module.exports = {
  craftTree,
  craftTotal,
  executeCraft
};