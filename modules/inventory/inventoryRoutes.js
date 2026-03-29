const express = require("express");
const { getInventory, updateInventory } = require("./inventoryController");

const router = express.Router();

router.post("/", updateInventory);
router.get("/", getInventory);

module.exports = router;