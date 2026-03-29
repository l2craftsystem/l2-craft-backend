const supabase = require("../../core/supabase");

async function getInventory(req, res) {
  try {
    const { data, error } = await supabase
      .from("user_inventory")
      .select("item_id, quantity, items(name)")
      .order("item_id");

    if (error) throw error;

    const inventory = {};
    data.forEach(r => inventory[r.items.name] = r.quantity);

    res.json(inventory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateInventory(req, res) {
  try {
    const { name, quantity } = req.body;

    // Buscar item por nombre
    const { data: items, error: itemError } = await supabase
      .from("items")
      .select("id")
      .eq("name", name)
      .limit(1);

    if (itemError) throw itemError;
    if (!items || items.length === 0) return res.status(404).json({ error: "Item no encontrado" });

    const itemId = items[0].id;

    // Upsert en inventory
    const { error } = await supabase
      .from("user_inventory")
      .upsert({ item_id: itemId, quantity });

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getInventory,
  updateInventory
};