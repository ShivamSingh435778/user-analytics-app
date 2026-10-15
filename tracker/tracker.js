(function () {
  "use strict";
  const API_URL = window.USER_ANALYTICS_API_URL || window.location.origin + "/api/events";
  const SESSION_KEY = "user_analytics_session_id";

  function createId() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return "session-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
  }
  function getSessionId() {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) { id = createId(); localStorage.setItem(SESSION_KEY, id); }
    return id;
  }
  function sendEvent(eventType, coordinates) {
    const payload = {
      session_id: getSessionId(),
      event_type: eventType,
      page_url: window.location.href,
      timestamp: new Date().toISOString()
    };
    if (eventType === "click" && coordinates) {
      payload.click_x = coordinates.x;
      payload.click_y = coordinates.y;
    }
    fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(e => console.warn("[Analytics] fail:", e.message));
  }
  sendEvent("page_view");
  document.addEventListener("click", function (e) {
    sendEvent("click", { x: Math.round(e.clientX), y: Math.round(e.clientY) });
  }, true);
  window.userAnalytics = { getSessionId: getSessionId };
})();
