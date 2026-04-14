import { useState } from "react";

function Login({ onLogin }) {
  const [activeTab, setActiveTab] = useState("login");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");

  // 🔐 LOGIN
  const handleLogin = async () => {
  if (!email || !password) {
    setMessage("Email and password required");
    return;
  }

  try {
    const res = await fetch("http://127.0.0.1:3001/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (data._id && data.token) {
      localStorage.setItem("user", JSON.stringify(data));
      localStorage.setItem("token", data.token);
      onLogin(data);
    } else {
      setMessage(data.message || "Login failed");
    }

  } catch (err) {
    setMessage("Server error");
  }
};
  // 🆕 SIGNUP
 const handleSignup = async () => {
  if (!name || !email || !password) {
    setMessage("All fields required");
    return;
  }

  try {
    const res = await fetch("http://127.0.0.1:3001/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, email, password, role })
    });

    const data = await res.json();

    if (data._id) {
      setMessage("Signup successful, please login");
      setActiveTab("login");
    } else {
      setMessage(data.message || "Signup failed");
    }

  } catch (err) {
    setMessage("Server error");
  }
};
  return (
    <div style={container}>
      {/* 🔵 LEFT PANEL */}
      <div style={leftPanel}>
        <h1 style={title}>Campus EventHub</h1>
        <p style={subtitle}>
          Discover, register, and manage campus events seamlessly.
        </p>

        <div style={featureBox}>
          <h4>🎯 Smart Event Discovery</h4>
          <p>Find events based on availability and interest.</p>
        </div>

        <div style={featureBox}>
          <h4>⚡ Real-time Registration</h4>
          <p>Instant updates on seats and participation.</p>
        </div>
      </div>

      {/* ⚪ RIGHT PANEL */}
      <div style={rightPanel}>
        <h1 style={{ color: "#1e3a8a",fontWeight:"bold" }}>Welcome</h1>

        {/* 🔹 Tabs */}
        <div style={tabContainer}>
          <button
            onClick={() => setActiveTab("login")}
            style={activeTab === "login" ? activeTabStyle : tabStyle}
          >
            Login
          </button>
          <button
            onClick={() => setActiveTab("signup")}
            style={activeTab === "signup" ? activeTabStyle : tabStyle}
          >
            Sign Up
          </button>
        </div>

        {/* 🔹 ROLE SELECT */}
        {activeTab === "signup" && (
  <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
    <button
      onClick={() => setRole("student")}
      style={role === "student" ? roleActive : roleBtn}
    >
      🎓 Student
    </button>

    <button
      onClick={() => setRole("organizer")}
      style={role === "organizer" ? roleActive : roleBtn}
    >
      🛠 Organizer
    </button>
  </div>
)}

        {/* 🔹 SIGNUP */}
        {activeTab === "signup" && (
          <input
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={input}
          />
        )}

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={input}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={input}
        />
        {message && (
  <p style={{ marginTop: "10px", color: "red" }}>
    {message}
  </p>
)}

        {/* 🔹 ACTION BUTTON */}
        {activeTab === "login" ? (
          <button onClick={handleLogin} style={mainBtn}>
            Sign In to Dashboard →
          </button>
        ) : (
          <button onClick={handleSignup} style={mainBtn}>
            Create Account →
          </button>
        )}
      </div>
    </div>
  );
}

/* 🔥 STYLES */

const container = {
  display: "flex",
  height: "100vh"
};

const leftPanel = {
  flex: 1,
  background: "linear-gradient(135deg, #1e3a8a, #4f46e5)",
  color: "white",
  padding: "60px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center"
};

const rightPanel = {
  flex: 1,
  background: "linear-gradient(135deg, #cfd9fc, #7091ff)",
  
  padding: "60px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center"
};

const title = {
  fontSize: "42px",
  fontWeight: "700"
};

const subtitle = {
  marginTop: "20px",
  opacity: 0.8
};

const featureBox = {
  marginTop: "20px",
  background: "rgba(255,255,255,0.1)",
  padding: "15px",
  borderRadius: "10px"
};

const tabContainer = {
  display: "flex",
  gap: "10px",
  marginTop: "20px"
};

const tabStyle = {
  padding: "8px 16px",
  border: "none",
  background: "#618bff",
  cursor: "pointer",
  borderRadius: "6px"
};

const activeTabStyle = {
  ...tabStyle,
  background: "#1e3a8a",
  color: "white"
};

const roleBtn = {
  flex: 1,
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  background: "white",
  color: "#1e3a8a",
  fontWeight: "600"
};

const roleActive = {
  ...roleBtn,
  border: "2px solid #1e3a8a",
  background: "#1e3a8a",
  color: "white"
};

const input = {
  marginTop: "15px",
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #ccc"
};

const mainBtn = {
  marginTop: "20px",
  padding: "14px",
  borderRadius: "8px",
  border: "none",
  background: "#1e3a8a",
  color: "white",
  cursor: "pointer"
};

export default Login;