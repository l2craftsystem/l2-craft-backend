// core/database.js
const supabase = require("./supabase");

function getDatabase() {
  return supabase;
}

module.exports = {
  getDatabase
};