const mongoose = require("mongoose");
require("../config/mongodbconn.cjs");

const credentialsModel = new mongoose.Schema({
    userId: String,
    firstName: String,
    lastName: String,
    email: String,
    password: String,
    role: String
}, {collection: "credentials"});

module.exports = mongoose.model("Credentials", credentialsModel);