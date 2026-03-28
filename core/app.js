const express = require('express');
const cors = require('cors');
const { getDatabase } = require('./database');

const itemsRoutes = require('../modules/items/routes');
const craftRoutes = require("../modules/craft/craftRoutes");
const inventoryRoutes = require("../modules/inventory/inventoryRoutes"); // ✅ FIX

function createApp() {

  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/items', itemsRoutes);
  app.use("/craft", craftRoutes);
  app.use("/inventory", inventoryRoutes);

  app.get('/debug/requirements', (req, res) => {

    const db = getDatabase();

    const rows = db.prepare(`
      SELECT * FROM requirements
    `).all();

    res.json(rows);

  });

  return app;
}

module.exports = createApp;