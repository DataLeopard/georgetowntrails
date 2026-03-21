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

/** Submarine periscope / sonar reveal overlay */
function SubReveal({ route, onComplete }) {
  const [phase, setPhase] = useState('enter');
  const center = getRouteCenter(route.coords);
  const tileUrl = getTileUrl(center[0], center[1], 15);
  const depth = (Math.abs(center[0]) * 3.28).toFixed(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 250);
    const t2 = setTimeout(() => setPhase('exit'), 650);
    const t3 = setTimeout(() => onComplete(), 900);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <div className={`sub-overlay sub-${phase}`}>
      {/* Comic panel burst lines behind */}
      <div className="sub-burst-lines" />

      <div className="sub-porthole">
        {/* Sonar sweep */}
        <div className="sub-sonar-sweep" />
        {/* Sonar rings */}
        <div className="sub-sonar-ring ring-1" />
        <div className="sub-sonar-ring ring-2" />
        <div className="sub-sonar-ring ring-3" />

        <div className="sub-screen">
          <img src={tileUrl} alt="" className="sub-map-tile" />
          <RoutePreviewPath coords={route.coords} color={route.color} size={140} />
          {/* Crosshair */}
          <div className="sub-crosshair" />
        </div>

        {/* Depth gauge */}
        <div className="sub-depth">
          DEPTH {depth}ft
        </div>

        {/* Coordinates */}
        <div className="sub-coords">
          {center[0].toFixed(4)}N {Math.abs(center[1]).toFixed(4)}W
        </div>

        {/* Route name comic caption */}
        <div className="sub-caption">
          <span className="sub-caption-text">{route.name}</span>
        </div>

        {/* Porthole bolts */}
        <div className="sub-bolt bolt-tl" />
        <div className="sub-bolt bolt-tr" />
        <div className="sub-bolt bolt-bl" />
        <div className="sub-bolt bolt-br" />
      </div>

      {/* Ping flash */}
      <div className="sub-ping" />
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
        <SubReveal route={revealRoute} onComplete={handleRevealComplete} />
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
