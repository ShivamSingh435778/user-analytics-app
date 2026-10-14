const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    session_id: { type: String, required: true, index: true, trim: true },
    event_type: { type: String, required: true, enum: ["page_view", "click"], index: true },
    page_url: { type: String, required: true, trim: true, maxlength: 2048, index: true },
    timestamp: { type: Date, required: true, index: true },
    click_x: { type: Number, min: 0 },
    click_y: { type: Number, min: 0 }
  },
  { versionKey: false }
);

eventSchema.index({ session_id: 1, timestamp: 1 });
eventSchema.index({ page_url: 1, event_type: 1 });

module.exports = mongoose.model("Event", eventSchema);
