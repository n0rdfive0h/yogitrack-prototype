const Customer = require('../models/customerModel.cjs');

//Populate the dropdown with customer names and ids
exports.getCustomerIds = async (req, res) => {
    try {
        const customers = await Customer.find(
            {},
            { customerId: 1, firstName: 1, lastName: 1, _id: 0 }
        ).sort();
        res.json(customers);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
};

//Get customer details for the selected customer id (populate pertinent fields)
exports.getCustomer = async (req, res) => {
    try {
        const customerId = req.query.customerId;
        const customerDetail = await Customer.findOne({ customerId: customerId });
        res.json(customerDetail);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
};

//Get next available customer id
exports.getNextId = async (req, res) => {
    try {
        const lastCustomer = await Customer.find({})
            .sort({ customerId: -1 })
            .limit(1);
        
        let maxNumber = 1;
        if (lastCustomer.length > 0) {
            const lastId = lastCustomer[0].customerId;
            const match = lastId.match(/\d+$/);
            if (match) {
                maxNumber = parseInt(match[0]) + 1;
            }
        }
        const nextId = `Y${String(maxNumber).padStart(3, '0')}`;
        res.json({ nextId });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
};

//Delete customer
exports.deleteCustomer = async (req, res) => {
    try {
        const { customerId } = req.query;
        const result = await Customer.findOneAndDelete({ customerId });
        if (!result) {
            return res.status(404).json({ message: "Customer not found" });
        }
        res.json({ message: "Customer deleted", customerId });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

//Add customer
exports.addCustomer = async (req, res) => {
    try {
        const {
            customerId,
            firstName,
            lastName,
            email,
            phone,
            senior,
            address,
            preferredContact,
            classBalance,
            confirmed
        } = req.body;
        if (!customerId || !firstName || !lastName || !address || !phone || !email || !preferredContact) {
            return res.status(400).json({ message: "Missing required fields" });
        }
        
        if (!confirmed) {
            const existing = await Customer.find({
                firstName: { $regex: firstName, $options: "i" },
                lastName: { $regex: lastName, $options: "i" }
            });
            if (existing.length > 0) {
                return res.status(409).json({ 
                    message: "Customer name already exists" 
                });
            }
        }

        const newCustomer = new Customer({
            customerId,
            firstName,
            lastName,
            email,
            phone,
            senior,
            address,
            preferredContact,
            classBalance
        });

        await newCustomer.save();
        res.status(201).json({ message: "Customer added", customerId });
    } catch (e) {
        console.error("Error adding customer:", e);
        res.status(400).json({ error: e.message });
    }
};