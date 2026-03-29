const mongoose = require("mongoose");
require("../config/mongodbconn.cjs");

const attendanceModel = new mongoose.Schema({
    attendanceId: String,
    instructorId: String,
    classId: String,
    dateTime: String,
    customers: [String],
    totalPresent: Number
}, {collection: "attendance"});

module.exports = mongoose.model("Attendance", attendanceModel);