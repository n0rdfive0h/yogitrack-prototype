const Sale = require("../models/saleModel.cjs");
const Customer = require("../models/customerModel.cjs");
const Class = require("../models/classModel.cjs");
const Instructor = require("../models/instructorModel.cjs");
const Attendance = require("../models/attendanceModel.cjs");
const PackageModel = require("../models/packageModel.cjs");

exports.getPackageSalesReport = async (req, res) => {
    try { 
        const sales = await Sale.find({});

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
        const instructors = await Instructor.find({});

        const report = await Promise.all(instructors.map(async (instructor) => {
            const classes = await Class.find({ instructorId: instructor.instructorId });

            const classReport = await Promise.all(classes.map(async (cls) => {
                const attendanceRecords = await Attendance.find({ classId: cls.classId });

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
        const customers = await Customer.find({});
        //Default to the current date
        const today = new Date();

        const report = await Promise.all(customers.map(async (customer) => {
            //Get all sales for this customer
            const sales = await Sale.find({ customerId: customer.customerId });

            //For each sale, determine package status
            const packageReport = await Promise.all(sales.map(async (sale) => {
                const packageData = await PackageModel.findOne({ packageId: sale.Package.packageId });

                const startDate = new Date(sale.Package.startDate);
                const endDate = new Date(sale.Package.endDate);

                let status;
                if (today < startDate) {
                    status = "Future";
                } else if (today > endDate) {
                    status = "Expired";
                } else {
                    status = "Active";
                }

                return {
                    dateOfPurchase: sale.dateTime,
                    numberOfPasses: packageData ? packageData.classNum : "Unknown",
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