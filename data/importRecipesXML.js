const fs = require("fs");
const path = require("path");
const { XMLParser } = require("fast-xml-parser");
const { connectDatabase, getDatabase } = require("../core/database");

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: ""
});

connectDatabase();

function importRecipes() {

  const db = getDatabase();

  const xmlPath = path.join(__dirname, "recipes.xml");

  const xml = fs.readFileSync(xmlPath, "utf8");

  const data = parser.parse(xml);

  let recipes = data.list.item;

  if (!Array.isArray(recipes)) {
    recipes = [recipes];
  }

  console.log("Recipes encontradas:", recipes.length);

  recipes.forEach((recipe) => {

    const production = recipe.production;

    if (!production) return;

    const itemName = recipe.name;

    const result = db.prepare(`
      INSERT INTO items (name, grade, type)
      VALUES (?, ?, ?)
    `).run(itemName, "unknown", "craft");

    const itemId = result.lastInsertRowid;

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

  console.log("Importación terminada");

}

importRecipes();