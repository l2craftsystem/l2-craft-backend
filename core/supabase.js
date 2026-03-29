require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Falta configurar SUPABASE_URL o SUPABASE_KEY en el .env");
}

const supabase = createClient(supabaseUrl, supabaseKey);
console.log("Supabase client creado OK");

module.exports = supabase;