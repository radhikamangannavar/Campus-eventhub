const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

// 🔐 PROTECT ROUTES
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, "secretkey");

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user; // ✅ attach user
    next();

  } catch (error) {
    console.log("AUTH ERROR:", error.message);
    res.status(401).json({ message: "Invalid token" });
  }
};

// 🛠 ORGANIZER CHECK
const isOrganizer = (req, res, next) => {
  if (req.user.role !== "organizer") {
    return res.status(403).json({ message: "Only organizers allowed" });
  }
  next();
};

module.exports = { protect, isOrganizer };