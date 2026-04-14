import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import Login from "./Login";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from "chart.js";

import { Bar } from "react-chartjs-2";
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

function App() {
const [events, setEvents] = useState([]);
const getToken = () => localStorage.getItem("token");

const [loading, setLoading] = useState(false);
const [message, setMessage] = useState("");

const [userId, setUserId] = useState(null);
const [role, setRole] = useState(null);
const [showQR, setShowQR] = useState(null);

const [email, setEmail] = useState("");
const [password, setPassword] = useState("");

const [date, setDate] = useState("");
const [title, setTitle] = useState("");
const [description, setDescription] = useState("");
const [venue, setVenue] = useState("");
const [seats, setSeats] = useState("");

const [search, setSearch] = useState("");
const [showParticipants, setShowParticipants] = useState(null);
const [activeTab, setActiveTab] = useState("events");
const [editEventId, setEditEventId] = useState(null);
const [isLoggedIn, setIsLoggedIn] = useState(false);

const [scanStatus, setScanStatus] = useState(null);
const [category, setCategory] = useState("");
const [selectedCategory, setSelectedCategory] = useState("");

// 🔁 fetch events
const fetchEvents = async () => {
  try {
    const res = await fetch("http://127.0.0.1:3001/api/events");
    const data = await res.json();
    setEvents(data);
  } catch (err) {
    console.log(err);
  }
};

// 🔄 Load from localStorage
useEffect(() => {
  const storedUser = JSON.parse(localStorage.getItem("user"));

  if (storedUser) {
    setUserId(storedUser._id);
    setRole(storedUser.role);
    setIsLoggedIn(true);
  }
}, []);

useEffect(() => {
  if (userId) fetchEvents();
}, [userId]);

// 🔥 FIXED SCANNER
useEffect(() => {
  if (role === "organizer" && activeTab === "organizer") {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: 200 },
      false
    );

    scanner.render(
      (decodedText) => handleScan(decodedText),
      () => {}
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }
}, [role, activeTab]);

// 🔐 LOGIN
const handleLogin = async () => {
  try {
    const res = await fetch("http://127.0.0.1:3001/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (data._id) {
      setUserId(data._id);
      setRole(data.role);
      setIsLoggedIn(true);
      setActiveTab(data.role === "organizer" ? "organizer" : "events");

      localStorage.setItem("user", JSON.stringify(data));
      localStorage.setItem("token", data.token);
    } else {
      setMessage("Invalid credentials");
      setTimeout(() => setMessage(""), 2000);
    }
  } catch (error) {
    console.log(error);
  }
};

// 🔓 LOGOUT
const handleLogout = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  setUserId(null);
  setRole(null);
  setIsLoggedIn(false);
};

  // 🎟️ REGISTER
const registerEvent = async (eventId) => {
  setLoading(true);

  try {
    const res = await fetch(
      `http://127.0.0.1:3001/api/events/${eventId}/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        }
      }
    );

    const data = await res.json();

    if (res.ok) {
      setMessage(data.message || "Registered");

      // 🔥 refresh events (this is enough)
      await fetchEvents();

    } else {
      setMessage(data.message || "Registration failed");
    }

  } catch (error) {
    console.log(error);
    setMessage("Server error");
  }

  setTimeout(() => setMessage(""), 2000);
  setLoading(false);
};
const handleScan = async (data) => {
  console.log("SCAN HIT");

  let parsed;

  try {
    parsed = JSON.parse(data);

    // 🔥 handle double-string QR
    if (typeof parsed === "string") {
      parsed = JSON.parse(parsed);
    }

    console.log("FINAL PARSED:", parsed);

    // ✅ VALIDATION (IMPORTANT)
    if (!parsed.userId || !parsed.eventId) {
      setScanStatus("error");
      setMessage("Invalid QR data");
      return;
    }

  } catch {
    setScanStatus("error");
    setMessage("Invalid QR format");
    return;
  }

  try {
    const res = await fetch("http://127.0.0.1:3001/api/events/scan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify(parsed)
    });

    const result = await res.json();

    console.log("SCAN RESPONSE:", result);

    setScanStatus(res.ok ? "success" : "error");
    setMessage(result.message || (res.ok ? "Check-in successful" : "Check-in failed"));

    if (res.ok) {
      await fetchEvents(); // 🔥 refresh UI
    }

  } catch (err) {
    console.log("SCAN ERROR:", err);
    setScanStatus("error");
    setMessage("Scan failed");
  }
};
  // 🔥 FIXED DELETE FUNCTION
 const deleteEvent = async (eventId) => {
  try {
    await fetch(
      `http://127.0.0.1:3001/api/events/${eventId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        }
      }
    );

    await fetchEvents();

  } catch (error) {
    console.log(error);
  }
};

  // 🔹 CREATE EVENT
  const handleCreateEvent = async () => {
    console.log("SENDING:", {
  title,
  description,
  venue,date,
  seats,
  category
});
    if (!title || !description || !venue || !seats || !category) {
  setMessage("All fields are required");
  return;
}

if (seats <= 0) {
  setMessage("Seats must be greater than 0");
  return;
}
    try {
      const payload = {
  title,
  description,
  venue,
  date,
  seats: Number(seats),
  category
};

const res = await fetch("http://127.0.0.1:3001/api/events/create", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`
  },
  body: JSON.stringify(payload)   // 🔥 THIS LINE
});

      const data = await res.json();

      setMessage(data.message || "Event created");

      await fetchEvents();
      setTitle("");
      setDescription("");
      setVenue("");
      setSeats("");
    } catch (error) {
      console.log(error);
      setMessage("Error creating event");
    }
  };

  // 👉 LOGIN SCREEN
  if (!isLoggedIn) {
    return (
      <Login
        onLogin={(data) => {
          setUserId(data._id);
          setRole(data.role);
          setActiveTab(data.role === "organizer" ? "organizer" : "events");
          localStorage.setItem("user", JSON.stringify(data));
          localStorage.setItem("token", data.token);
          setIsLoggedIn(true);
        }}
      />
    );
  }

  // 📊 stats
  const totalEvents = events.length;
  const totalSeats = events.reduce((sum, e) => sum + e.seats, 0);
  const totalRegistrations = events.reduce(
    (sum, e) => sum + (e.participants?.length || 0),
    0
  );
  const totalAttendance = events.reduce(
  (sum, e) => sum + (e.attendees?.length || 0),
  0
);

const dropOff = totalRegistrations - totalAttendance;

const dropPercent =
  totalRegistrations > 0
    ? ((dropOff / totalRegistrations) * 100).toFixed(1)
    : 0;
    const shortLabels = events.map(e =>
  e.title.length > 10 ? e.title.slice(0, 10) + "…" : e.title
);
const topEvents = [...events]
  .sort((a, b) => (b.participants?.length || 0) - (a.participants?.length || 0))
  .slice(0, 6);
  const chartData = {
  labels: shortLabels,
  datasets: [
    {
      label: "Registrations",
      data: topEvents.map(e => e.participants?.length || 0),
      backgroundColor: "#4f46e5"
    },
    {
      label: "Check-ins",
      data: topEvents.map(e => e.attendees?.length || 0),
      backgroundColor: "#22c55e"
    }
  ]
};
const organizerEvents = events.filter(e => {
  const organizerId =
    typeof e.organizer === "object"
      ? e.organizer?._id
      : e.organizer;

  return String(organizerId) === String(userId);
});
  const displayedOrganizerEvents = organizerEvents.filter(event => {
    if (!search.trim()) return true;
    return (
      event.title.toLowerCase().includes(search.toLowerCase()) ||
      event.venue.toLowerCase().includes(search.toLowerCase())
    );
  });

 const getEventStatus = (event) => {
  if (!event || !event.date) return "No Date"; // 👈 prevents crash

  const now = new Date();
  const eventDate = new Date(event.date);

  if (eventDate > now) return "Upcoming";

  if (eventDate.toDateString() === now.toDateString())
    return "Ongoing";

  return "Completed";
};
const getSeatStatus = (seats) => {
  if (seats > 20) return { text: "Available", color: "#22c55e" };
  if (seats > 5) return { text: "Filling Fast", color: "#f59e0b" };
  return { text: "Almost Full", color: "#ef4444" };
};
const user = JSON.parse(localStorage.getItem("user"));
const categoryCount = {};

events.forEach(e => {
  if (!e.category) return;

  categoryCount[e.category] =
    (categoryCount[e.category] || 0) + (e.participants?.length || 0);
});
const totalCheckins = events.reduce(
  (sum, e) => sum + (e.attendees?.length || 0),
  0
);

const mostPopularCategory = Object.keys(categoryCount).length > 0
  ? Object.keys(categoryCount).reduce((a, b) =>
      categoryCount[a] > categoryCount[b] ? a : b
    )
  : "N/A";
const engagement =
  totalRegistrations > 0
    ? ((totalAttendance / totalRegistrations) * 100).toFixed(1)
    : 0;

const popularEvent = [...events].sort(
  (a, b) => (b.attendees?.length || 0) - (a.attendees?.length || 0)
)[0];
let peakHour = null;

if (events.length > 0) {
  const allTimes = events.flatMap(e => e.attendees || []);

  const hours = allTimes.map(a =>
    new Date(a.checkedInAt).getHours()
  );

  if (hours.length > 0) {
    peakHour = hours.sort(
      (a, b) =>
        hours.filter(v => v === a).length -
        hours.filter(v => v === b).length
    ).pop();
  }
}
const formatHour = (hour) => {
  if (hour === null) return "No data";

  const period = hour >= 12 ? "PM" : "AM";
  const formatted = hour % 12 || 12;

  return `${formatted} ${period}`;
};
  return (
    <div style={{ display: "flex" }}>
      {/* 🔹 SIDEBAR */}
<div style={sidebar}>
  <h2 style={{ marginBottom: "30px" }}>EventHub</h2>

  {/* 🔹 SIDEBAR NAV */}

{role === "student" && (
  <>
    <button style={navBtn} onClick={() => setActiveTab("events")}>
      📅 Events
    </button>

    <button style={navBtn} onClick={() => setActiveTab("my")}>
      🎟 My Registrations
    </button>
  </>
)}

{role === "organizer" && (
  <>
    <button style={navBtn} onClick={() => setActiveTab("organizer")}>
      🛠 Organizer Panel
    </button>
  </>
)}

  <button onClick={handleLogout} style={logoutBtnSidebar}>
    Logout
  </button>
</div>
{/* 🔹 MAIN CONTENT */}
<div style={contentArea}>
  <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
    <div style={{
  marginBottom: "30px",
  padding: "25px",
  borderRadius: "14px",
  background: "linear-gradient(135deg, #1e3a8a, #4f46e5)",
  color: "white",
  boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
  height: "70px",
}}>
  <h2 style={{ marginBottom: "5px" }}>
    {user?.role === "organizer" ? " Welcome back" : " Welcome back"}, {user?.name}
  </h2>

  <p style={{ opacity: 0.9 }}>
    {user?.role === "organizer"
      ? "Manage your events and track attendance"
      : "Explore events and manage your registrations"}
  </p>

  <p style={{
    marginTop: "10px",
    fontSize: "13px",
    opacity: 0.8
  }}>
    Role: {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
  </p>
</div>
    {/* 🔹 TOP BAR */}
<div style={topBar}>
  <input
    placeholder="Search events..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    style={topSearch}
  />

  <div style={{ display: "flex", gap: "15px" }}>
    <span>🔔</span>
    <span>👤</span>
  </div>
</div>
      <h1 style={{ textAlign: "center",
  fontWeight: "700",
  color: "#1e293b",
  letterSpacing: "-0.5px"}}>Campus EventHub</h1>
      <div style={{
  display: "flex",
  justifyContent: "center",
  gap: "20px",
  margin: "20px 0"
}}>
  
  <div style={{
  display: "flex",
  justifyContent: "center",
  gap: "20px",
  margin: "20px 0"
}}>

  {role === "student" && (
    <>
      <button
  onClick={() => {setActiveTab("events");
    fetchEvents();
  }}
  style={tabBtn(activeTab === "events")}
  onMouseEnter={(e) => {
    e.target.style.transform = "scale(1.05)";
    e.target.style.boxShadow = "0 4px 15px rgba(79,70,229,0.4)";
  }}
  onMouseLeave={(e) => {
    e.target.style.transform = "scale(1)";
    e.target.style.boxShadow = "none";
  }}
>
  Events
</button>
<button
  onClick={() => setActiveTab("my")}
  style={tabBtn(activeTab === "my")}
  onMouseEnter={(e) => {
    e.target.style.transform = "scale(1.05)";
    e.target.style.boxShadow = "0 4px 15px rgba(79,70,229,0.4)";
  }}
  onMouseLeave={(e) => {
    e.target.style.transform = "scale(1)";
    e.target.style.boxShadow = "none";
  }}
>
  My Registrations
</button>
    </>
  )}

  </div>

  {role === "organizer" && (
    <button
  onClick={() => {setActiveTab("organizer");
    fetchEvents();
  }}
  style={tabBtn(activeTab === "organizer")}

  onMouseEnter={(e) => {
    e.target.style.transform = "scale(1.05)";
    e.target.style.boxShadow = "0 4px 12px rgba(79,70,229,0.3)";
  }}

  onMouseLeave={(e) => {
    e.target.style.transform = "scale(1)";
    e.target.style.boxShadow = "none";
  }}
>
  Organizer Panel
</button>
    
  )}
</div>
      {message && <div style={messageStyle}>{message}</div>}
      {/* 🔥 MOST POPULAR EVENT */}
{popularEvent && (
  <div style={{
    background: "linear-gradient(135deg, #d6e0ff, #ffffff)",
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "30px",
    color: "#1e293b",
    border: "1px solid #e2e8f0"
  }}>
    <h3 style={{ marginBottom: "10px", fontSize: "20px" }}>
       Most attended event
    </h3>

    <p style={{ fontWeight: "600" }}>{popularEvent.title}</p>

    <p style={{ fontSize: "13px" }}>
      {popularEvent.participants?.length || 0} registrations
    </p>

    <p style={{ fontSize: "13px", color: "#22c55e", fontWeight: "600" }}>
      {popularEvent.attendees?.length || 0} check-ins
    </p>
  </div>
)}
      {/* 📊 Stats */}
      <div style={analyticsGrid}>
        <div style={analyticsCard}
        onMouseEnter={(e) => {
  e.currentTarget.style.transform = "translateY(-6px) scale(1.02)";
  e.currentTarget.style.boxShadow = "0 18px 40px rgba(79,70,229,0.2)";}}
onMouseLeave={(e) => {
  e.currentTarget.style.transform = "translateY(0) scale(1)";
  e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.08)";}}>
  <h4>Total Events</h4>
  <p style={{ color: "#4f46e5", fontWeight: "700" }}>{totalEvents}</p>
</div>
  <div style={analyticsCard}
        onMouseEnter={(e) => {
  e.currentTarget.style.transform = "translateY(-6px) scale(1.02)";
  e.currentTarget.style.boxShadow = "0 18px 40px rgba(79,70,229,0.2)";}}
onMouseLeave={(e) => {
  e.currentTarget.style.transform = "translateY(0) scale(1)";
  e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.08)";}}>
    <h4>Total Registrations</h4>
    <p>{totalRegistrations}</p>
  </div>
<div style={analyticsCard}
        onMouseEnter={(e) => {
  e.currentTarget.style.transform = "translateY(-6px) scale(1.02)";
  e.currentTarget.style.boxShadow = "0 18px 40px rgba(79,70,229,0.2)";}}
onMouseLeave={(e) => {
  e.currentTarget.style.transform = "translateY(0) scale(1)";
  e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.08)";}}>
    <h4>Total Attendance</h4>
    <p>{totalAttendance}</p>
  </div>
<div style={analyticsCard}
        onMouseEnter={(e) => {
  e.currentTarget.style.transform = "translateY(-6px) scale(1.02)";
  e.currentTarget.style.boxShadow = "0 18px 40px rgba(79,70,229,0.2)";}}
onMouseLeave={(e) => {
  e.currentTarget.style.transform = "translateY(0) scale(1)";
  e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.08)";}}>
  <h4>Check-ins</h4>
  <p style={{
    color: "#22c55e",
    fontWeight: "700"
  }}>
    {totalCheckins}
  </p>
</div>
  <div style={analyticsCard}
        onMouseEnter={(e) => {
  e.currentTarget.style.transform = "translateY(-6px) scale(1.02)";
  e.currentTarget.style.boxShadow = "0 18px 40px rgba(79,70,229,0.2)";}}
onMouseLeave={(e) => {
  e.currentTarget.style.transform = "translateY(0) scale(1)";
  e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.08)";}}>
    <h4>Drop-off Rate</h4>
    <p style={{
  color:
    dropPercent > 50 ? "#ef4444" :
    dropPercent > 30 ? "#f59e0b" :
    "#22c55e",
  fontWeight: "600"
}}>
  {dropPercent}%
</p>
  </div>
<div style={analyticsCard}
        onMouseEnter={(e) => {
  e.currentTarget.style.transform = "translateY(-6px) scale(1.02)";
  e.currentTarget.style.boxShadow = "0 18px 40px rgba(79,70,229,0.2)";}}
onMouseLeave={(e) => {
  e.currentTarget.style.transform = "translateY(0) scale(1)";
  e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.08)";}}>
  <h4>Peak Check-in</h4>
  <p>{formatHour(peakHour)}</p>
</div>
<div style={analyticsCard}
        onMouseEnter={(e) => {
  e.currentTarget.style.transform = "translateY(-6px) scale(1.02)";
  e.currentTarget.style.boxShadow = "0 18px 40px rgba(79,70,229,0.2)";}}
onMouseLeave={(e) => {
  e.currentTarget.style.transform = "translateY(0) scale(1)";
  e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.08)";}}>
  <h4>Top Category</h4>
  <p style={{ textTransform: "capitalize" }}>
    {mostPopularCategory}
  </p>
</div>

<div style={analyticsCard}
        onMouseEnter={(e) => {
  e.currentTarget.style.transform = "translateY(-6px) scale(1.02)";
  e.currentTarget.style.boxShadow = "0 18px 40px rgba(79,70,229,0.2)";}}
onMouseLeave={(e) => {
  e.currentTarget.style.transform = "translateY(0) scale(1)";
  e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.08)";}}>
  <h4>Engagement</h4>
  <p style={{
    color:
      engagement > 70 ? "#22c55e" :
      engagement > 40 ? "#f59e0b" :
      "#ef4444",
    fontWeight: "600"
  }}>
    {engagement}%
  </p>
</div>
</div>
      {/* ================= STUDENT VIEW ================= */}

{/* 🔹 TAB 1: ALL EVENTS */}
{role === "student" && activeTab === "events" && (
  <>
    {/* 🔹 SECTION HEADING */}
    <h2 style={{
  marginTop: "30px",
  marginBottom: "15px",
  fontWeight: "700",
  color: "#1e293b",
  fontSize: "24px",}}>
      Available Events
    </h2>
    <select
  value={selectedCategory}
  onChange={(e) => setSelectedCategory(e.target.value)}
  style={{
    marginBottom: "15px",
    padding: "8px",
    borderRadius: "6px"
  }}
>
  <option value="">All Categories</option>
  <option value="technical">Technical</option>
  <option value="cultural">Cultural</option>
  <option value="workshop">Workshop</option>
  <option value="sports">Sports</option>
</select>
  <div style={eventsContainer}>
    {events
  .filter(event => {
    if (!selectedCategory) return true;
    return event.category === selectedCategory;
  })
  .filter(event => {
    if (!search.trim()) return true;

    return (
      event.title.toLowerCase().includes(search.toLowerCase()) ||
      event.venue.toLowerCase().includes(search.toLowerCase())
    );
  })
      .map(event => (
        <div
  key={event._id}
  style={eventCard}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = "scale(1.05)";
    e.currentTarget.style.boxShadow = "0 12px 30px rgba(99,102,241,0.15)";
    e.currentTarget.style.background = "linear-gradient(135deg, #ffffff 40%, #b8c8ff 100%)";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = "scale(1)";
    e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.06)";
    e.currentTarget.style.background = "linear-gradient(135deg, #ffffff 40%, #cedaff 100%)";
  }}
>
          <p style={{
  fontSize: "12px",
  fontWeight: "bold",
  marginBottom: "6px",
  color:
    getEventStatus(event) === "Upcoming" ? "#22c55e" :
    getEventStatus(event) === "Ongoing" ? "#f59e0b" :
    "#ef4444"
}}>
  {getEventStatus(event)}
</p>
  <h3 style={headingStyle}>{event.title}</h3>
          <p style={{
  display: "inline-block",
  padding: "4px 10px",
  fontSize: "11px",
  fontWeight: "600",
  background: "#eef2ff",
  color: "#4f46e5",
  borderRadius: "999px",
  marginBottom: "8px"
}}>
  {event.category}
</p>
  <p style={subText}>{event.description}</p>

    <p style={metaText}>
  <strong>Venue:</strong> {event.venue}
</p>
          <p style={{
  fontSize: "12px",
  fontWeight: "bold",
  color: getSeatStatus(event.seats).color
}}>
  {getSeatStatus(event.seats).text}
</p>
<div style={{
  height: "6px",
  background: "white",
border: "1px solid #e2e8f0",
color: "#1e293b",
  borderRadius: "4px",
  marginTop: "6px",
  overflow: "hidden"
}}>
  <div style={{
    width: `${Math.min(100, (event.participants?.length / event.seats) * 100)}%`,
    height: "100%",
    background: getSeatStatus(event.seats).color,
    transition: "0.3s"
  }} />
</div>
  <p style={{ color: "#1e293b", fontWeight: "500" }}>
  Seats: {event.seats}
</p>

          {/* Register button */}
          <button
  onClick={() => registerEvent(event._id)}
  disabled={event.participants?.some(p => p._id === userId)}
  style={{
    width: "100%",
    marginTop: "12px",
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    fontSize: "14px",
    fontWeight: "500",
    cursor: event.participants?.some(p => p._id === userId)
      ? "not-allowed"
      : "pointer",

    background: event.participants?.some(p => p._id === userId)
      ? "#94a3b8"   // 🔥 grey
      : "linear-gradient(135deg, #1e3a8a, #4f46e5)",

    color: "white",
    opacity: event.participants?.some(p => p._id === userId) ? 0.8 : 1
  }}
>
  {event.participants?.some(p => p._id === userId)
    ? "✔ Registered"
    : loading ? "Registering..." : "Register"}
</button>
        </div>
      ))}
  </div>
  </>
)}

{/* 🔹 TAB 2: MY REGISTRATIONS */}
{role === "student" && activeTab === "my" && (
  <>
    <h2 style={{
      marginTop: "30px",
      marginBottom: "15px",
      fontWeight: "700",
      color: "#1e293b",
      fontSize: "24px",
    }}>
      My Registrations
    </h2>
    <div style={eventsContainer}>
      {events
        .filter(e => e.participants?.some(p => p._id === userId))
        .map(event => (
          <div
            key={event._id}
            style={eventCard}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.05)";
              e.currentTarget.style.boxShadow = "0 12px 30px rgba(99,102,241,0.15)";
              e.currentTarget.style.background = "linear-gradient(135deg, #ffffff 40%, #b8c8ff 100%)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.06)";
              e.currentTarget.style.background = "linear-gradient(135deg, #ffffff 60%, #eef2ff 100%)";
            }}
          >
            <h3 style={headingStyle}>{event.title}</h3>
            <p style={{
  display: "inline-block",
  padding: "4px 10px",
  fontSize: "11px",
  fontWeight: "600",
  background: "#eef2ff",
  color: "#4f46e5",
  borderRadius: "999px",
  marginBottom: "8px"
}}>
  {event.category}
</p>
    <p style={subText}>{event.description}</p>
     <p style={metaText}>
  <strong>Venue:</strong> {event.venue}
</p>
            <p style={{
              fontSize: "12px",
              fontWeight: "bold",
              color: getSeatStatus(event.seats).color
            }}>
              {getSeatStatus(event.seats).text}
            </p>

            {/* progress bar */}
            <div style={{
              height: "6px",
              background: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "4px",
              marginTop: "6px",
              overflow: "hidden"
            }}>
              <div style={{
                width: `${Math.min(100, (event.participants?.length / event.seats) * 100)}%`,
                height: "100%",
                background: getSeatStatus(event.seats).color
              }} />
            </div>

            {/* 🔥 VIEW QR BUTTON */}
            <button
              onClick={() =>
                setShowQR(showQR === event._id ? null : event._id)
              }
              style={{
                marginTop: "10px",
                padding: "8px",
                width: "100%",
                border: "none",
                borderRadius: "6px",
                background: "#4f46e5",
                color: "white",
                cursor: "pointer"
              }}
            >
              {showQR === event._id ? "Hide QR" : "View QR"}
            </button>

            {/* 🔥 QR DISPLAY */}
            {showQR === event._id && (
  <div style={{ marginTop: "10px", textAlign: "center" }}>
    <img
      src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
        JSON.stringify({
          userId: userId,
          eventId: event._id
        })
      )}`}
      alt="QR"
      style={{ width: "140px" }}
    />
  </div>
)}
          </div>
        ))}
    </div>
  </>
)}
{/* ================= ORGANIZER VIEW ================= */}

{role === "organizer" && activeTab === "organizer" && (
  <div style={{ textAlign: "center", marginTop: "40px" }}>
    <h2 style={{
  marginTop: "30px",
  marginBottom: "15px",
  fontWeight: "600",
  color: "#1e293b"
}}>
  🛠 Organizer Panel
</h2>
<div style={{
  background: "white",
  padding: "25px",
  borderRadius: "14px",
  boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
  maxWidth: "320px",
  margin: "20px auto"
}}>
  <h3 style={{
    marginBottom: "15px",
    color: "#1e293b"
  }}>
    📷 Scan QR Code
  </h3>

  <div id="reader" style={{
    width: "100%",
    borderRadius: "10px",
    overflow: "hidden"
  }} />
</div>
{scanStatus && (
  <div style={{
    marginTop: "15px",
    padding: "10px",
    borderRadius: "8px",
    background: scanStatus === "success" ? "#dcfce7" : "#fee2e2",
    color: scanStatus === "success" ? "#166534" : "#991b1b",
    fontWeight: "500",
    border: "2px solid #4f46e5"
  }}>
    {message}
  </div>
)}


    {/* 🔹 CREATE EVENT FORM */}
    <div style={{ marginBottom: "30px" }}>
      <h2 style={{color:"#1e293b"}}>Create Event</h2>

      <input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={inputStyle}
      />

      <input
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        style={inputStyle}
      />

      <input
        placeholder="Venue"
        value={venue}
        onChange={(e) => setVenue(e.target.value)}
        style={inputStyle}
      />
      <input
  type="date"
  value={date}
  onChange={(e) => setDate(e.target.value)}
  style={inputStyle}
/>
      <input
        type="number"
        placeholder="Seats"
        value={seats}
        onChange={(e) => setSeats(e.target.value)}
        style={inputStyle}
      />
<select
  value={category}
  onChange={(e) => setCategory(e.target.value)}
  style={inputStyle}
>
  <option value="">Select Category</option>
  <option value="technical">Technical</option>
  <option value="cultural">Cultural</option>
  <option value="workshop">Workshop</option>
  <option value="sports">Sports</option>
</select>
      <button
  onClick={async () => {
    if (editEventId) {
      const res = await fetch(`http://127.0.0.1:3001/api/events/${editEventId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          title,
          description,
          venue,
          date: date || undefined,
          seats: Number(seats),
          category
        })
      });

      const data = await res.json();
      console.log("UPDATED:", data);
console.log("CATEGORY VALUE:", category);
      await fetchEvents();
      if (role === "organizer") await fetchOrganizerEvents();

      setEditEventId(null);
    } else {
      await handleCreateEvent();
    }

    // reset form
    setTitle("");
    setDescription("");
    setVenue("");
    setDate("");
    setSeats("");
    setCategory("")
  }}
  style={primaryBtn}
>
  {editEventId ? "Update Event" : "Create Event"}
</button>
    </div>
    <div style={{
  display: "flex",
  justifyContent: "center",
  marginTop: "30px"
}}>
  <div style={{
    width: "600px",
    padding: "20px",
    background: "linear-gradient(135deg, #ffffff, #eef2ff)",
    borderRadius: "12px",
    boxShadow: "0 10px 30px rgba(79,70,229,0.15)"
  }}>
    <h3 style={{
  textAlign: "center",
  fontWeight: "700",
  color: "#1e293b",
  letterSpacing: "-0.3px"
}}>
  📊 Event Analytics
</h3>

    <div style={{ height: "300px" }}>
      <Bar 
        data={{
          labels: topEvents.map(e =>
  e.title.length > 12 ? e.title.slice(0, 12) + "…" : e.title
),
          datasets: [
  {
    label: "Registrations",
    data: events.map(e => e.participants?.length || 0),
    backgroundColor: (context) => {
      const chart = context.chart;
      const { ctx, chartArea } = chart;

      if (!chartArea) return;

      const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
      gradient.addColorStop(0, "#6366f1");
      gradient.addColorStop(1, "#8b9ef8");

      return gradient;
    },
    borderRadius: 4
  },
  {
    label: "Check-ins",
    data: events.map(e => e.attendees?.length || 0),
    backgroundColor: (context) => {
      const chart = context.chart;
      const { ctx, chartArea } = chart;

      if (!chartArea) return;

      const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
      gradient.addColorStop(0, "#22c55e");
      gradient.addColorStop(1, "#86efac");

      return gradient;
    },
    borderRadius: 4
  }
]
        }}
        options={{
  maintainAspectRatio: false,

  layout: {
    padding: {
      top: 10,
      bottom: 10
    }
  },

  plugins: {
    tooltip: {
      callbacks: {
        title: (tooltipItems) => {
          const index = tooltipItems[0].dataIndex;
          return topEvents[index].title;
        }
      }
    },

    legend: {
      labels: {
        color: "#1e293b",
        font: {
          weight: "600",
          size: 13
        }
      }
    }
  },

  scales: {
    x: {
      ticks: {
        color: "#334155",
        font: {
          size: 11,
          weight: "500"
        },
        maxRotation: 0,   // 🔥 remove tilt
        minRotation: 0
      },
      grid: {
        display: false
      }
    },

    y: {
      ticks: {
        color: "#334155",
        font: {
          size: 12
        }
      },
      grid: {
        color: "rgba(0,0,0,0.06)"
      }
    }
  },

  categoryPercentage: 0.6,  // 🔥 spacing between groups
  barPercentage: 0.7        // 🔥 thickness of bars
}}
/>
    </div>
  </div>
</div>
    {/* 🔹 ORGANIZER EVENTS LIST */}
    <h2 style={{color:"#1e293b",marginTop:"30px"}}>Your Events</h2>

    <div style={eventsContainer}>
      {displayedOrganizerEvents.length > 0 ? (
        displayedOrganizerEvents.map(event => (
          <div
  key={event._id}
  style={eventCard}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = "scale(1.05)";
    e.currentTarget.style.boxShadow = "0 12px 30px rgba(99,102,241,0.15)";
    e.currentTarget.style.background = "linear-gradient(135deg, #ffffff 40%, #b8c8ff 100%)";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = "scale(1)";
    e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.06)";
    e.currentTarget.style.background = "linear-gradient(135deg, #ffffff 60%, #eef2ff 100%)";
  }}
>
            <p style={{
  fontSize: "12px",
  fontWeight: "bold",
  marginBottom: "6px",
  color:
    getEventStatus(event) === "Upcoming" ? "#22c55e" :
    getEventStatus(event) === "Ongoing" ? "#f59e0b" :
    "#ef4444"
}}>
  {getEventStatus(event)}
</p>
            <h3 style={headingStyle}>{event.title}</h3>
            <p style={{
  display: "inline-block",
  padding: "4px 10px",
  fontSize: "11px",
  fontWeight: "600",
  background: "#eef2ff",
  color: "#4f46e5",
  borderRadius: "999px",
  marginBottom: "8px"
}}>
  {event.category}
</p>
<p style={subText}>{event.description}</p>

 <p style={metaText}>
  Participants: {event.participants?.length || 0}
</p>
  <p style={metaText}>
  Attendance: {event.attendees?.length || 0} / {event.participants.length}
</p>
<div style={{
  height: "6px",
  background: "#e2e8f0",
  borderRadius: "4px",
  marginBottom: "10px",
  overflow: "hidden"
}}>
  <div style={{
    width: `${event.participants.length === 0 ? 0 : (event.attendees?.length / event.participants.length) * 100}%`,
    height: "100%",
    background: "#22c55e"
  }} />
</div>
            <button
  onClick={() =>
    setShowParticipants(showParticipants === event._id ? null : event._id)
  }
  
  style={{
    marginTop: "8px",
    padding: "6px",
    width: "100%",
    borderRadius: "6px",
    border: "none",
    background: "linear-gradient(135deg, #1e3a8a, #4f46e5)",
    color: "white",
    cursor: "pointer"
  }}
>
  
  {showParticipants === event._id ? "Hide Participants" : "View Participants"}
</button>

{showParticipants === event._id && (
  <div style={{ marginTop: "10px", textAlign: "left" }}>
{event.participants && event.participants.length > 0 ? (
  <>
    {event.participants.map((p, i) => {
  const attendee = event.attendees?.find(
    a => a.user._id === p._id
  );

  const isCheckedIn = !!attendee;

  return (
    <div key={i} style={{
      fontSize: "13px",
      marginBottom: "6px",
      padding: "6px",
      borderRadius: "6px",
      background: isCheckedIn ? "#ecfdf5" : "#fef2f2"
    }}>
      👤 {p.name} ({p.email})

      <span style={{
        marginLeft: "8px",
        fontWeight: "600",
        color: isCheckedIn ? "#22c55e" : "#ef4444"
      }}>
        {isCheckedIn ? "✔ Checked-in" : "❌ Not checked-in"}
      </span>

      {/* 🔥 NEW: TIME */}
      {isCheckedIn && (
        <div style={{
          fontSize: "11px",
          color: "#64748b",
          marginTop: "2px"
        }}>
          🕒 {new Date(attendee.checkedInAt).toLocaleString()}
        </div>
      )}
    </div>
  );
})}
  </>
) : (
  <p style={{ fontSize: "12px" }}>
    No participants yet
  </p>
)}
  </div>
)}
<button
  onClick={() => {
    setEditEventId(event._id);

    // preload values into form
    setTitle(event.title);
    setDescription(event.description);
    setVenue(event.venue);
    setDate(event.date ? event.date.split("T")[0] : "");
    setSeats(event.seats);
  }}
  style={{
    marginTop: "10px",
    padding: "8px",
    width: "100%",
    border: "none",
    borderRadius: "6px",
    background: "#f59e0b",
    color: "white",
    cursor: "pointer"
  }}
>
  Edit Event
</button>{/* Delete button */}
  <button
   onClick={() => deleteEvent(event._id)}
   style={{
    marginTop: "10px",padding: "8px",width: "100%",border: "none",borderRadius: "6px",background: "#dc2626",color: "white",cursor: "pointer"
       }}
    >Delete Event
     </button>
        </div>
        ))
      ) : (
        <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: "#334155" }}>
          <p style={{ fontSize: "18px", fontWeight: "600" }}>
            No events created by you yet.
          </p>
          <p style={{ color: "#1e293b" }}>
            Add a new event above to see it appear in the organizer panel.
          </p>
        </div>
      )}
    </div>
  </div>
)}
    </div>
    </div>
    </div>
  );
}
// 🔹 STYLES (UNCHANGED)
const sidebar = {
  width: "220px",
  height: "100vh",
  background: "linear-gradient(180deg, #1e3a8a, #645cff)",
  color: "white",
  padding: "20px",
  display: "flex",
  flexDirection: "column",
  gap: "15px",
  position: "sticky",
  top: 0,
};
const navBtn = {
  padding: "10px",
  border: "none",
  background: "rgba(255,255,255,0.1)",
  color: "white",
  textAlign: "left",
  cursor: "pointer",
  borderRadius: "8px",
  transition: "0.2s"
};
const contentArea = {
  flex: 1,
  padding: "30px",
  background: "linear-gradient(135deg, #c7d2fe, #e0e7ff)",
  minHeight: "100vh",
  fontFamily: "'Inter', 'Segoe UI', sans-serif",
};
const topBar = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px"
};
const headingStyle = {
  fontSize: "20px",
  fontWeight: "600",
  color: "#0f172a",
  letterSpacing: "-0.4px",
  lineHeight: "1.3"
};
const subText = {
  fontSize: "14px",
  color: "#0f172a",
  lineHeight: "1.5"
};

const metaText = {
  fontSize: "12px",
  color: "#0f172a",
  fontWeight: "500"
};
const topSearch = {
  padding: "10px",
  width: "300px",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  background: "white",
  color: "#1e293b"
};
const analyticsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)", // 🔥 4 per row
  gap: "20px",
  marginTop: "30px"
};
const analyticsCard = {
  background: "linear-gradient(135deg, #ffffff, #eef2ff)",
  padding: "20px",
  borderRadius: "14px",
  textAlign: "center",
  boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
  color: "#1e293b",
  transition: "all 0.25s ease",
  border: "1px solid rgba(99,102,241,0.1)",
  cursor: "pointer"
};
const hero = {
  background: "linear-gradient(135deg, #1e3a8a, #4f46e5)",
  color: "white",
  padding: "30px",
  borderRadius: "16px",
  marginBottom: "30px"
};

const heroBtnPrimary = {
  padding: "10px 20px",
  borderRadius: "8px",
  border: "none",
  background: "white",
  color: "#1e3a8a",
  cursor: "pointer"
};

const heroBtnSecondary = {
  padding: "10px 20px",
  borderRadius: "8px",
  border: "1px solid white",
  background: "transparent",
  color: "white",
  cursor: "pointer"
};
const logoutBtnSidebar = {
  marginTop: "auto",
  padding: "10px",
  background: "#ef4444",
  border: "none",
  borderRadius: "6px",
  color: "white",
  cursor: "pointer"
};
const mainContainer = {
  padding: "40px 0",
  background: "linear-gradient(135deg, #c7d2fe, #e0e7ff)",
color: "#1e293b",
  minHeight: "100vh",
  
  lineHeight: "1.6",
};

const loginContainer = {
  height: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "#f8fafc",
  color: "white"
};

const loginBox = {
  background: "white",
border: "1px solid #e2e8f0",
color: "#1e293b",
  padding: "30px",
  borderRadius: "12px",
  width: "300px",
  textAlign: "center"
};
const eventsContainer = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 280px))",
  justifyContent: "center",
  gap: "30px",
  marginTop: "10px"
};
const primaryBtn = {
  padding: "12px",
  borderRadius: "10px",
  border: "none",
  marginTop: "20px",
  background: "linear-gradient(135deg, #1e3a8a, #4f46e5)",
  color: "white",
  cursor: "pointer",
  fontSize: "14px",
fontWeight: "600",
letterSpacing: "0.3px",
  transition: "all 0.2s ease"
};
const eventCard = {
  padding: "20px",
  borderRadius: "16px",
  background: "rgba(255, 255, 255, 0.75)",   // 🔥 glass feel
  backdropFilter: "blur(10px)",              // 🔥 premium effect
  WebkitBackdropFilter: "blur(10px)",
  boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
  border: "1px solid rgba(255,255,255,0.3)",
  transition: "all 0.3s ease",
  color: "#1e293b"
};
const inputStyle = {
  width: "100%",
  padding: "10px",
  marginTop: "10px",
  borderRadius: "6px",
  border: "1px solid #e2e8f0",
background: "white",
color: "#1e293b",
};

const loginBtn = {
  marginTop: "15px",
  padding: "10px",
  width: "100%",
  borderRadius: "6px",
  border: "none",
  background: "linear-gradient(135deg, #1e3a8a, #4f46e5)",
  color: "white"
};
const messageStyle = {
  textAlign: "center",
  marginBottom: "20px",
  color: "#22c55e",
  fontWeight: "bold"
};
const tabBtn = (active) => ({
  padding: "10px 20px",
  borderRadius: "8px",
  border: "none",
  background: active ? "#4f46e5" : "#e2e8f0",
color: active ? "white" : "#1e293b",
  cursor: "pointer",
  transition: "0.2s"
});

export default App;