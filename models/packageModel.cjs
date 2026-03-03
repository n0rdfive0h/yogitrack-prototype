const mongoose = require("mongoose");
require("../config/mongodbconn.cjs");

const packageModel = new mongoose.Schema({
    packageId: String,
    packageName: String,
    packageCategory: String,
    classNum: String,
    classType: String,
    startDate: String,
    endDate: String,
    price: Number
}, {collection: "package"});

module.exports = mongoose.model("Package", packageModel);