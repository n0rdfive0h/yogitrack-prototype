const express = require("express");
const router = express.Router();
const instructorController = require("../controllers/instructorController.cjs");
const requireRole = require("../middleware/requireRole.cjs");

router.get("/getInstructor", instructorController.getInstructor);
router.get("/getNextId", instructorController.getNextId);
router.post("/add", instructorController.add);
router.get("/getInstructorIds", instructorController.getInstructorIds);
router.put("/updateInstructor", requireRole("manager"), instructorController.updateInstructor);
router.delete("/deleteInstructor", instructorController.deleteInstructor);

module.exports = router;