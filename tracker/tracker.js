(() => {
  const API_URL = window.location.origin + "/api/events";
  const SESSION_KEY = "ua_session_id";

  function getSessionId() {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = "session_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  }

  function sendEvent(eventType, data = {}) {
    const payload = {
      sessionId: getSessionId(),
      eventType: eventType,
      pageUrl: window.location.href,
      timestamp: new Date().toISOString(),
     ...data
    };

    fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(() => {});
  }

  // Page view
  sendEvent("page_view");

  // Click tracking
  document.addEventListener("click", (e) => {
    sendEvent("click", {
      x: e.clientX,
      y: e.clientY
    });
  });

  console.log("[Analytics] Tracker ready ->", API_URL);
})();
