import React, {useCallback, useEffect, useMemo, useState} from "react";
import {
  Activity, ArrowDownRight, ArrowUpRight, BarChart3, Clock3, ExternalLink,
  Eye, MousePointer2, RefreshCw, Search, Users, X
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

function shortId(value = "") {
  return value.length > 18 ? `${value.slice(0, 8)}…${value.slice(-5)}` : value;
}
function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}
function relativeTime(value) {
  if (!value) return "—";
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
function pageLabel(url = "") {
  try {
    const parsed = new URL(url);
    return parsed.pathname === "/" ? parsed.host + " /" : parsed.host + parsed.pathname;
  } catch {
    return url || "Unknown page";
  }
}

function StatCard({ icon: Icon, label, value, detail, tone }) {
  return <article className={`stat-card ${tone}`}>
    <div className="stat-top"><span>{label}</span><span className="stat-icon"><Icon size={18} /></span></div>
    <div className="stat-value">{value}</div>
    <div className="stat-detail">{detail}</div>
  </article>;
}

function EmptyState({ title, text }) {
  return <div className="empty-state"><div className="empty-icon"><Activity size={22} /></div><strong>{title}</strong><p>{text}</p></div>;
}

export default function App() {
  const [sessions, setSessions] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [heatmapUrl, setHeatmapUrl] = useState("");
  const [clicks, setClicks] = useState([]);
  const [activeTab, setActiveTab] = useState("sessions");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const loadSessions = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/sessions`);
      if (!response.ok) throw new Error(`API returned ${response.status}. Is the backend running?`);
      const data = await response.json();
      setSessions(data);
      setLastUpdated(new Date());
      setSelectedSession((current) => current && data.some((s) => s.session_id === current) ? current : (data[0]?.session_id || ""));
      const urls = [...new Set(data.flatMap((s) => []))];
      void urls;
    } catch (err) {
      setError(`${err.message}. Start the backend and make sure MongoDB is connected.`);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  const loadSessionEvents = useCallback(async (sessionId) => {
    if (!sessionId) { setEvents([]); return; }
    setEventsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/sessions/${encodeURIComponent(sessionId)}/events`);
      if (!response.ok) throw new Error("Could not load this session's events.");
      setEvents(await response.json());
    } catch (err) {
      setError(err.message);
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  }, []);

  const loadHeatmap = useCallback(async (url) => {
    if (!url) { setClicks([]); return; }
    try {
      const response = await fetch(`${API_BASE}/heatmap?url=${encodeURIComponent(url)}`);
      if (!response.ok) throw new Error("Could not load click data.");
      setClicks(await response.json());
    } catch (err) {
      setError(err.message);
      setClicks([]);
    }
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);
  useEffect(() => { loadSessionEvents(selectedSession); }, [selectedSession, loadSessionEvents]);
  useEffect(() => { loadHeatmap(heatmapUrl); }, [heatmapUrl, loadHeatmap]);

  const allEvents = sessions.reduce((sum, session) => sum + session.total_events, 0);
  const totalClicks = sessions.reduce((sum, session) => sum + session.clicks, 0);
  const totalPageViews = sessions.reduce((sum, session) => sum + session.page_views, 0);
  const filteredSessions = sessions.filter((session) => {
    const term = search.toLowerCase().trim();
    return !term || session.session_id.toLowerCase().includes(term);
  });
  const selected = sessions.find((session) => session.session_id === selectedSession);
  const knownPages = useMemo(() => {
    const fromEvents = events.map((event) => event.page_url);
    return [...new Set([...fromEvents, ...(heatmapUrl ? [heatmapUrl] : [])])];
  }, [events, heatmapUrl]);

  // The heatmap dots are plotted on a representative canvas. Coordinates are viewport-relative,
  // as collected by tracker.js; this visual is a simple click-density aid, not a page screenshot.
  const dotStyle = (click) => ({
    left: `${Math.min(100, Math.max(0, (click.click_x / 1440) * 100))}%`,
    top: `${Math.min(100, Math.max(0, (click.click_y / 900) * 100))}%`
  });

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><BarChart3 size={21} /></div><div><strong>insightly</strong><span>USER ANALYTICS</span></div></div>
      <div className="workspace-label">WORKSPACE</div>
      <button className={`nav-item ${activeTab === "sessions" ? "active" : ""}`} onClick={() => setActiveTab("sessions")}><Users size={18} /> Sessions <span className="nav-count">{sessions.length}</span></button>
      <button className={`nav-item ${activeTab === "heatmap" ? "active" : ""}`} onClick={() => setActiveTab("heatmap")}><MousePointer2 size={18} /> Click heatmap</button>
      <div className="sidebar-bottom"><div className="status-dot" /><div><strong>Analytics API</strong><span>Local development</span></div></div>
    </aside>

    <main className="main-content">
      <header className="topbar">
        <div className="breadcrumb">Workspace <span>/</span> <strong>{activeTab === "sessions" ? "Sessions overview" : "Click heatmap"}</strong></div>
        <div className="topbar-right"><span className="live-badge"><i /> Local data</span><button className="icon-button" aria-label="Refresh data" onClick={() => { loadSessions(); if (selectedSession) loadSessionEvents(selectedSession); if (heatmapUrl) loadHeatmap(heatmapUrl); }}><RefreshCw size={17} /></button><div className="avatar">S</div></div>
      </header>

      <section className="page-heading">
        <div><div className="eyebrow">PRODUCT ANALYTICS <span>•</span> OVERVIEW</div><h1>{activeTab === "sessions" ? "Good data starts here." : "Click heatmap"}</h1><p>{activeTab === "sessions" ? "Understand how visitors move through your website, one session at a time." : "Explore where visitors clicked on a selected page."}</p></div>
        <div className="updated"><Clock3 size={14} /> Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
      </section>

      {error && <div className="error-banner"><div><strong>Couldn’t load live data</strong><span>{error}</span></div><button onClick={() => { setError(""); loadSessions(); }}><RefreshCw size={15} /> Retry</button></div>}

      <section className="stats-grid">
        <StatCard icon={Users} label="Total sessions" value={sessions.length.toLocaleString()} detail="Unique browser sessions" tone="purple" />
        <StatCard icon={Activity} label="Total events" value={allEvents.toLocaleString()} detail="All tracked interactions" tone="blue" />
        <StatCard icon={Eye} label="Page views" value={totalPageViews.toLocaleString()} detail="Pages opened by visitors" tone="green" />
        <StatCard icon={MousePointer2} label="Total clicks" value={totalClicks.toLocaleString()} detail="Tracked click interactions" tone="orange" />
      </section>

      {activeTab === "sessions" ? <section className="content-grid">
        <article className="panel sessions-panel">
          <div className="panel-heading"><div><h2>Visitor sessions</h2><p>A session is identified by a browser-stored ID.</p></div><span className="count-pill">{sessions.length} sessions</span></div>
          <div className="table-toolbar"><div className="search-box"><Search size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search session ID..." /></div><button className="subtle-button" onClick={() => loadSessions()}><RefreshCw size={14} /> Refresh</button></div>
          <div className="table-wrap"><table><thead><tr><th>SESSION</th><th>EVENTS</th><th>PAGE VIEWS</th><th>LAST ACTIVE</th><th></th></tr></thead><tbody>
            {loading ? <tr><td colSpan="5"><div className="table-message">Loading sessions…</div></td></tr> :
              filteredSessions.length ? filteredSessions.map((session) => <tr key={session.session_id} onClick={() => setSelectedSession(session.session_id)} className={selectedSession === session.session_id ? "selected-row" : ""}>
                <td><div className="session-cell"><span className="session-avatar">{session.session_id.slice(0, 1).toUpperCase()}</span><div><strong>{shortId(session.session_id)}</strong><small>{session.session_id}</small></div></div></td>
                <td><span className="event-number">{session.total_events}</span></td><td>{session.page_views}</td><td><span className="last-active">{relativeTime(session.last_activity)}</span><small className="date-detail">{formatDate(session.last_activity)}</small></td><td><button className="row-arrow" aria-label="View session" onClick={(e) => { e.stopPropagation(); setSelectedSession(session.session_id); }}>↗</button></td>
              </tr>) : <tr><td colSpan="5"><div className="table-message">{error ? "Start the API to load sessions." : "No sessions yet. Open the demo page and interact with it to generate events."}</div></td></tr>}
          </tbody></table></div>
          <div className="panel-footer"><span>Showing {filteredSessions.length} of {sessions.length} sessions</span><span>Click a row to inspect its journey</span></div>
        </article>

        <article className="panel journey-panel">
          <div className="panel-heading"><div><h2>Session journey</h2><p>Events in chronological order</p></div><span className="journey-icon"><Activity size={18} /></span></div>
          {selected ? <div className="selected-session"><div className="selected-session-avatar">{selected.session_id.slice(0, 1).toUpperCase()}</div><div><strong>{shortId(selected.session_id)}</strong><span>{selected.total_events} events · {selected.clicks} clicks</span></div></div> : <div className="journey-placeholder">Select a session from the table to see its journey.</div>}
          <div className="timeline">
            {eventsLoading ? <div className="table-message">Loading journey…</div> : events.length ? events.map((event, index) => <div className="timeline-item" key={event._id || `${event.timestamp}-${index}`}><div className={`timeline-dot ${event.event_type === "click" ? "click-dot" : "view-dot"}`}>{event.event_type === "click" ? <MousePointer2 size={13} /> : <Eye size={13} />}</div><div className="timeline-content"><div className="timeline-title">{event.event_type === "page_view" ? "Page viewed" : "Element clicked"}<span>{new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span></div><div className="timeline-url">{pageLabel(event.page_url)}</div>{event.event_type === "click" && <div className="coordinate-chip">x: {event.click_x}px · y: {event.click_y}px</div>}</div></div>) : !eventsLoading && <EmptyState title={selected ? "No events in this session" : "Your journey starts here"} text={selected ? "This session does not have any recorded events yet." : "Choose a visitor session to explore their activity."} />}
          </div>
          {selected && <div className="journey-bottom"><span><i /> Session activity</span><button onClick={() => { setActiveTab("heatmap"); setHeatmapUrl(events.find((event) => event.event_type === "click")?.page_url || events[0]?.page_url || ""); }}>View click map <ArrowUpRight size={14} /></button></div>}
        </article>
      </section> : <section className="panel heatmap-panel">
        <div className="panel-heading"><div><h2>Page click map</h2><p>Click points collected by the browser tracking script.</p></div><span className="count-pill">{clicks.length} clicks</span></div>
        <label className="field-label" htmlFor="page-url">Page URL</label>
        <div className="url-input-row"><input id="page-url" value={heatmapUrl} onChange={(e) => setHeatmapUrl(e.target.value)} placeholder="Paste the exact page URL, e.g. http://localhost:5000/demo/" /><button onClick={() => loadHeatmap(heatmapUrl)}><Search size={15} /> Show clicks</button></div>
        <div className="heatmap-note"><MousePointer2 size={16} /><span>Coordinates are viewport-relative. The preview below is a representative canvas, not a screenshot of your webpage. For the most useful comparison, use a similar browser viewport size.</span></div>
        <div className="heatmap-canvas"><div className="canvas-top"><span><i /> CLICK POSITIONS</span><span>1440 × 900 reference viewport</span></div><div className="canvas-inner"><div className="canvas-grid" />{clicks.map((click, index) => <div key={`${click._id || click.timestamp}-${index}`} className="heat-dot" style={dotStyle(click)} title={`x: ${click.click_x}, y: ${click.click_y}`} />)}{!clicks.length && <div className="canvas-empty"><MousePointer2 size={26} /><strong>No click data to display</strong><span>Select a page URL with recorded clicks.</span></div>}</div><div className="canvas-legend"><span><i className="legend-dot" /> Each dot represents one click</span><span>{clicks.length} click points</span></div></div>
        <div className="heatmap-footnote"><strong>How to populate this view</strong><p>Start the backend, open the demo page, click a few elements, then paste the demo page URL above and choose “Show clicks”.</p><a href="http://localhost:5000/demo/" target="_blank" rel="noreferrer">Open demo page <ExternalLink size={14} /></a></div>
      </section>}

      <footer className="app-footer"><span>insightly <b>·</b> User Analytics Demo</span><span>Built with React, Express & MongoDB</span></footer>
    </main>
  </div>;
}
