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

const ITEMS_DIR = path.join(__dirname, "items");

console.log("Leyendo items desde:", ITEMS_DIR);

const files = fs.readdirSync(ITEMS_DIR);
console.log("Archivos XML encontrados:", files.length);

let total = 0;

files.forEach(file => {

  if (!file.endsWith(".xml")) return;

  const xml = fs.readFileSync(path.join(ITEMS_DIR, file), "utf8");
  const data = parser.parse(xml);

  if (!data.list || !data.list.item) return;

  let items = data.list.item;

  if (!Array.isArray(items))
    items = [items];

  items.forEach(item => {

    let sets = item.set || [];
    if (!Array.isArray(sets)) sets = [sets];

    let grade = null;
    let type = null;
    let etcType = null;
    let bodypart = null;
	


    sets.forEach(s => {

      if (!s.name) return;

      if (s.name === "crystal_type")
        grade = s.val?.toLowerCase();

      if (s.name === "weapon_type")
        type = "weapon";

      if (s.name === "armor_type")
        type = "armor";

      if (s.name === "etcitem_type") {

  etcType = s.val?.toLowerCase();

  console.log("EtcType detectado:", etcType);

}

      if (s.name === "bodypart")
        bodypart = s.val;

    });

    // joyería
    if (["neck","rear","lear","rfinger","lfinger"].includes(bodypart))
      type = "jewel";

    // excluir flechas
    if (etcType === "arrow" || etcType === "bolt")
      return;

const allowedEtcTypes = [
  "material",
  "recipe",
  "key_material",
  "gemstone",
  "crystal"
];

if (!type && allowedEtcTypes.includes(etcType)) {
  type = "material";
}


    // equipos solo B/A/S
    if (["weapon","armor","jewel"].includes(type)) {
      if (!["b","a","s"].includes(grade))
        return;
    }

    if (!type)
      return;

    db.prepare(`
      INSERT OR IGNORE INTO items
      (id,name,type,grade,etc_type)
      VALUES (?,?,?,?,?)
    `).run(
      item.id,
      item.name,
      type,
      grade || "none",
      etcType || null
    );

    total++;

  });

});

console.log("Items importados:", total);