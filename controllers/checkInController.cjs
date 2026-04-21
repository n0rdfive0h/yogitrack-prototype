const Attendance = require("../models/attendanceModel.cjs");
const Class = require("../models/classModel.cjs");
const Customer = require("../models/customerModel.cjs");
const Sale = require("../models/saleModel.cjs");

// Helper: expire any packages whose endDate has passed and zero out their remainingClasses.
// Returns the total classes deducted from the customer's balance.
async function processExpiredPackages(customerId) {
    const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

    const expiredSales = await Sale.find({
        customerId,
        'Package.endDate': { $lt: today },
        'Package.remainingClasses': { $gt: 0 }
    });

    let totalDeducted = 0;
    for (const sale of expiredSales) {
        totalDeducted += sale.Package.remainingClasses;
        await Sale.findOneAndUpdate(
            { saleId: sale.saleId },
            { $set: { 'Package.remainingClasses': 0 } }
        );
    }

    if (totalDeducted > 0) {
        await Customer.findOneAndUpdate(
            { customerId },
            { $inc: { classBalance: -totalDeducted } }
        );
    }

    return totalDeducted;
}

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
        res.status(400).json({ error: e.message });
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
        res.status(400).json({ error: e.message });
    }
};

exports.addAttendance = async (req, res) => {
    try {
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

        const scheduleMatch = classData.day === submittedDay &&
            classData.time.substring(0, 5) === submittedTime;

        if (!scheduleMatch) {
            return res.status(400).json({
                message: `This class is not scheduled for ${submittedDay} at ${submittedTime}. Scheduled: ${classData.day} at ${classData.time.substring(0, 5)}.`
            });
        }

        const newAttendance = new Attendance({
            attendanceId,
            instructorId,
            classId,
            dateTime,
            customers,
            totalPresent: customers.length
        });

        await newAttendance.save();

        const today = new Date().toISOString().split('T')[0];
        const balanceWarnings = [];

        for (const customerId of customers) {
            // 1. Expire any lapsed packages and adjust classBalance
            await processExpiredPackages(customerId);

            // 2. Reload customer after expiry adjustments
            const customer = await Customer.findOne({ customerId });

            // 3. Warn if balance is at or below zero before deduction
            if (customer.classBalance <= 0) {
                balanceWarnings.push(customerId);
            }

            // 4. Deduct 1 from classBalance
            await Customer.findOneAndUpdate(
                { customerId },
                { $inc: { classBalance: -1 } }
            );

            // 5. Deduct 1 from the earliest-expiring active sale's remainingClasses
            const activeSale = await Sale.findOne({
                customerId,
                'Package.endDate': { $gte: today },
                'Package.remainingClasses': { $gt: 0 }
            }).sort({ 'Package.endDate': 1 });

            if (activeSale) {
                await Sale.findOneAndUpdate(
                    { saleId: activeSale.saleId },
                    { $inc: { 'Package.remainingClasses': -1 } }
                );
            }
        }

        res.status(201).json({
            message: "Attendance saved successfully",
            attendanceId,
            totalPresent: customers.length,
            balanceWarnings: balanceWarnings
        });
    } catch (e) {
        console.error("Error saving attendance:", e.message);
        res.status(500).json({ message: "Failed to save attendance", error: e.message });
    }
};
