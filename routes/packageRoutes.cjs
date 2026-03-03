const express = require("express");
const router = express.Router();
const packageController = require("../controllers/packageController.cjs");

router.get("/getPackageIds", packageController.getPackageIds);
router.get("/getPackage", packageController.getPackage);
router.get("/getNextId", packageController.getNextId);
router.post("/add", packageController.addPackage);
router.delete("/deletePackage", packageController.deletePackage);

module.exports = router;