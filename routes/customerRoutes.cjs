const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customerController.cjs");
const multer = require("multer");
const requireRole = require("../middleware/requireRole.cjs");

router.get("/getCustomerIds", customerController.getCustomerIds);
router.get("/getCustomer", customerController.getCustomer);
router.get("/getNextId", customerController.getNextId);
router.delete("/deleteCustomer", customerController.deleteCustomer);
router.post("/add", customerController.addCustomer);
router.put("/updateCustomer", requireRole("manager", "instructor"), customerController.updateCustomer);
router.post("/uploadCSV", multer({ dest: "uploads/" }).single("csvFile"), customerController.uploadCSV);

module.exports = router;