const mongoose = require('mongoose');
require('../config/mongodbconn.cjs');

const classModel = new mongoose.Schema({
    classId: String,
    className: String,
    instructorId: String,
    classType: String,
    description: String,
    day: String,
    time: String,
    duration: Number,
    deactivated: { type: Boolean, default: false }
}, { collection: 'class' });

module.exports = mongoose.model('Class', classModel);
