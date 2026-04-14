const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController.cjs");
const requireRole = require("../middleware/requireRole.cjs");

router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/getSession", authController.getSession);
router.post("/createCredentials", authController.createCredentials);
router.delete("/deleteCredentials", authController.deleteCredentials);
router.get("/getUserIds", authController.getUserIds);
router.get("/getUser", authController.getUser);
router.put("/updateCredentials", requireRole("manager"), authController.updateCredentials);

module.exports = router;