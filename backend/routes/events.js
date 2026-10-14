const express = require("express");
const Event = require("../models/Event");

const router = express.Router();

// Receive and validate one tracked event.
router.post("/", async (req, res, next) => {
  try {
    const { session_id, event_type, page_url, timestamp, click_x, click_y } = req.body || {};

    if (!session_id || typeof session_id !== "string" || session_id.length > 200) {
      return res.status(400).json({ error: "A valid session_id is required." });
    }
    if (!["page_view", "click"].includes(event_type)) {
      return res.status(400).json({ error: "event_type must be page_view or click." });
    }
    if (!page_url || typeof page_url !== "string" || page_url.length > 2048) {
      return res.status(400).json({ error: "A valid page_url is required." });
    }
    const parsedDate = timestamp ? new Date(timestamp) : new Date();
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: "timestamp must be a valid date." });
    }

    const event = {
      session_id: session_id.trim(),
      event_type,
      page_url: page_url.trim(),
      timestamp: parsedDate
    };

    if (event_type === "click") {
      if (!Number.isFinite(click_x) || !Number.isFinite(click_y) || click_x < 0 || click_y < 0) {
        return res.status(400).json({ error: "Click events require non-negative click_x and click_y." });
      }
      event.click_x = click_x;
      event.click_y = click_y;
    }

    const saved = await Event.create(event);
    return res.status(201).json({ message: "Event stored successfully.", event: saved });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
