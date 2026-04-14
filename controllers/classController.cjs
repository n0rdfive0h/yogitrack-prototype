const Class = require('../models/classModel.cjs');

//Populate the dropdown with class names and ids
exports.getClassIds = async (req, res) => {
    try {
        const classes = await Class.find(
            {},
            { classId: 1, className: 1, _id: 0 }
        ).sort();
        res.json(classes);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
};

//Get class details for the selected class id (populate pertinent fields)
exports.getClass = async (req, res) => {
    try {
        const classId = req.query.classId;
        const classDetail = await Class.findOne({ classId: classId });
        res.json(classDetail);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
};

//Get next available class id
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

//Update class
exports.updateClass = async (req, res) => {
    try {
        const { classId, className, instructorId, classType, description, daytime } = req.body;

        if (!classId) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const result = await Class.findOneAndUpdate(
            { classId },
            { $set: { className, instructorId, classType, description, daytime } },
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

//Delete class
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

//Add class
exports.addClass = async (req, res) => {
    try {
        const {
            classId,
            className,
            instructorId,
            classType,
            description,
            daytime
        } = req.body;
        //Check if required fields are empty
        if (!className || !instructorId || !classType || !daytime || daytime.length === 0) {
            return res.status(400).json({ message: "Missing required fields" });
    }

    const conflicts = [];

    //Convert currently entered time to minutes
    for (const slot of daytime) {
        const [newHours, newMins] = slot.time.split(':').map(Number);
        const newStart = newHours * 60 + newMins;
        const newEnd = newStart + slot.duration;

        //Find classes with sessions on the same day
        const existingClasses = await Class.find({
            'daytime.day': slot.day
        });

        //Convert existing class times to minutes
        for (const existing of existingClasses) {
            for (const existingSlot of existing.daytime) {
                if (existingSlot.day === slot.day) {
                    const [exHours, exMins] = existingSlot.time.split(':').map(Number);
                    const exStart = exHours * 60 + exMins;
                    const exEnd = exStart + existingSlot.duration;

                    //Check for time overlap
                    if (newStart < exEnd && newEnd > exStart) {
                        conflicts.push({
                            day: slot.day,
                            time: slot.time,
                            confWith: existing.className,
                            existingTime: existingSlot.time,
                            existingDuration: existingSlot.duration
                        });
                    }
                }
            }
        }
    }

    //Notify user of any scheduling conflicts
    if (conflicts.length > 0) {
        return res.status(409).json({
            message: "Scheduling conflict detected",
            conflicts: conflicts
        });
    }

    //If no conflicts, save the new class
    const newClass = new Class({
        classId,
        className,
        instructorId,
        classType,
        description,
        daytime
    });

    //Save to database
    await newClass.save();
    res.status(201).json({ message: "Class scheduled succesfully", class: newClass });
    } catch (e) {
        console.error("Error adding class:", e.message);
        res.status(500).json({ message: "Failed to schedule class", error: e.message });
    }
};