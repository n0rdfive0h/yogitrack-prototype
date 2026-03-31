const express = require("express");
const router = express.Router();
const checkInController = require("../controllers/checkInController.cjs");

router.get("/getClassesByInstructor", checkInController.getClassesByInstructor);
router.get("/getNextAttendanceId", checkInController.getNextAttendanceId);
router.get("/checkCustomerBalance", checkInController.checkCustomerBalance);
router.post("/add", checkInController.addAttendance);

module.exports = router;