const { supabase } = require('./supabase');

async function runMigrations() {
  console.log("Ejecutando migraciones en Supabase...");

  // Ejemplo de creación de tablas (solo si no existen)
  const tables = [
    `CREATE TABLE IF NOT EXISTS materials (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL,
      grade TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS requirements (
      id SERIAL PRIMARY KEY,
      item_id INT NOT NULL REFERENCES items(id),
      material_id INT NOT NULL REFERENCES materials(id),
      quantity INT NOT NULL
    );`
  ];

  for (const query of tables) {
    const { error } = await supabase.rpc('run_sql', { sql: query });
    if (error) console.log("Error migración:", error.message);
  }

  console.log("Migraciones ejecutadas en Supabase.");
}

module.exports = runMigrations;