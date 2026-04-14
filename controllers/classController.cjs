const Class = require('../models/classModel.cjs');

// Helper: generate className from day/time/duration
function generateClassName(day, time, duration) {
    const dayNames = {
        Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday",
        Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday"
    };
    const [hours, mins] = time.split(':').map(Number);
    const totalEndMins = hours * 60 + mins + parseInt(duration);
    const endHours = Math.floor(totalEndMins / 60) % 24;
    const endMins = totalEndMins % 60;
    const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
    return `${dayNames[day] || day} ${time} - ${endTime}`;
}

// Populate the dropdown with class names and ids (includes deactivated flag)
exports.getClassIds = async (req, res) => {
    try {
        const classes = await Class.find(
            {},
            { classId: 1, className: 1, deactivated: 1, _id: 0 }
        ).sort();
        res.json(classes);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
};

// Get class details for the selected class id
exports.getClass = async (req, res) => {
    try {
        const classId = req.query.classId;
        const classDetail = await Class.findOne({ classId: classId });
        res.json(classDetail);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
};

// Get next available class id
exports.getNextId = async (req, res) => {
    try {
        const lastClass = await Class.find({})
            .sort({ classId: -1 })
            .limit(1);

        let maxNumber = 1;
        if (lastClass.length > 0) {
            const lastId = lastClass[0].classId;
            const match = lastId.match(/\d+$/);
            if (match) {
                maxNumber = parseInt(match[0]) + 1;
            }
        }
        const nextId = `A${String(maxNumber).padStart(3, '0')}`;
        res.json({ nextId });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
};

// Update class
exports.updateClass = async (req, res) => {
    try {
        const { classId, instructorId, classType, description, day, time, duration, deactivated } = req.body;

        if (!classId) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const className = generateClassName(day, time, duration);

        const result = await Class.findOneAndUpdate(
            { classId },
            { $set: { className, instructorId, classType, description, day, time, duration, deactivated } },
            { new: true }
        );

        if (!result) {
            return res.status(404).json({ message: "Class not found" });
        }

        res.json({ message: "Class updated", classId });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

// Delete class
exports.deleteClass = async (req, res) => {
    try {
        const { classId } = req.query;
        const result = await Class.findOneAndDelete({ classId });
        if (!result) {
            return res.status(404).json({ message: "Class not found" });
        }
        res.json({ message: "Class deleted", classId });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

// Add class
exports.addClass = async (req, res) => {
    try {
        const {
            classId,
            instructorId,
            classType,
            description,
            day,
            time,
            duration
        } = req.body;

        if (!instructorId || !classType || !day || !time || !duration) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Convert new class time to minutes
        const [newHours, newMins] = time.split(':').map(Number);
        const newStart = newHours * 60 + newMins;
        const newEnd = newStart + parseInt(duration);

        // Find classes on the same day to check for conflicts
        const existingClasses = await Class.find({ day: day });

        for (const existing of existingClasses) {
            const [exHours, exMins] = existing.time.split(':').map(Number);
            const exStart = exHours * 60 + exMins;
            const exEnd = exStart + existing.duration;

            if (newStart < exEnd && newEnd > exStart) {
                return res.status(409).json({
                    message: "Scheduling conflict detected",
                    conflict: {
                        day: day,
                        time: time,
                        confWith: existing.className,
                        existingTime: existing.time,
                        existingDuration: existing.duration
                    }
                });
            }
        }

        const className = generateClassName(day, time, duration);

        const newClass = new Class({
            classId,
            className,
            instructorId,
            classType,
            description,
            day,
            time,
            duration: parseInt(duration),
            deactivated: false
        });

        await newClass.save();
        res.status(201).json({ message: "Class scheduled successfully", class: newClass });
    } catch (e) {
        console.error("Error adding class:", e.message);
        res.status(500).json({ message: "Failed to schedule class", error: e.message });
    }
};
