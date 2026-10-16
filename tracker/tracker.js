
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
    const sid = getSessionId();
    const payload = {
      // backend ke liye dono format bhej rahe hain
      session_id: sid,
      sessionId: sid,
      eventType: eventType,
      event_type: eventType,
      pageUrl: window.location.href,
      page_url: window.location.href,
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
    }).catch(()=>{});
  }

  sendEvent("page_view");

  document.addEventListener("click", (e) => {
    sendEvent("click", {
      x: e.clientX,
      y: e.clientY,
      clickData: { x: e.clientX, y: e.clientY }
    });
  });

  console.log("[Analytics] Tracker ready ->", API_URL);
})();
