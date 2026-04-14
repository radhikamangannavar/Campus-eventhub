const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  date: Date,
  venue: String,
  seats: Number,

  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  category: {
  type: String,
  required: true
},
  participants: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
],
attendees: [
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    checkedInAt: {
      type: Date,
      default: Date.now
    }
  }
],
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model("Event", eventSchema);