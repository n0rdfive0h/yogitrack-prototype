const PackageModel = require("../models/packageModel.cjs");
const Sale = require("../models/saleModel.cjs");
const Customer = require("../models/customerModel.cjs");

exports.getPackageIds = async (req, res) => {
    try {
        const packages = await PackageModel.find(
            {},
            { packageId: 1, packageName: 1, _id: 0 }
        ).sort();
        res.json(packages);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
};

exports.getPackage = async (req, res) => {
    try {
        const packageId = req.query.packageId;
        const packageDetail = await PackageModel.findOne({ packageId: packageId });
        res.json(packageDetail);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
};

exports.getNextPackageId = async (req, res) => {
    try {
        const senior = req.query.packageCategory === "Senior";
        const prefix = senior ? "S" : "P";

        const lastPackage = await PackageModel.find({ packageId: new RegExp(`^${prefix}`) })
            .sort({ packageId: -1 })
            .limit(1);

        let maxNumber = 1;
        if (lastPackage.length > 0) {
            const lastId = lastPackage[0].packageId;
            const match = lastId.match(/\d+$/);
            if (match) {
                maxNumber = parseInt(match[0]) + 1;
            }
        }
        const nextId = `${prefix}${String(maxNumber).padStart(3, '0')}`;
        res.json({ nextId });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
};

exports.deletePackage = async (req, res) => {
    try {
        const { packageId } = req.query;
        const result = await PackageModel.findOneAndDelete({ packageId });
        if (!result) {
            return res.status(404).json({ message: "Package not found" });
        }
        res.json({ message: "Package deleted", packageId });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.addPackage = async (req, res) => {
    try {
        const {
            packageId,
            packageName,
            packageCategory,
            classNum,
            classType,
            startDate,
            endDate,
            price
        } = req.body;
        if (!packageName || !packageCategory || !classNum || !classType || !startDate || !endDate || !price) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        const newPackage = new PackageModel({
            packageId,
            packageName,
            packageCategory,
            classNum,
            classType,
            startDate,
            endDate,
            price
        });
        await newPackage.save();
        res.status(201).json({ message: "Package added", packageId });
    } catch (e) {
        console.error("Error adding package:", e);
        res.status(500).json({ message: "Failed to add package", error: e.message });
    }
};

exports.getSaleIds = async (req, res) => {
    try {
        const sales = await Sale.find(
            {},
            {saleId: 1, _id: 0}
        ).sort({ saleId: 1 });
        res.json(sales);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
};

exports.getSale = async (req, res) => {
    try {
        const saleId = req.query.saleId;
        const saleDetail = await Sale.findOne({ saleId: saleId });
        res.json(saleDetail);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
}

exports.getNextSaleId = async (req, res) => {
    try {
        const lastSale = await Sale.find({})
            .sort({ saleId: -1 })
            .limit(1);
        
        let maxNumber = 1;
        if (lastSale.length > 0) {
            const lastId = lastSale[0].saleId;
            const match = lastId.match(/\d+$/);
            if (match) {
                maxNumber = parseInt(match[0]) + 1;
            }
        }
        const nextId = `T${String(maxNumber).padStart(3, '0')}`;
        res.json({ nextId });
    } catch(e) {
        res.status(400).json({ error: e.message });
    }
};

exports.deleteSale = async (req, res) => {
    try {
        const { saleId } = req.query;
        const result = await Sale.findOneAndDelete({ saleId });
        if (!result) {
            return res.status(404).json({ message: "Sale not found" });
        }
        res.json({ message: "Sale Deleted", saleId});
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.addSale = async (req, res) => {
    try {
        const {
            saleId,
            customerId,
            Package,
            paymentMode,
            dateTime
        } = req.body;
        if (!customerId || !Package || !Package.packageId || !Package.amountPaid || !paymentMode || !dateTime) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const packageData = await PackageModel.findOne({ packageId: Package.packageId });
        if (!packageData) {
            return res.status(404).json({ message: "Package not found" });
        }
    
        const newSale = new Sale({
            saleId,
            customerId,
            Package,
            paymentMode,
            dateTime
        });

        await newSale.save();

        const classNum = packageData.classNum === "Unlimited" ? 9999 : parseInt(packageData.classNum);
        await Customer.findOneAndUpdate(
            { customerId },
            { $inc: { classBalance: classNum } }
        );

        res.status(201).json({ message: "Sale Logged Succesfully!", sale: newSale});
    } catch (e) {
        console.error("Error logging sale:", e.message);
        res.status(500).json({ message: "Failed to Log Sale", error: e.message });
    }
    
};