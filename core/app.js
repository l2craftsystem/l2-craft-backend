require("dotenv").config();
const express = require('express');
const cors = require('cors');
const { supabase } = require('./supabase');

const itemsRoutes = require('../modules/items/routes');
const craftRoutes = require("../modules/craft/craftRoutes");
const inventoryRoutes = require("../modules/inventory/inventoryRoutes"); 

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/items', itemsRoutes);
  app.use("/craft", craftRoutes);
  app.use("/inventory", inventoryRoutes);

  // Debug route usando Supabase
  app.get('/debug/requirements', async (req, res) => {
    const { data, error } = await supabase.from('requirements').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  return app;
}

module.exports = createApp;