const express = require('express');
const { getDatabase } = require('../../core/database');

const router = express.Router();



/*
==============================
LISTAR ITEMS
GET /items
==============================
*/

router.get('/', (req, res) => {

  const db = getDatabase();

  const items = db.prepare(`
    SELECT id, name, type
    FROM items
    ORDER BY name
    LIMIT 200
  `).all();

  res.json(items);

});



/*
==============================
BUSCAR ITEMS
GET /items/search?q=sword
==============================
*/

router.get('/search', (req, res) => {

  const db = getDatabase();

  const q = req.query.q;

  if (!q) {
    return res.json([]);
  }

  const rows = db.prepare(`
    SELECT id, name, type
    FROM items
    WHERE name LIKE ?
    ORDER BY name
    LIMIT 30
  `).all(`%${q}%`);

  res.json(rows);

});

router.get("/craft", (req, res) => {

  const db = getDatabase();

  const rows = db.prepare(`

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

  `).all();

  res.json(rows);

});

router.get("/recipes", (req, res) => {

  const db = getDatabase();

  const rows = db.prepare(`

    SELECT id, name
FROM items
WHERE category='recipe'
AND grade='s'
ORDER BY name;

  `).all();

  res.json(rows);

});




/*
==============================
verificar item crafteable
==============================
*/
router.get("/materials", (req, res) => {

  const db = getDatabase();

  const rows = db.prepare(`

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
  `).all();

  res.json(rows);

});

router.get("/keys", (req, res) => {

  const db = getDatabase();

  const rows = db.prepare(`

    SELECT id, name
FROM items
WHERE category='key'
AND grade='s'
ORDER BY name;

  `).all();

  res.json(rows);

});

/*
==============================
VER ITEM
GET /items/:id
==============================
*/

router.get('/:id', (req, res) => {

  const db = getDatabase();

  const id = req.params.id;

  const item = db.prepare(`
    SELECT id, name, type
    FROM items
    WHERE id = ?
  `).get(id);

  if (!item) {
    return res.status(404).json({
      error: 'Item no encontrado'
    });
  }

  res.json(item);

});


module.exports = router;