const express = require("express");
const router = express.Router();
const Event = require("../models/Event");

// POST /api/events - save event (click, page_view etc)
router.post("/", async (req, res, next) => {
  try {
    const { session_id, event_type, type, page_url, click_x, click_y, timestamp } = req.body;

    const finalType = event_type || type;
    if (!session_id ||!finalType) {
      return res.status(400).json({ error: "session_id and event_type required" });
    }

    const event = await Event.create({
      session_id,
      event_type: finalType,
      page_url: page_url || req.headers.referer || "",
      click_x: click_x?? null,
      click_y: click_y?? null,
      timestamp: timestamp? new Date(timestamp) : new Date(),
    });

    res.status(201).json(event);
  } catch (e) { next(e); }
});

// GET /api/events - for heatmap testing
router.get("/", async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 200;
    const events = await Event.find()
     .sort({ timestamp: -1 })
     .limit(limit)
     .lean();
    res.json({ events });
  } catch (e) { next(e); }
});
// DELETE /api/events - clear all for demo
router.delete("/", async (req, res, next) => {
  try {
    await Event.deleteMany({});
    res.json({ message: "All events cleared" });
  } catch (e) { next(e); }
});
module.exports = router;
