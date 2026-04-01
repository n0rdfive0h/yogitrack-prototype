const nodemailer = require("nodemailer");
const Customer = require("../models/customerModel.cjs");

//Create reusable transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

exports.sendToCustomer = async (req, res) => {
    try {
        const { customerId, subject, message } = req.body;

        if (!customerId || !subject || !message) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const customer = await Customer.findOne({ customerId });
        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }

        if (!customer.optIn) {
            return res.status(400).json({ message: "Customer has not opted in to receive messages" });
        }

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: customer.email,
            subject: subject,
            text: message
        });

        res.status(200).json({ message: `Email sent successfully to ${customer.firstName} ${customer.lastName}` });

    } catch (e) {
        console.error("Error sending email:", e.message);
        res.status(500).json({ error: e.message });
    }
};

exports.sendToAll = async (req, res) => {
    try {
        const { subject, message } = req.body;

        if (!subject || !message) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Get all opted-in customers
        const customers = await Customer.find({ optIn: true });

        if (customers.length === 0) {
            return res.status(404).json({ message: "No opted-in customers found" });
        }

        // Send email to each opted-in customer
        const results = [];
        for (const customer of customers) {
            try {
                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: customer.email,
                    subject: subject,
                    text: message
                });
                results.push({ customerId: customer.customerId, status: "sent" });
            } catch (err) {
                results.push({ customerId: customer.customerId, status: "failed", error: err.message });
            }
        }

        res.status(200).json({ 
            message: `Emails sent to ${results.filter(r => r.status === "sent").length} customers`,
            results 
        });

    } catch (e) {
        console.error("Error sending emails:", e.message);
        res.status(500).json({ error: e.message });
    }
};