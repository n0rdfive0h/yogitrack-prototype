const express = require("express");
const router = express.Router();
const messagingController = require("../controllers/messagingController.cjs");

router.post("/sendToCustomer", messagingController.sendToCustomer);
router.post("/sendToAll", messagingController.sendToAll);

module.exports = router;