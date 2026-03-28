const fs = require("fs");
const path = require("path");
const { XMLParser } = require("fast-xml-parser");

const { connectDatabase, getDatabase } = require("../core/database");

connectDatabase();
const db = getDatabase();

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: ""
});

const RECIPES_DIR = path.join(__dirname, "datapack/recipes");

console.log("Leyendo recipes desde:", RECIPES_DIR);

const files = fs.readdirSync(RECIPES_DIR);

let recipeTotal = 0;
let materialsTotal = 0;

files.forEach(file => {

  if (!file.endsWith(".xml")) return;

  const xml = fs.readFileSync(path.join(RECIPES_DIR, file), "utf8");

  const data = parser.parse(xml);

  if (!data.list || !data.list.item) return;

  let recipes = data.list.item;

  if (!Array.isArray(recipes))
    recipes = [recipes];

  recipes.forEach(r => {

    const recipeId = parseInt(r.id);
    const recipeItemId = parseInt(r.recipeId);

    const craftLevel = parseInt(r.craftLevel || 1);
    const successRate = parseInt(r.successRate || 100);
    const type = r.type || "dwarven";

    let production = r.production;

    if (!production) return;

    const resultItemId = parseInt(production.id);
    const resultCount = parseInt(production.count);
	
	const resultExists = db
	.prepare("SELECT id FROM items WHERE id=?")
	.get(resultItemId);

	if (!resultExists) return;

    db.prepare(`
      INSERT OR IGNORE INTO recipes
      (id, recipe_item_id, result_item_id, result_count, craft_level, success_rate, type)
      VALUES (?,?,?,?,?,?,?)
    `).run(
      recipeId,
      recipeItemId,
      resultItemId,
      resultCount,
      craftLevel,
      successRate,
      type
    );

    recipeTotal++;

    let ingredients = r.ingredient || [];

    if (!Array.isArray(ingredients))
      ingredients = [ingredients];

    ingredients.forEach(ing => {

  const itemId = parseInt(ing.id);

  const itemExists = db
    .prepare("SELECT id FROM items WHERE id=?")
    .get(itemId);

  if (!itemExists) return;

  db.prepare(`
    INSERT INTO recipe_materials
    (recipe_id, item_id, count)
    VALUES (?,?,?)
  `).run(
    recipeId,
    itemId,
    parseInt(ing.count)
  );

  materialsTotal++;

});

  });

});

console.log("Recipes importadas:", recipeTotal);
console.log("Materiales importados:", materialsTotal);