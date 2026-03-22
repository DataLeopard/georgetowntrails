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

/** Submarine torpedo targeting reveal */
function TargetLockReveal({ route, onComplete }) {
  const [phase, setPhase] = useState('enter');
  const starsRef = useRef(
    Array.from({ length: 12 }, () => ({
      x: 5 + Math.random() * 90,
      y: 5 + Math.random() * 30,
      d: Math.random() * 2,
      s: 1 + Math.random() * 2,
    }))
  );

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('lock'), 500);
    const t2 = setTimeout(() => setPhase('exit'), 2400);
    const t3 = setTimeout(() => onComplete(), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <div className={`torpedo-overlay torpedo-${phase}`}>
      {/* Deep ocean / night-vision background */}
      <div className="torpedo-bg" />

      {/* Static noise grain */}
      <div className="torpedo-noise" />

      {/* Sonar ping rings */}
      <div className="sonar-ping sonar-ping-1" />
      <div className="sonar-ping sonar-ping-2" />
      <div className="sonar-ping sonar-ping-3" />

      {/* Main targeting scope SVG */}
      <svg className="torpedo-scope" viewBox="0 0 500 500" preserveAspectRatio="xMidYMid meet">
        {/* Outer rings */}
        <circle cx="250" cy="250" r="230" fill="none" stroke="rgba(0,255,65,0.2)" strokeWidth="2" />
        <circle cx="250" cy="250" r="200" fill="none" stroke="rgba(0,255,65,0.15)" strokeWidth="1" strokeDasharray="12 6" className="torpedo-ring-spin" />
        <circle cx="250" cy="250" r="170" fill="none" stroke="rgba(0,255,65,0.3)" strokeWidth="1.5" />
        <circle cx="250" cy="250" r="120" fill="none" stroke="rgba(0,255,65,0.2)" strokeWidth="1" strokeDasharray="4 8" className="torpedo-ring-spin-rev" />
        <circle cx="250" cy="250" r="70" fill="none" stroke="rgba(0,255,65,0.35)" strokeWidth="2" />
        <circle cx="250" cy="250" r="30" fill="none" stroke="rgba(255,60,60,0.6)" strokeWidth="2" className="torpedo-bullseye" />

        {/* Kill dot */}
        <circle cx="250" cy="250" r="5" fill="rgba(255,60,60,0.9)" className="torpedo-dot-pulse" />

        {/* Main crosshairs */}
        <line x1="250" y1="10" x2="250" y2="180" stroke="rgba(0,255,65,0.5)" strokeWidth="1.5" />
        <line x1="250" y1="320" x2="250" y2="490" stroke="rgba(0,255,65,0.5)" strokeWidth="1.5" />
        <line x1="10" y1="250" x2="180" y2="250" stroke="rgba(0,255,65,0.5)" strokeWidth="1.5" />
        <line x1="320" y1="250" x2="490" y2="250" stroke="rgba(0,255,65,0.5)" strokeWidth="1.5" />

        {/* Diagonal guide lines */}
        <line x1="80" y1="80" x2="180" y2="180" stroke="rgba(0,255,65,0.15)" strokeWidth="1" />
        <line x1="420" y1="80" x2="320" y2="180" stroke="rgba(0,255,65,0.15)" strokeWidth="1" />
        <line x1="80" y1="420" x2="180" y2="320" stroke="rgba(0,255,65,0.15)" strokeWidth="1" />
        <line x1="420" y1="420" x2="320" y2="320" stroke="rgba(0,255,65,0.15)" strokeWidth="1" />

        {/* Range ticks around outer ring */}
        {Array.from({ length: 36 }, (_, i) => {
          const angle = (i * 10 * Math.PI) / 180;
          const r1 = i % 3 === 0 ? 215 : 222;
          const r2 = 235;
          return (
            <line key={i}
              x1={250 + r1 * Math.cos(angle)} y1={250 + r1 * Math.sin(angle)}
              x2={250 + r2 * Math.cos(angle)} y2={250 + r2 * Math.sin(angle)}
              stroke={i % 9 === 0 ? 'rgba(255,60,60,0.6)' : 'rgba(0,255,65,0.4)'}
              strokeWidth={i % 3 === 0 ? 2 : 1}
            />
          );
        })}

        {/* Corner bracket frames */}
        <path d="M30,30 L30,90 M30,30 L90,30" fill="none" stroke="rgba(0,255,65,0.5)" strokeWidth="2.5" />
        <path d="M470,30 L470,90 M470,30 L410,30" fill="none" stroke="rgba(0,255,65,0.5)" strokeWidth="2.5" />
        <path d="M30,470 L30,410 M30,470 L90,470" fill="none" stroke="rgba(0,255,65,0.5)" strokeWidth="2.5" />
        <path d="M470,470 L470,410 M470,470 L410,470" fill="none" stroke="rgba(0,255,65,0.5)" strokeWidth="2.5" />

        {/* Target diamond */}
        <polygon points="250,200 300,250 250,300 200,250" fill="none" stroke="rgba(255,60,60,0.4)" strokeWidth="1.5" className="torpedo-diamond-pulse" />

        {/* HUD text */}
        <text x="40" y="25" fill="rgba(0,255,65,0.7)" fontSize="11" fontFamily="'Courier New', monospace" fontWeight="bold">TORPEDO BAY 01</text>
        <text x="350" y="25" fill="rgba(255,60,60,0.8)" fontSize="11" fontFamily="'Courier New', monospace" fontWeight="bold" className="torpedo-text-blink">● ARMED</text>
        <text x="40" y="490" fill="rgba(0,255,65,0.6)" fontSize="10" fontFamily="'Courier New', monospace">BRG 247° · SPD 12kts</text>
        <text x="340" y="490" fill="rgba(0,255,65,0.6)" fontSize="10" fontFamily="'Courier New', monospace">DEPTH 200ft</text>
      </svg>

      {/* Scan sweep */}
      <div className="torpedo-sweep" />

      {/* HUD data bars */}
      <div className="torpedo-hud-top">
        <span className="torpedo-rec">● REC</span>
        <span className="torpedo-label">SUBMARINE TACTICAL DISPLAY</span>
        <span className="torpedo-data">MARK {route.id}</span>
      </div>

      {/* Route target card */}
      <div className="torpedo-target-card">
        <div className="torpedo-card-border" />
        <div className="torpedo-card-inner">
          <div className="torpedo-card-header">
            <span className="torpedo-lock-icon">◎</span>
            <span>TARGET ACQUIRED</span>
          </div>
          <div className="torpedo-card-color" style={{ background: route.color }} />
          <div className="torpedo-card-name">{route.name}</div>
          <div className="torpedo-card-stats">
            <span>{route.distance} MI</span>
            <span>·</span>
            <span>{route.duration}</span>
            <span>·</span>
            <span>{route.type.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* Bottom HUD */}
      <div className="torpedo-hud-bottom">
        <span className="torpedo-data">LAT {getRouteCenter(route.coords)[0].toFixed(4)}</span>
        <span className="torpedo-lock-text">◉ LOCK CONFIRMED</span>
        <span className="torpedo-data">LON {getRouteCenter(route.coords)[1].toFixed(4)}</span>
      </div>
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
        <TargetLockReveal route={revealRoute} onComplete={handleRevealComplete} />
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
