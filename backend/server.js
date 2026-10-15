require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const Event = require("./models/Event");
const eventRoutes = require("./routes/events");

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors({
  origin: process.env.CLIENT_ORIGIN
    ? process.env.CLIENT_ORIGIN.split(",").map((value) => value.trim())
    : true
}));
app.use(express.json({ limit: "32kb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", database: mongoose.connection.readyState === 1 ? "connected" : "disconnected" });
});

app.use("/api/events", eventRoutes);

// Sessions with total event count and last recorded activity.
app.get("/api/sessions", async (_req, res, next) => {
  try {
    const sessions = await Event.aggregate([
      {
        $group: {
          _id: "$session_id",
          total_events: { $sum: 1 },
          page_views: { $sum: { $cond: [{ $eq: ["$event_type", "page_view"] }, 1, 0] } },
          clicks: { $sum: { $cond: [{ $eq: ["$event_type", "click"] }, 1, 0] } },
          last_activity: { $max: "$timestamp" }
        }
      },
      { $sort: { last_activity: -1 } },
      { $limit: 500 }
    ]);
    res.json(sessions.map((session) => ({
      session_id: session._id,
      total_events: session.total_events,
      page_views: session.page_views,
      clicks: session.clicks,
      last_activity: session.last_activity
    })));
  } catch (error) {
    next(error);
  }
});

// Ordered user journey for a particular session.
app.get("/api/sessions/:sessionId/events", async (req, res, next) => {
  try {
    const events = await Event.find({ session_id: req.params.sessionId })
      .sort({ timestamp: 1, _id: 1 })
      .limit(2000)
      .lean();
    res.json(events);
  } catch (error) {
    next(error);
  }
});

// Click points for the selected page URL.
app.get("/api/heatmap", async (req, res, next) => {
  try {
    const pageUrl = req.query.url;
    if (!pageUrl || typeof pageUrl !== "string") {
      return res.status(400).json({ error: "Provide a page URL using ?url=..." });
    }
    const clicks = await Event.find({
      page_url: pageUrl,
      event_type: "click",
      click_x: { $exists: true },
      click_y: { $exists: true }
    })
      .select("session_id page_url timestamp click_x click_y")
      .sort({ timestamp: -1 })
      .limit(5000)
      .lean();
    res.json(clicks);
  } catch (error) {
    next(error);
  }
});

// Make the demo available from the backend origin, avoiding file:// CORS issues.
const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 10000;

const demoPath = path.resolve(__dirname, '../demo');
const trackerPath = path.resolve(__dirname, '../tracker');

console.log("Demo path:", demoPath);
console.log("Tracker path:", trackerPath);

app.use("/demo", express.static(demoPath));
app.use("/tracker", express.static(trackerPath));

app.get("/demo", (req, res) => {
  res.sendFile(path.join(demoPath, "index.html"));
});

app.get("/tracker/tracker.js", (req, res) => {
  res.sendFile(path.join(trackerPath, "tracker.js"));
});

app.get("/", (req, res) => {
  res.redirect("/demo");
});

// API routes tere jo bhi hain wo iske neeche rehne de
// ...

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "Something went wrong while processing the request." });
});

async function start() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing. Copy .env.example to .env and configure it.");
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");
    app.listen(PORT, () => console.log(`API running at http://localhost:${PORT}`));
  } catch (error) {
    console.error("Could not start server:", error.message);
    process.exit(1);
  }
}

start();
