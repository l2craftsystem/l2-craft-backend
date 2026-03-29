const express = require('express');
const db = require('../../core/db');

const router = express.Router();

/*
==============================
LISTAR ITEMS
==============================
*/
router.get('/', async (req, res) => {

  const result = await db.query(`
    SELECT id, name, type
    FROM items
    ORDER BY name
    LIMIT 200
  `);

  res.json(result.rows);

});

/*
==============================
SEARCH
==============================
*/
router.get('/search', async (req, res) => {

  const q = req.query.q;

  if (!q) return res.json([]);

  const result = await db.query(`
    SELECT id, name, type
    FROM items
    WHERE name ILIKE $1
    ORDER BY name
    LIMIT 30
  `, [`%${q}%`]);

  res.json(result.rows);

});

/*
==============================
CRAFT
==============================
*/
router.get("/craft", async (req, res) => {

  const result = await db.query(`
    SELECT id,name,category
    FROM items
    WHERE grade='s'
    AND (
      category='weapon'
      OR (category='armor' AND name LIKE 'Sealed%')
      OR (category='jewel' AND name LIKE 'Sealed%')
    )
    ORDER BY
    CASE
      WHEN category='weapon' THEN 1
      WHEN category='armor' THEN 2
      WHEN category='jewel' THEN 3
    END,
    name;
  `);

  res.json(result.rows);

});

/*
==============================
RECIPES
==============================
*/
router.get("/recipes", async (req, res) => {

  const result = await db.query(`
    SELECT id, name
    FROM items
    WHERE category='recipe'
    AND grade='s'
    ORDER BY name;
  `);

  res.json(result.rows);

});

/*
==============================
MATERIALS
==============================
*/
router.get("/materials", async (req, res) => {

  const result = await db.query(`
    SELECT id,name,category,grade
    FROM items
    WHERE category IN ('crystal','gem','material')
    ORDER BY
    CASE category
    WHEN 'crystal' THEN 1
    WHEN 'gem' THEN 2
    WHEN 'material' THEN 3
    END,
    grade DESC,
    name ASC;
  `);

  res.json(result.rows);

});

/*
==============================
KEYS
==============================
*/
router.get("/keys", async (req, res) => {

  const result = await db.query(`
    SELECT id, name
    FROM items
    WHERE category='key'
    AND grade='s'
    ORDER BY name;
  `);

  res.json(result.rows);

});

/*
==============================
ITEM BY ID
==============================
*/
router.get('/:id', async (req, res) => {

  const result = await db.query(`
    SELECT id, name, type
    FROM items
    WHERE id = $1
  `, [req.params.id]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Item no encontrado' });
  }

  res.json(result.rows[0]);

});

module.exports = router;