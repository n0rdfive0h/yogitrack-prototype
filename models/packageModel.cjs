const mongoose = require("mongoose");
require("../config/mongodbconn.cjs");

const packageModel = new mongoose.Schema({
    packageId: String,
    packageName: String,
    packageCategory: String,
    classNum: String,
    classType: String,
    durationMonths: Number,
    price: Number,
    deactivated: { type: Boolean, default: false }
}, {collection: "package"});

module.exports = mongoose.model("Package", packageModel);