const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
// signup
const signup = async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role
});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, password });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 🔥 CREATE TOKEN
    const token = jwt.sign(
      { id: user._id, role: user.role },
      "secretkey", // ⚠️ later move to .env
      { expiresIn: "1d" }
    );

    res.json({
      _id: user._id,
      name: user.name,   
      role: user.role,
      token
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { signup, login };