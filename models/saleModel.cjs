const mongoose = require("mongoose");
require("../config/mongodbconn.cjs");

const saleModel = new mongoose.Schema({
    saleId: String,
    customerId: String,
    Package: {
        packageId: String,
        startDate: String,
        endDate: String,
        amountPaid: Number
    },
    paymentMode: String,
    dateTime: String
}, {collection: "sale"});

module.exports = mongoose.model("Sale", saleModel);