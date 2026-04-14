const Sale = require("../models/saleModel.cjs");
const Customer = require("../models/customerModel.cjs");
const Class = require("../models/classModel.cjs");
const Instructor = require("../models/instructorModel.cjs");
const Attendance = require("../models/attendanceModel.cjs");
const PackageModel = require("../models/packageModel.cjs");

// Helper: build a dateTime range filter for fields stored as "YYYY-MM-DD HH:MM"
function dateRangeFilter(startDate, endDate) {
    if (!startDate || !endDate) return {};
    return { $gte: startDate, $lte: endDate + " 23:59" };
}

exports.getPackageSalesReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const filter = {};
        const range = dateRangeFilter(startDate, endDate);
        if (Object.keys(range).length) filter.dateTime = range;

        const sales = await Sale.find(filter);

        const report = await Promise.all(sales.map(async (sale) => {
            const customer = await Customer.findOne({ customerId: sale.customerId });
            const packageData = await PackageModel.findOne({ packageId: sale.Package.packageId });

            return {
                saleId: sale.saleId,
                customerName: customer ? `${customer.firstName} ${customer.lastName}` : "Unknown",
                packageName: packageData ? packageData.packageName : "Unknown",
                amountPaid: sale.Package.amountPaid,
                dateTime: sale.dateTime
            };
        }));

        res.json(report);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.getInstructorReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const sessionFilter = {};
        const range = dateRangeFilter(startDate, endDate);
        if (Object.keys(range).length) sessionFilter.dateTime = range;

        const instructors = await Instructor.find({});

        const report = await Promise.all(instructors.map(async (instructor) => {
            const classes = await Class.find({ instructorId: instructor.instructorId });

            const classReport = await Promise.all(classes.map(async (cls) => {
                const attendanceRecords = await Attendance.find({
                    classId: cls.classId,
                    ...sessionFilter
                });

                const sessions = attendanceRecords.map((record) => ({
                    attendanceId: record.attendanceId,
                    dateTime: record.dateTime,
                    attendees: record.customers.length
                }));

                const totalCheckIns = sessions.reduce((total, session) =>
                    total + session.attendees, 0);

                return {
                    classId: cls.classId,
                    className: cls.className,
                    totalCheckIns: totalCheckIns,
                    sessions: sessions
                };
            }));

            return {
                instructorId: instructor.instructorId,
                instructorName: `${instructor.firstName} ${instructor.lastName}`,
                classes: classReport
            };
        }));

        res.json(report);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.getCustomerReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const filter = {};
        const range = dateRangeFilter(startDate, endDate);
        if (Object.keys(range).length) filter.dateTime = range;

        const customers = await Customer.find({});
        const today = new Date();

        const report = await Promise.all(customers.map(async (customer) => {
            const sales = await Sale.find({ customerId: customer.customerId, ...filter });

            const packageReport = await Promise.all(sales.map(async (sale) => {
                const packageData = await PackageModel.findOne({ packageId: sale.Package.packageId });

                const startDateObj = new Date(sale.Package.startDate);
                const endDateObj = new Date(sale.Package.endDate);

                let status;
                if (today < startDateObj) {
                    status = "Future";
                } else if (today > endDateObj) {
                    status = "Expired";
                } else {
                    status = "Active";
                }

                return {
                    dateOfPurchase: sale.dateTime,
                    numberOfPasses: packageData ? packageData.classNum : "Unknown",
                    remainingClasses: sale.Package.remainingClasses,
                    status: status
                };
            }));

            return {
                customerId: customer.customerId,
                customerName: `${customer.firstName} ${customer.lastName}`,
                classBalance: customer.classBalance,
                packages: packageReport
            };
        }));

        res.json(report);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.getRevenueReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const filter = {};
        const range = dateRangeFilter(startDate, endDate);
        if (Object.keys(range).length) filter.dateTime = range;

        const sales = await Sale.find(filter);
        const totalRevenue = sales.reduce((sum, s) => sum + (s.Package.amountPaid || 0), 0);

        res.json({
            totalRevenue: totalRevenue.toFixed(2),
            saleCount: sales.length,
            startDate: startDate || null,
            endDate: endDate || null
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.getAvgAttendanceReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const filter = {};
        const range = dateRangeFilter(startDate, endDate);
        if (Object.keys(range).length) filter.dateTime = range;

        const records = await Attendance.find(filter);

        // Group records by classId
        const classMap = {};
        for (const record of records) {
            if (!classMap[record.classId]) {
                classMap[record.classId] = { sessions: 0, totalAttendees: 0 };
            }
            classMap[record.classId].sessions += 1;
            classMap[record.classId].totalAttendees += record.totalPresent;
        }

        // Look up class names and build per-class report
        const byClass = await Promise.all(
            Object.entries(classMap).map(async ([classId, stats]) => {
                const classData = await Class.findOne({ classId });
                return {
                    classId,
                    className: classData ? classData.className : "Unknown",
                    totalSessions: stats.sessions,
                    totalAttendees: stats.totalAttendees,
                    avgAttendance: (stats.totalAttendees / stats.sessions).toFixed(2)
                };
            })
        );

        // Sort by classId for consistent ordering
        byClass.sort((a, b) => a.classId.localeCompare(b.classId));

        res.json({
            byClass,
            startDate: startDate || null,
            endDate: endDate || null
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};
