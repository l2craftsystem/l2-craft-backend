const fs = require("fs");
const path = require("path");
const { XMLParser } = require("fast-xml-parser");
const { getDatabase } = require("../core/database");

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: ""
});

function importDatapack() {

  const db = getDatabase();

  const recipesFolder = path.join(__dirname, "datapack", "recipes");

  const files = fs.readdirSync(recipesFolder);

  console.log("Archivos encontrados:", files.length);

  files.forEach((file) => {

    if (!file.endsWith(".xml")) return;

    const filePath = path.join(recipesFolder, file);

    const xml = fs.readFileSync(filePath, "utf8");

    const data = parser.parse(xml);

    if (!data.recipe) return;

    const recipe = data.recipe;

    const name = recipe.name;

    const itemInsert = db.prepare(`
      INSERT INTO items (name, grade, type)
      VALUES (?, ?, ?)
    `).run(name, "unknown", "craft");

    const itemId = itemInsert.lastInsertRowid;

    let ingredients = recipe.ingredient;

    if (!ingredients) return;

    if (!Array.isArray(ingredients)) {
      ingredients = [ingredients];
    }

    ingredients.forEach((ing) => {

      const materialId = parseInt(ing.id);
      const quantity = parseInt(ing.count);

      db.prepare(`
        INSERT INTO requirements (item_id, material_id, quantity)
        VALUES (?, ?, ?)
      `).run(itemId, materialId, quantity);

    });

  });

  console.log("Importación completada");

}

importDatapack();