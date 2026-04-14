const Instructor = require("../models/instructorModel.cjs");

exports.search = async (req, res) => {
  try {
    const searchString = req.query.firstName;
    const instructor = await Instructor.find({
      firstName: { $regex: searchString, $options: "i" },
    });

    if (!instructor || instructor.length == 0) {
      return res.status(404).json({ message: "No instructor found" });
    } else {
      res.json(instructor[0]);
    }
  } catch (e) {
    res.status(400).json({error: e.message});
  }
};

//Find the package selected in the dropdown
exports.getInstructor = async (req, res) => {
  try {
    const instructorId = req.query.instructorId;
    const instructorDetail = await Instructor.findOne({ instructorId: instructorId });

    res.json(instructorDetail);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.add = async (req, res) => {
  try {
    const {
      instructorId,
      firstName,
      lastName,
      email,
      phone,
      address,
      preferredContact
    } = req.body;

    // Basic validation
    if (!firstName || !lastName || !email || !phone) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Create a new instructor document
    const newInstructor = new Instructor({
      instructorId,
      firstName,
      lastName,
      address,
      phone,
      email,
      preferredContact
    });

    // Save to database
    await newInstructor.save();
    res.status(201).json({ message: "Instructor added successfully", instructor: newInstructor });
  } catch (err) {
    console.error("Error adding instructor:", err.message);
    res.status(500).json({ message: "Failed to add instructor", error: err.message });
  }
};

//Populate the instructorId dropdown
exports.getInstructorIds = async (req, res) => {
  try {
    const instructors = await Instructor.find(
      {},
      { instructorId: 1, firstName: 1, lastName: 1, _id: 0 }
    ).sort();

    res.json(instructors);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.getNextId = async (req, res) => {
  const lastInstructor = await Instructor.find({})
    .sort({ instructorId: -1 })
    .limit(1);

  let maxNumber = 1;
  if (lastInstructor.length > 0) {
    const lastId = lastInstructor[0].instructorId;
    const match = lastId.match(/\d+$/);
    if (match) {
      maxNumber = parseInt(match[0]) + 1;
    }
  }
  const nextId = `I${String(maxNumber).padStart(3, '0')}`;
  res.json({ nextId });
};

exports.updateInstructor = async (req, res) => {
    try {
        const { instructorId, firstName, lastName, email, phone, address, preferredContact } = req.body;

        if (!instructorId) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const result = await Instructor.findOneAndUpdate(
            { instructorId },
            { $set: { firstName, lastName, email, phone, address, preferredContact } },
            { new: true }
        );

        if (!result) {
            return res.status(404).json({ message: "Instructor not found" });
        }

        res.json({ message: "Instructor updated", instructorId });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.deleteInstructor = async (req, res) => {
  try {
     const {instructorId} = req.query;
     const result = await Instructor.findOneAndDelete({ instructorId });
     if (!result) {
      return res.status(404).json({ error: "Instructor not found" });
    }
    res.json({ message: "Instructor deleted", instructorId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
