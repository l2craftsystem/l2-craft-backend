const fs = require('fs');
const path = require('path');
const { connectDatabase, getDatabase } = require('../../core/database');

function runSeeds() {
  connectDatabase();
  const db = getDatabase();

  const datasetPath = path.join(
    __dirname,
    'interlude.dataset.json'
  );

  const raw = fs.readFileSync(datasetPath);
  const data = JSON.parse(raw);

  const insertMaterial = db.prepare(`
    INSERT OR IGNORE INTO materials (name)
    VALUES (?)
  `);

  const insertKey = db.prepare(`
    INSERT OR IGNORE INTO keys (name, grade, item_type)
    VALUES (?, ?, ?)
  `);

  const insertRecipe = db.prepare(`
    INSERT OR IGNORE INTO recipes (name, grade, item_type)
    VALUES (?, ?, ?)
  `);

  const insertItem = db.prepare(`
    INSERT OR IGNORE INTO items (name, type, grade)
    VALUES (?, ?, ?)
  `);
  
	const getItemId = db.prepare(`
	  SELECT id FROM items WHERE name = ?
	`);

	const getMaterialId = db.prepare(`
	  SELECT id FROM materials WHERE name = ?
	`);
    
	db.prepare(`DELETE FROM requirements`).run();
	
	const insertRequirement = db.prepare(`
	  INSERT INTO requirements (item_id, material_id, quantity)
	  VALUES (?, ?, ?)
	`);

  const transaction = db.transaction(() => {

    data.materials.forEach(m =>
      insertMaterial.run(m.name)
    );

    data.keys.forEach(k =>
      insertKey.run(k.name, k.grade, k.item_type)
    );

    data.recipes.forEach(r =>
      insertRecipe.run(r.name, r.grade, r.item_type)
    );

    data.items.forEach(i =>
      insertItem.run(i.name, i.type, i.grade)
    );
	
	data.requirements.forEach(req => {

	  const item = getItemId.get(req.item);
	  if (!item) {
		console.warn(`Item no encontrado: ${req.item}`);
		return;
	  }

	  req.materials.forEach(mat => {

		const material = getMaterialId.get(mat.name);
		if (!material) {
		  console.warn(`Material no encontrado: ${mat.name}`);
		  return;
		}

		insertRequirement.run(
		  item.id,
		  material.id,
		  mat.quantity
		);

	  });

	});

  });

  transaction();

  console.log('Seeds cargados correctamente.');
}

module.exports = runSeeds;

if (require.main === module) {
  runSeeds();
}