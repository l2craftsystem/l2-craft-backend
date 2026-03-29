const express = require('express');
const supabase = require('../../core/supabase');

const router = express.Router();

/*
==============================
LISTAR ITEMS
==============================
*/
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("items")
      .select("id, name, type")
      .order("name", { ascending: true })
      .limit(200);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*
==============================
SEARCH
==============================
*/
router.get('/search', async (req, res) => {
  const q = req.query.q;
  if (!q) return res.json([]);

  try {
    const { data, error } = await supabase
      .from("items")
      .select("id, name, type")
      .ilike("name", `%${q}%`)
      .order("name")
      .limit(30);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*
==============================
CRAFT
==============================
*/
router.get("/craft", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("items")
      .select("id,name,category,grade")
      .or("category.eq.weapon,category.eq.armor,category.eq.jewel")
      .eq("grade", "s")
      .order("category", { ascending: true })
      .order("name", { ascending: true });

    if (error) throw error;

    // Filtramos sealed para armor y jewel
    const filtered = data.filter(i => 
      i.category === "weapon" || 
      ((i.category === "armor" || i.category === "jewel") && i.name.startsWith("Sealed"))
    );

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*
==============================
RECIPES
==============================
*/
router.get("/recipes", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("items")
      .select("id, name")
      .eq("category", "recipe")
      .eq("grade", "s")
      .order("name");

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*
==============================
MATERIALS
==============================
*/
router.get("/materials", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("items")
      .select("id,name,category,grade")
      .in("category", ["crystal", "gem", "material"])
      .order("category", { ascending: true })
      .order("grade", { ascending: false })
      .order("name", { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*
==============================
KEYS
==============================
*/
router.get("/keys", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("items")
      .select("id,name")
      .eq("category", "key")
      .eq("grade", "s")
      .order("name");

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*
==============================
ITEM BY ID
==============================
*/
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("items")
      .select("id, name, type")
      .eq("id", req.params.id)
      .limit(1);

    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ error: 'Item no encontrado' });

    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;