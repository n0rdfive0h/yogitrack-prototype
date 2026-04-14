function requireRole(...allowedRoles) {
    return (req, res, next) => {
        const user = req.session?.user;
        if (!user) return res.status(401).json({ message: "Not logged in" });
        if (!allowedRoles.includes(user.role)) {
            return res.status(403).json({ message: "Access denied" });
        }
        next();
    };
}

module.exports = requireRole;
