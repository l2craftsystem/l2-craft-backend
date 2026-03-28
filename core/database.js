const Database = require('better-sqlite3');
const path = require('path');

let db = null;

function connectDatabase() {

  const dbPath = path.join(__dirname, '../db/l2craft.sqlite');

  console.log("Ruta absoluta DB:", path.resolve(dbPath));

  db = new Database(dbPath);

  console.log('Conectado a SQLite (better-sqlite3).');
}

function getDatabase() {
  return db;
}

module.exports = {
  connectDatabase,
  getDatabase
};