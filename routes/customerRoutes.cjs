const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customerController.cjs");

router.get("/getCustomerIds", customerController.getCustomerIds);
router.get("/getCustomer", customerController.getCustomer);
router.get("/getNextId", customerController.getNextId);
router.delete("/deleteCustomer", customerController.deleteCustomer);
router.post("/add", customerController.addCustomer);

module.exports = router;