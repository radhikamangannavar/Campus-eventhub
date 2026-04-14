const Event = require("../models/eventModel");
const QRCode = require("qrcode");

// 🔹 CREATE EVENT
const createEvent = async (req, res) => {
  try {
    const { title, description, venue, seats, date, category } = req.body;

    if (!title || !description || !venue || !seats || !date || !category) {
      return res.status(400).json({ message: "All fields required" });
    }

    const event = await Event.create({
      title,
      description,
      venue,
      seats: Number(seats),
      date: new Date(date),
      organizer: req.user._id,
      category
    });

    const populatedEvent = await Event.findById(event._id)
      .populate("organizer", "name email")
      .populate("participants", "name email");

    res.status(201).json(populatedEvent);

  } catch (error) {
    console.log("CREATE ERROR:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// 🔹 REGISTER EVENT
const registerEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // ❌ Organizer cannot register
    if (String(event.organizer) === String(req.user._id)) {
      return res.status(400).json({ message: "Organizer cannot register" });
    }

    // ❌ Duplicate registration
    if (event.participants.some(p => p.toString() === req.user._id.toString())) {
      return res.status(400).json({ message: "Already registered" });
    }

    // ❌ Event full
    if (event.participants.length >= event.seats) {
      return res.status(400).json({ message: "Event full" });
    }

    // ✅ Register
    event.participants.push(req.user._id);

    // 🔥 Generate QR DATA (not just image)
    const qrData = JSON.stringify({
      userId: req.user._id,
      eventId: event._id
    });

    const qrCode = await QRCode.toDataURL(qrData);

    await event.save();

    const updatedEvent = await Event.findById(event._id)
      .populate("organizer", "name email")
      .populate("participants", "name email");

    res.json({
      message: "Registration successful",
      event: updatedEvent,
      qrCode
    });

  } catch (error) {
    console.log("REGISTER ERROR:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// 🔹 SCAN QR (CHECK-IN)
const scanQR = async (req, res) => {
  try {
    const { userId, eventId } = req.body;

    if (!userId || !eventId) {
      return res.status(400).json({ message: "Invalid QR data" });
    }

    const event = await Event.findById(eventId);
const now = new Date();

// 🔥 check last 5 seconds activity
const recentScans = (event.attendees || []).filter(a => {
  const diff = (now - new Date(a.checkedInAt)) / 1000;
  return diff < 5;
});

// 🚨 if too many scans → suspicious
if (recentScans.length >= 5) {
  return res.status(400).json({
    message: "Suspicious activity detected (Too many rapid check-ins)"
  });
}
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // ❌ Not registered
    const isRegistered = event.participants.some(
      p => p.toString() === userId.toString()
    );

    if (!isRegistered) {
      return res.status(400).json({ message: "User not registered" });
    }

    // 🔥 Ensure attendees exists
    if (!event.attendees) {
      event.attendees = [];
    }

    // ❌ Already checked-in
    const alreadyChecked = event.attendees.some(
      a => a.user.toString() === userId.toString()
    );
// 🔥 FRAUD DETECTION (rapid scan)
const lastScan = event.attendees
  ?.filter(a => a.user.toString() === userId.toString())
  .sort((a, b) => new Date(b.checkedInAt) - new Date(a.checkedInAt))[0];

if (lastScan) {
  const diff = (new Date() - new Date(lastScan.checkedInAt)) / 1000; // seconds

  if (diff < 10) {
    console.log("⚠️ Suspicious scan detected:", userId);
  }
}
    if (alreadyChecked) {
      return res.status(400).json({ message: "Already checked in" });
    }

    // ✅ Mark attendance
    event.attendees.push({
      user: userId,
      checkedInAt: new Date()
    });

    await event.save();

    res.json({ message: "Check-in successful" });

  } catch (err) {
    console.log("SCAN ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// 🔹 GET ALL EVENTS
const getEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate("organizer", "name email")
      .populate("participants", "name email")
      .populate("attendees.user", "name email"); // 🔥 IMPORTANT

    res.json(events);
  } catch (error) {
    console.log("GET EVENTS ERROR:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// 🔹 GET ORGANIZER EVENTS
const getOrganizerEvents = async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user._id })
      .populate("organizer", "name email")
      .populate("participants", "name email")
      .populate("attendees.user", "name email");

    res.json(events);
  } catch (error) {
    console.log("GET ORGANIZER EVENTS ERROR:", error.message);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createEvent,
  getEvents,
  getOrganizerEvents,
  registerEvent,
  scanQR
};