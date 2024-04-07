const User = require("../models/user");


const isAuthenticated = async (req, res, next) => {
    try {
        if (!req.headers.authorization) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const token = req.headers.authorization.replace("Bearer ", "");

        const findUser = await User.findOne({ token: token }).select("account");

        if (findUser === null) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        req.user = findUser;
        next();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = isAuthenticated;