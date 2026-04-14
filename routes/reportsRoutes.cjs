const express = require("express");
const router = express.Router();
const reportsController = require("../controllers/reportsController.cjs");

router.get("/packageSales", reportsController.getPackageSalesReport);
router.get("/instructorReport", reportsController.getInstructorReport);
router.get("/customerReport", reportsController.getCustomerReport);
router.get("/revenueReport", reportsController.getRevenueReport);
router.get("/avgAttendanceReport", reportsController.getAvgAttendanceReport);

module.exports = router;