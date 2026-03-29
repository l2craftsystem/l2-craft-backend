const express = require("express");
const { executeCraft, craftTree, craftTotal } = require("./craftController");

const router = express.Router();

router.post("/:itemId/craft/:amount", executeCraft);
router.get("/:itemId/tree/:amount", craftTree);
router.get("/:itemId/total/:amount", craftTotal);

module.exports = router;