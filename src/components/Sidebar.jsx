import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { getRoutesByPeriod } from '../data/routes';

const VIEW_MODES = ['days', 'weeks', 'months'];

function countRecentRoutes(routes, days) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return routes.filter(r => r.date >= cutoffStr).length;
}

function getRouteCenter(coords) {
  if (!coords || !coords.length) return [30.6627, -97.6779];
  const lat = coords.reduce((s, c) => s + c[0], 0) / coords.length;
  const lon = coords.reduce((s, c) => s + c[1], 0) / coords.length;
  return [lat, lon];
}

function getTileUrl(lat, lon, zoom) {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lon + 180) / 360) * n);
  const y = Math.floor(
    ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) * n
  );
  return `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
}

function RoutePreviewPath({ coords, color, size = 60 }) {
  if (!coords || coords.length < 2) return null;
  const lats = coords.map(c => c[0]);
  const lons = coords.map(c => c[1]);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLon = Math.min(...lons), maxLon = Math.max(...lons);
  const pad = 4;
  const rangeX = maxLon - minLon || 0.001;
  const rangeY = maxLat - minLat || 0.001;
  const scale = (size - pad * 2) / Math.max(rangeX, rangeY);
  const points = coords.map(c => {
    const x = pad + (c[1] - minLon) * scale;
    const y = pad + (maxLat - c[0]) * scale;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={size} height={size} className="route-preview-svg">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
    </svg>
  );
}

/** Blimp over Austin skyline reveal */
function BlimpReveal({ route, onComplete }) {
  const [phase, setPhase] = useState('enter');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 400);
    const t2 = setTimeout(() => setPhase('exit'), 2200);
    const t3 = setTimeout(() => onComplete(), 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <div className={`blimp-overlay blimp-${phase}`}>
      {/* Gradient sky */}
      <div className="blimp-sky" />

      {/* Stars */}
      <div className="blimp-stars">
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i} className="blimp-star" style={{
            left: `${5 + Math.random() * 90}%`,
            top: `${5 + Math.random() * 35}%`,
            animationDelay: `${Math.random() * 2}s`,
            width: `${1 + Math.random() * 2}px`,
            height: `${1 + Math.random() * 2}px`,
          }} />
        ))}
      </div>

      {/* Austin skyline silhouette */}
      <svg className="blimp-skyline" viewBox="0 0 800 200" preserveAspectRatio="xMidYMax slice">
        {/* Background buildings */}
        <rect x="30" y="80" width="35" height="120" fill="#1a2744" />
        <rect x="70" y="60" width="25" height="140" fill="#1e2d4d" />
        <rect x="100" y="90" width="40" height="110" fill="#1a2744" />
        <rect x="150" y="40" width="30" height="160" fill="#1e2d4d" />
        {/* Frost Bank Tower */}
        <polygon points="200,30 215,10 230,30 230,200 200,200" fill="#223356" />
        <rect x="203" y="35" width="4" height="6" fill="#4fc3f7" opacity="0.6" />
        <rect x="213" y="45" width="4" height="6" fill="#4fc3f7" opacity="0.4" />
        <rect x="223" y="55" width="4" height="6" fill="#4fc3f7" opacity="0.5" />
        {/* Congress bridge area */}
        <rect x="250" y="70" width="50" height="130" fill="#1a2744" />
        <rect x="255" y="75" width="6" height="8" fill="#4fc3f7" opacity="0.3" />
        <rect x="268" y="85" width="6" height="8" fill="#fbbf24" opacity="0.4" />
        <rect x="280" y="78" width="6" height="8" fill="#4fc3f7" opacity="0.5" />
        {/* The Independent (jenga tower) */}
        <rect x="310" y="15" width="28" height="185" fill="#263a5e" />
        <rect x="308" y="50" width="32" height="12" fill="#2a4068" />
        <rect x="306" y="90" width="36" height="12" fill="#2a4068" />
        <rect x="308" y="130" width="32" height="12" fill="#2a4068" />
        <rect x="315" y="20" width="4" height="6" fill="#4fc3f7" opacity="0.6" />
        <rect x="325" y="35" width="4" height="6" fill="#fbbf24" opacity="0.4" />
        <rect x="318" y="65" width="4" height="6" fill="#4fc3f7" opacity="0.3" />
        {/* Capitol dome */}
        <rect x="370" y="60" width="60" height="140" fill="#1e2d4d" />
        <ellipse cx="400" cy="60" rx="25" ry="15" fill="#263a5e" />
        <rect x="397" y="35" width="6" height="25" fill="#263a5e" />
        <circle cx="400" cy="33" r="4" fill="#fbbf24" opacity="0.8" />
        <rect x="378" y="80" width="5" height="7" fill="#fbbf24" opacity="0.5" />
        <rect x="390" y="90" width="5" height="7" fill="#4fc3f7" opacity="0.4" />
        <rect x="405" y="75" width="5" height="7" fill="#4fc3f7" opacity="0.6" />
        {/* More buildings right side */}
        <rect x="445" y="55" width="35" height="145" fill="#1a2744" />
        <rect x="490" y="75" width="45" height="125" fill="#1e2d4d" />
        <rect x="495" y="80" width="5" height="7" fill="#4fc3f7" opacity="0.3" />
        <rect x="515" y="90" width="5" height="7" fill="#fbbf24" opacity="0.4" />
        <rect x="545" y="45" width="30" height="155" fill="#223356" />
        <rect x="585" y="65" width="40" height="135" fill="#1a2744" />
        <rect x="635" y="85" width="30" height="115" fill="#1e2d4d" />
        <rect x="675" y="50" width="25" height="150" fill="#223356" />
        <rect x="710" y="70" width="35" height="130" fill="#1a2744" />
        <rect x="755" y="90" width="45" height="110" fill="#1e2d4d" />
        {/* Window lights scattered */}
        <rect x="450" y="65" width="4" height="5" fill="#4fc3f7" opacity="0.5" />
        <rect x="460" y="80" width="4" height="5" fill="#fbbf24" opacity="0.3" />
        <rect x="550" y="55" width="4" height="5" fill="#4fc3f7" opacity="0.4" />
        <rect x="640" y="95" width="4" height="5" fill="#fbbf24" opacity="0.5" />
        <rect x="680" y="60" width="4" height="5" fill="#4fc3f7" opacity="0.3" />
        <rect x="720" y="80" width="4" height="5" fill="#fbbf24" opacity="0.4" />
      </svg>

      {/* Blimp / airship */}
      <div className="blimp-ship">
        <svg viewBox="0 0 320 140" className="blimp-svg">
          {/* Blimp body */}
          <defs>
            <linearGradient id="blimpGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="40%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1e40af" />
            </linearGradient>
            <linearGradient id="blimpShine" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="white" stopOpacity="0.3" />
              <stop offset="50%" stopColor="white" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Main envelope */}
          <ellipse cx="160" cy="45" rx="140" ry="40" fill="url(#blimpGrad)" />
          <ellipse cx="160" cy="38" rx="120" ry="22" fill="url(#blimpShine)" />
          {/* Tail fins */}
          <polygon points="285,30 310,15 310,40 290,40" fill="#2563eb" />
          <polygon points="285,55 310,70 310,45 290,45" fill="#1d4ed8" />
          {/* Gondola */}
          <rect x="110" y="85" width="100" height="30" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
          {/* Gondola windows */}
          <rect x="120" y="90" width="12" height="10" rx="2" fill="#4fc3f7" opacity="0.8" />
          <rect x="138" y="90" width="12" height="10" rx="2" fill="#4fc3f7" opacity="0.6" />
          <rect x="156" y="90" width="12" height="10" rx="2" fill="#4fc3f7" opacity="0.8" />
          <rect x="174" y="90" width="12" height="10" rx="2" fill="#4fc3f7" opacity="0.6" />
          <rect x="192" y="90" width="12" height="10" rx="2" fill="#4fc3f7" opacity="0.8" />
          {/* Cables */}
          <line x1="130" y1="82" x2="140" y2="85" stroke="#475569" strokeWidth="1" />
          <line x1="190" y1="82" x2="180" y2="85" stroke="#475569" strokeWidth="1" />
          {/* Propeller */}
          <circle cx="300" cy="45" r="3" fill="#94a3b8" />
          <line x1="300" y1="35" x2="300" y2="55" stroke="#94a3b8" strokeWidth="2" className="blimp-propeller" />
          {/* LED strip on side */}
          <rect x="50" y="42" width="220" height="4" rx="2" fill="#fbbf24" opacity="0.9" />
        </svg>

        {/* Banner trailing from blimp */}
        <div className="blimp-banner">
          <span className="blimp-banner-text">FREE APARTMENT LOCATING</span>
        </div>
      </div>

      {/* Route info card */}
      <div className="blimp-route-card">
        <div className="blimp-route-color" style={{ background: route.color }} />
        <div className="blimp-route-name">{route.name}</div>
        <div className="blimp-route-meta">{route.distance} mi · {route.duration}</div>
      </div>

      {/* Searchlight beams */}
      <div className="blimp-searchlight" />
    </div>
  );
}

export default function Sidebar({ routes, activeRouteId, onRouteClick, isOpen, onToggle }) {
  const [viewMode, setViewMode] = useState('weeks');
  const [collapsed, setCollapsed] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [revealRoute, setRevealRoute] = useState(null);

  const filteredRoutes = useMemo(() => {
    if (!searchTerm.trim()) return routes;
    const q = searchTerm.toLowerCase();
    return routes.filter(r => r.name.toLowerCase().includes(q));
  }, [routes, searchTerm]);

  const periods = getRoutesByPeriod(filteredRoutes);
  const groups = periods[viewMode];

  const totalDist = routes.reduce((s, r) => s + r.distance, 0).toFixed(1);
  const totalRuns = routes.length;
  const thisWeek = countRecentRoutes(routes, 7);
  const thisMonth = countRecentRoutes(routes, 30);

  const toggleGroup = (key) => setCollapsed(c => ({ ...c, [key]: !c[key] }));

  const handleRouteClick = useCallback((route) => {
    setRevealRoute(route);
  }, []);

  const handleRevealComplete = useCallback(() => {
    if (revealRoute) {
      onRouteClick(revealRoute.id);
    }
    setRevealRoute(null);
  }, [revealRoute, onRouteClick]);

  return (
    <>
      <button
        className="sidebar-toggle"
        onClick={onToggle}
        title={isOpen ? 'Close sidebar' : 'Open sidebar'}
        aria-expanded={isOpen}
        aria-controls="trail-sidebar"
        aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {isOpen ? '◀' : '▶'}
      </button>

      <aside id="trail-sidebar" className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header comic-header">
          <h1>Reactor</h1>
          <p className="sidebar-subtitle">Georgetown, TX Trails</p>
          <div className="sidebar-stats">
            <div className="stat comic-stat"><span className="stat-value">{totalRuns}</span><span className="stat-label">Routes</span></div>
            <div className="stat comic-stat"><span className="stat-value">{totalDist}</span><span className="stat-label">Miles</span></div>
            <div className="stat comic-stat"><span className="stat-value">{thisWeek}</span><span className="stat-label">This Wk</span></div>
            <div className="stat comic-stat"><span className="stat-value">{thisMonth}</span><span className="stat-label">30 Days</span></div>
          </div>
          <div className="sidebar-search">
            <input
              type="text"
              className="search-input"
              placeholder="Search routes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search routes by name"
            />
            {searchTerm && (
              <button className="search-clear" onClick={() => setSearchTerm('')} aria-label="Clear search">✕</button>
            )}
          </div>
        </div>

        <div className="view-tabs">
          {VIEW_MODES.map(mode => (
            <button
              key={mode}
              className={`view-tab ${viewMode === mode ? 'active' : ''}`}
              onClick={() => setViewMode(mode)}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>

        <div className="route-groups">
          {filteredRoutes.length === 0 && (
            <div className="sidebar-empty-state">
              {searchTerm ? (
                <><p>No routes matching "{searchTerm}"</p><button className="search-clear-link" onClick={() => setSearchTerm('')}>Clear search</button></>
              ) : (
                <p>No routes recorded yet.</p>
              )}
            </div>
          )}
          {Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0])).map(([groupKey, groupRoutes]) => {
            const isCollapsed = collapsed[groupKey];
            const groupDist = groupRoutes.reduce((s, r) => s + r.distance, 0).toFixed(1);
            return (
              <div key={groupKey} className="route-group comic-panel">
                <button
                  className="group-header"
                  onClick={() => toggleGroup(groupKey)}
                  aria-expanded={!isCollapsed}
                >
                  <span className="group-chevron">{isCollapsed ? '▸' : '▾'}</span>
                  <span className="group-title">{groupKey}</span>
                  <span className="group-meta">{groupRoutes.length} · {groupDist}mi</span>
                </button>
                {!isCollapsed && (
                  <div className="route-list">
                    {groupRoutes.map(route => (
                      <RouteCard
                        key={route.id}
                        route={route}
                        isActive={route.id === activeRouteId}
                        onClick={() => handleRouteClick(route)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {revealRoute && (
        <BlimpReveal route={revealRoute} onComplete={handleRevealComplete} />
      )}
    </>
  );
}

function RouteCard({ route, isActive, onClick }) {
  const center = getRouteCenter(route.coords);
  const tileUrl = getTileUrl(center[0], center[1], 14);

  return (
    <button
      className={`route-card comic-card ${isActive ? 'active' : ''}`}
      onClick={onClick}
      aria-label={`${route.name}, ${route.distance} miles, ${route.duration}`}
      aria-pressed={isActive}
    >
      {/* Vibrant map tile background */}
      <div
        className="route-card-map-bg"
        style={{ backgroundImage: `url(${tileUrl})` }}
      />

      {/* Halftone dot overlay for comic feel */}
      <div className="route-card-halftone" />

      {/* Route path overlay */}
      <div className="route-card-path-overlay">
        <RoutePreviewPath coords={route.coords} color={route.color} size={70} />
      </div>

      {/* Arrow pointing to map */}
      <div className="route-card-arrow">
        <svg width="20" height="28" viewBox="0 0 20 28">
          <path d="M3 4 L17 14 L3 24" fill="none" stroke={route.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 4 L17 14 L3 24" fill="none" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" />
        </svg>
      </div>

      <div className="route-color-bar" style={{ background: route.color }} />
      <div className="route-info">
        <div className="route-name">{route.name}</div>
        <div className="route-meta">
          <span>{route.date}</span>
          <span>{route.distance} mi</span>
          <span>{route.duration}</span>
        </div>
        {isActive && route.notes && (
          <div className="route-notes">{route.notes}</div>
        )}
      </div>
      <div className={`route-type-badge ${route.type}`}>{route.type}</div>
    </button>
  );
}
