const Attendance = require("../models/attendanceModel.cjs");
const Class = require("../models/classModel.cjs");
const Customer = require("../models/customerModel.cjs");

exports.getClassesByInstructor = async (req, res) => {
    try {
        const instructorId = req.query.instructorId;
        const classes = await Class.find(
            { instructorId: instructorId },
            { classId: 1, className: 1, _id: 0 }
        );
        res.json(classes);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
};

exports.getNextAttendanceId = async (req, res) => {
    try {
        const lastAttendance = await Attendance.find({})
            .sort({ attendanceId: -1 })
            .limit(1);

        let maxNumber = 1;
        if (lastAttendance.length > 0) {
            const lastId = lastAttendance[0].attendanceId;
            const match = lastId.match(/\d+$/);
            if (match) {
                maxNumber = parseInt(match[0]) + 1;
            }
        }
        const nextId = `AT${String(maxNumber).padStart(3, '0')}`;
        res.json({ nextId });
    } catch (e) {
        res.status(400).json({ error: e.message})
    }
};

exports.checkCustomerBalance = async (req, res) => {
    try {
        const customerId = req.query.customerId;
        const customer = await Customer.findOne({ customerId: customerId });

        if (!customer) {
            return res.status(404).json({ error: "Customer not found" });
        }

        res.json({
            customerId: customer.customerId,
            firstName: customer.firstName,
            lastName: customer.lastName,
            classBalance: customer.classBalance,
            hasBalance: customer.classBalance > 0
        });
    } catch (e) {
        res.status(400).json({ error: e.message});
    }
};

exports.addAttendance = async (req, res) => {
    try{
        const {
            attendanceId,
            instructorId,
            classId,
            dateTime,
            customers
        } = req.body;

        if (!instructorId || !classId || !dateTime || !customers || customers.length === 0) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const classData = await Class.findOne({ classId: classId });
        if (!classData) {
            return res.status(404).json({ message: "Class not found" });
        }
        const [year, month, day] = dateTime.split(" ")[0].split("-").map(Number);
        const submittedDate = new Date(year, month - 1, day);
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const submittedDay = days[submittedDate.getDay()];

        const submittedTime = dateTime.split(" ")[1];

        const scheduleMatch = classData.daytime.some(slot =>
            slot.day === submittedDay && slot.time.substring(0, 5) === submittedTime
        );

        const newAttendance = new Attendance({
            attendanceId,
            instructorId,
            classId,
            dateTime,
            customers,
            totalPresent: customers.length
        });

        await newAttendance.save();

        const balanceWarnings = [];
        for (const customerId of customers) {
            const customer = await Customer.findOne({ customerId });

            if (customer.classBalance <= 0) {
                balanceWarnings.push(customerId);
            }

            await Customer.findOneAndUpdate(
                { customerId },
                { $inc: { classBalance: -1 } }
            );
        }

        res.status(201).json({
            message: "Attendance saved succesfully",
            attendanceId,
            totalPresent: customers.length,
            balanceWarnings: balanceWarnings,
            scheduleWarning: !scheduleMatch ? 
                `Warning: This class is not scheduled for ${submittedDay} at ${submittedTime}` : null
        });
    } catch (e) {
        console.error("Error saving attendance:", e.message);
        res.status(500).json({ message: "Failed to save attendance", error: e.message });
    }
};