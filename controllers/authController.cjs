const bcrypt = require("bcrypt");
const Credentials = require("../models/credentialsModel.cjs");

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required"});
        }

        //Find user by email
        const user = await Credentials.findOne({ email: email });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        //Compare password with hashed password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        req.session.user = {
            userId: user.userId,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role
        };

        res.status(200).json({ message: "Login successful", role: user.role });
    } catch (e) {
        res.status(500).json({error: e.message});
    }
};


exports.logout = async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({ message: "Failed to logout" });
            }
            res.status(200).json({ message: "Logout successful" });
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.getSession = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: "Not logged in" });
        }
        res.status(200).json({ user: req.session.user });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.createCredentials = async (req, res) => {
    try {
        const { firstName, lastName, email, password, role } = req.body;

        if (!firstName || !lastName || !email || !password || !role) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        //Check if email already exists
        const existing = await Credentials.findOne({ email: email });
        if (existing) {
            return res.status(409).json({ message: "An account with this email already exists"});
        }

        //Get next user ID
        const lastUser = await Credentials.find({})
            .sort({ userId: -1 })
            .limit(1);

        let maxNumber = 1;
        if (lastUser.length > 0) {
            const lastId = lastUser[0].userId;
            const match = lastId.match(/\d+$/);
            if (match) {
                maxNumber = parseInt(match[0]) + 1;
            }
        }
        const nextId = `U${String(maxNumber).padStart(3, '0')}`;

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new Credentials({
            userId: nextId,
            firstName,
            lastName,
            email,
            password: hashedPassword,
            role
        });

        await newUser.save();
        res.status(201).json({ message: "Credentials created succesfully", userId: nextId });
    } catch (e) {
        res.status(500).json({error: e.message });
    }
};

exports.deleteCredentials = async (req, res) => {
    try {
        const { userId } = req.query;

        // Prevent deleting your own account
        if (req.session.user.userId === userId) {
            return res.status(400).json({ message: "You cannot delete your own account" });
        }

        const result = await Credentials.findOneAndDelete({ userId });
        if (!result) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ message: "Credentials deleted", userId });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.updateCredentials = async (req, res) => {
    try {
        const { userId, firstName, lastName, email, role } = req.body;

        if (!userId) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // If email is changing, ensure it isn't already used by another account
        if (email) {
            const existing = await Credentials.findOne({ email, userId: { $ne: userId } });
            if (existing) {
                return res.status(409).json({ message: "Email is already in use by another account" });
            }
        }

        const result = await Credentials.findOneAndUpdate(
            { userId },
            { $set: { firstName, lastName, email, role } },
            { new: true, projection: { password: 0 } }
        );

        if (!result) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ message: "User updated", userId });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.getUserIds = async (req, res) => {
    try {
        const users = await Credentials.find(
            {},
            { userId: 1, firstName: 1, lastName: 1, _id: 0 }
        ).sort({ userId: 1 });
        res.json(users);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
};

exports.getUser = async (req, res) => {
    try {
        const userId = req.query.userId;
        const user = await Credentials.findOne(
            { userId: userId },
            { password: 0, _id: 0 }
        );
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
};