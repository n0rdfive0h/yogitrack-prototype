const mongoose = require("mongoose");
require("../config/mongodbconn.cjs");

const packageModel = new mongoose.Schema({
    packageId: String,
    packageName: String,
    description: String,
    price: Number
}, {collection: "package"});

module.exports = mongoose.model("Package", packageModel);