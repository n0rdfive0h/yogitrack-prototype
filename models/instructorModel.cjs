const mongoose = require("mongoose");
require("../config/mongodbconn.cjs");

const instructorModel = new mongoose.Schema({
    instructorId: String,
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    address: String,
    preferredContact: String
}, {collection:"instructor"});

module.exports = mongoose.model("Instructor", instructorModel);