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

  function sendEvent(eventType, extra = {}) {
    const payload = {
      sessionId: getSessionId(),
      eventType: eventType,
      pageUrl: window.location.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
     ...extra
    };

    fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(() => {});
  }

  // page view
  sendEvent("page_view");

  // click tracking - x,y ko clickData me bhejna hai
  document.addEventListener("click", (e) => {
    sendEvent("click", {
      clickData: { x: e.clientX, y: e.clientY }
    });
  });

  console.log("[Analytics] Tracker ready ->", API_URL);
})();
