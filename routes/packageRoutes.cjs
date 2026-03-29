const express = require("express");
const router = express.Router();
const packageController = require("../controllers/packageController.cjs");

router.get("/getPackageIds", packageController.getPackageIds);
router.get("/getPackage", packageController.getPackage);
router.get("/getNextPackageId", packageController.getNextPackageId);
router.post("/add", packageController.addPackage);
router.delete("/deletePackage", packageController.deletePackage);

router.get("/getSaleIds", packageController.getSaleIds);
router.get("/getSale", packageController.getSale);
router.get("/getNextSaleId", packageController.getNextSaleId);
router.delete("/deleteSale", packageController.deleteSale);
router.post("/addSale", packageController.addSale);
module.exports = router;