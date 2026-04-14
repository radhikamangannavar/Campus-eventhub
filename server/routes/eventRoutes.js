const express = require("express");
const router = express.Router();
const Event = require("../models/eventModel");

console.log("=== DEBUG EVENT ===");
console.log("TYPE:", typeof Event);
console.log("KEYS:", Object.keys(Event));
console.log("VALUE:", Event);


const { createEvent, getEvents, getOrganizerEvents, registerEvent, scanQR } = require("../controllers/eventController");
const { protect, isOrganizer } = require("../middleware/authMiddleware");

// create event (only organizer)
router.post("/create", protect, isOrganizer, createEvent);

// get all events
router.get("/", getEvents);

// get organizer's events
router.get("/organizer", protect, isOrganizer, getOrganizerEvents);

// register for event (student/user)
router.post("/:id/register", protect, registerEvent)
router.post("/scan", protect, isOrganizer, scanQR);
router.put("/:id", protect, isOrganizer, async (req, res) => {
  try {
    const { title, description, venue, date, seats } = req.body;

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // 🔥 OWNER CHECK (CRITICAL)
    if (String(event.organizer) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Build update object ONLY with provided fields
    const updateData = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (venue !== undefined) updateData.venue = venue;
    if (date) updateData.date = new Date(date);
    if (seats !== undefined) updateData.seats = Number(seats);

    const updated = await Event.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({ message: "Event updated", updated });

  } catch (err) {
    console.log("UPDATE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});
router.delete("/:id", protect, isOrganizer, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // 🔥 OWNER CHECK
    if (String(event.organizer) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await Event.findByIdAndDelete(req.params.id);

    res.json({ message: "Event deleted successfully" });

  } catch (error) {
    console.log("DELETE ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});
module.exports = router;