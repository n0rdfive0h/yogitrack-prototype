const Package = require("../models/packageModel.cjs");

exports.getPackageIds = async (req, res) => {
    try {
        const packages = await Package.find(
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
        const packageDetail = await Package.findOne({ packageId: packageId });
        res.json(packageDetail);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
};

exports.getNextId = async (req, res) => {
    try {
        const senior = req.query.senior === "true";
        const prefix = senior ? "S" : "P";

        const lastPackage = await Package.find({ packageId: new RegExp(`^${prefix}`) })
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
        const result = await Package.findOneAndDelete({ packageId });
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
            description,
            price,
        } = req.body;
        if (!packageName || !description || !price) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        const newPackage = new Package({
            packageId,
            packageName,
            description,
            price
        });
        await newPackage.save();
        res.status(201).json({ message: "Package added", packageId });
    } catch (e) {
        console.error("Error adding package:", e);
        res.status(500).json({ message: "Failed to add package", error: e.message });
    }
};