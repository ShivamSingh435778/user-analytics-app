(function () {
  "use strict";

  // This script is intentionally dependency-free so it can be added to a page.
  const API_URL = window.USER_ANALYTICS_API_URL || "http://localhost:5000/api/events";
  const SESSION_KEY = "user_analytics_session_id";

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return "session-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
  }

  function getSessionId() {
    let id = window.localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = createId();
      window.localStorage.setItem(SESSION_KEY, id);
    }
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

    // Keep tracking failures from interrupting the host website.
    fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(function (error) {
      console.warn("[User Analytics] Event could not be sent:", error.message);
    });
  }

  // One page_view per script load/page load.
  sendEvent("page_view");

  document.addEventListener("click", function (event) {
    sendEvent("click", {
      x: Math.max(0, Math.round(event.clientX)),
      y: Math.max(0, Math.round(event.clientY))
    });
  }, true);

  // Optional tiny API for manual testing.
  window.userAnalytics = {
    getSessionId: getSessionId,
    trackPageView: function () { sendEvent("page_view"); }
  };
})();
