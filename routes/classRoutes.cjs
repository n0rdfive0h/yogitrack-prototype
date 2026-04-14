const express = require("express");
const router = express.Router();
const classController = require("../controllers/classController.cjs");
const requireRole = require("../middleware/requireRole.cjs");

router.get("/getClassIds", classController.getClassIds);
router.get("/getClass", classController.getClass);
router.get("/getNextId", classController.getNextId);
router.post("/add", classController.addClass);
router.put("/updateClass", requireRole("manager"), classController.updateClass);
router.delete("/deleteClass", classController.deleteClass);

module.exports = router;