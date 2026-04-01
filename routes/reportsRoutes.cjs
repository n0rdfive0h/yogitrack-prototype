const express = require("express");
const router = express.Router();
const reportsController = require("../controllers/reportsController.cjs");

router.get("/packageSales", reportsController.getPackageSalesReport);
router.get("/instructorReport", reportsController.getInstructorReport);
router.get("/customerReport", reportsController.getCustomerReport);

module.exports = router;