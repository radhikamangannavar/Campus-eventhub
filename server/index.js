console.log("INDEX FILE RUNNING");

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// 🔥 TEST ROUTE (add this)
app.get("/test", (req, res) => {
  res.send("TEST OK");
});

// routes
const eventRoutes = require("./routes/eventRoutes");
app.use("/api/events", eventRoutes);
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

// base route
app.get("/", (req, res) => {
  res.send("API working");
});

// DB connection
//mongoose.connect(process.env.MONGO_URI)
  //.then(() => console.log("MongoDB connected"))
  //.catch(err => console.log(err));

// server
app.listen(3001, "127.0.0.1", () => {
  console.log("Server running on port 3001");

  mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000
  })
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log("DB ERROR:", err.message));
});