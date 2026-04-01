const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController.cjs");

router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/getSession", authController.getSession);
router.post("/createCredentials", authController.createCredentials);
router.delete("/deleteCredentials", authController.deleteCredentials);
router.get("/getUserIds", authController.getUserIds);
router.get("/getUser", authController.getUser);

module.exports = router;