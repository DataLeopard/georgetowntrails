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

/** Night vision binocular targeting reveal with soldier */
function TargetLockReveal({ route, onComplete }) {
  const [phase, setPhase] = useState('enter');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('zoom'), 300);
    const t2 = setTimeout(() => setPhase('lock'), 900);
    const t3 = setTimeout(() => setPhase('flash'), 2600);
    const t4 = setTimeout(() => setPhase('exit'), 2800);
    const t5 = setTimeout(() => onComplete(), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); };
  }, [onComplete]);

  return (
    <div className={`torpedo-overlay torpedo-${phase}`}>
      {/* Deep green night-vision background */}
      <div className="torpedo-bg" />

      {/* Binocular mask — two circles with bridge */}
      <div className="bino-mask" />

      {/* CRT scanlines across entire screen */}
      <div className="crt-lines" />

      {/* Static noise grain */}
      <div className="torpedo-noise" />

      {/* White flash on lock */}
      <div className="nvg-flash" />

      {/* Sonar ping rings */}
      <div className="sonar-ping sonar-ping-1" />
      <div className="sonar-ping sonar-ping-2" />
      <div className="sonar-ping sonar-ping-3" />

      {/* Soldier silhouettes walking across bottom */}
      <svg className="soldier-layer" viewBox="0 0 1000 200" preserveAspectRatio="xMidYMax slice">
        {/* Soldier 1 — crouching with rifle, moving left to right */}
        <g className="soldier soldier-1">
          {/* Body */}
          <circle cx="50" cy="120" r="10" fill="rgba(0,255,65,0.25)" />
          {/* Torso leaning forward */}
          <line x1="50" y1="130" x2="45" y2="155" stroke="rgba(0,255,65,0.25)" strokeWidth="4" strokeLinecap="round" />
          {/* Legs */}
          <line x1="45" y1="155" x2="35" y2="180" stroke="rgba(0,255,65,0.25)" strokeWidth="3" strokeLinecap="round" />
          <line x1="45" y1="155" x2="55" y2="178" stroke="rgba(0,255,65,0.25)" strokeWidth="3" strokeLinecap="round" />
          {/* Arms + rifle */}
          <line x1="48" y1="135" x2="70" y2="128" stroke="rgba(0,255,65,0.25)" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="70" y1="128" x2="95" y2="122" stroke="rgba(0,255,65,0.3)" strokeWidth="2" strokeLinecap="round" />
          {/* Helmet */}
          <ellipse cx="50" cy="116" rx="12" ry="7" fill="rgba(0,255,65,0.2)" />
        </g>

        {/* Soldier 2 — standing with binoculars, moving right */}
        <g className="soldier soldier-2">
          <circle cx="50" cy="115" r="10" fill="rgba(0,255,65,0.2)" />
          <line x1="50" y1="125" x2="50" y2="160" stroke="rgba(0,255,65,0.2)" strokeWidth="4" strokeLinecap="round" />
          <line x1="50" y1="160" x2="40" y2="185" stroke="rgba(0,255,65,0.2)" strokeWidth="3" strokeLinecap="round" />
          <line x1="50" y1="160" x2="60" y2="185" stroke="rgba(0,255,65,0.2)" strokeWidth="3" strokeLinecap="round" />
          {/* Arms holding binoculars up */}
          <line x1="48" y1="130" x2="45" y2="118" stroke="rgba(0,255,65,0.2)" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="52" y1="130" x2="55" y2="118" stroke="rgba(0,255,65,0.2)" strokeWidth="2.5" strokeLinecap="round" />
          <rect x="42" y="110" width="16" height="8" rx="2" fill="rgba(0,255,65,0.15)" />
          <ellipse cx="50" cy="112" rx="13" ry="6" fill="rgba(0,255,65,0.15)" />
        </g>

        {/* Soldier 3 — prone/crawling */}
        <g className="soldier soldier-3">
          <circle cx="50" cy="170" r="8" fill="rgba(0,255,65,0.18)" />
          <line x1="50" y1="175" x2="85" y2="178" stroke="rgba(0,255,65,0.18)" strokeWidth="5" strokeLinecap="round" />
          <line x1="85" y1="178" x2="95" y2="185" stroke="rgba(0,255,65,0.18)" strokeWidth="3" strokeLinecap="round" />
          <line x1="85" y1="178" x2="100" y2="182" stroke="rgba(0,255,65,0.18)" strokeWidth="3" strokeLinecap="round" />
          <line x1="48" y1="168" x2="30" y2="165" stroke="rgba(0,255,65,0.2)" strokeWidth="2" strokeLinecap="round" />
          <line x1="30" y1="165" x2="15" y2="163" stroke="rgba(0,255,65,0.22)" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      </svg>

      {/* Heartbeat line at bottom */}
      <div className="heartbeat-container">
        <svg className="heartbeat-svg" viewBox="0 0 300 40" preserveAspectRatio="none">
          <polyline
            points="0,20 30,20 40,20 45,5 50,35 55,15 60,25 65,20 100,20 130,20 140,20 145,5 150,35 155,15 160,25 165,20 200,20 230,20 240,20 245,5 250,35 255,15 260,25 265,20 300,20"
            fill="none"
            stroke="rgba(0,255,65,0.5)"
            strokeWidth="1.5"
            className="heartbeat-line"
          />
        </svg>
      </div>

      {/* Main targeting scope SVG — binocular zoom-in */}
      <svg className="torpedo-scope" viewBox="0 0 500 500" preserveAspectRatio="xMidYMid meet">
        {/* Outer rings */}
        <circle cx="250" cy="250" r="230" fill="none" stroke="rgba(0,255,65,0.3)" strokeWidth="2.5" />
        <circle cx="250" cy="250" r="210" fill="none" stroke="rgba(0,255,65,0.1)" strokeWidth="1" strokeDasharray="3 3" />
        <circle cx="250" cy="250" r="200" fill="none" stroke="rgba(0,255,65,0.2)" strokeWidth="1.5" strokeDasharray="12 6" className="torpedo-ring-spin" />
        <circle cx="250" cy="250" r="170" fill="none" stroke="rgba(0,255,65,0.35)" strokeWidth="2" />
        <circle cx="250" cy="250" r="140" fill="none" stroke="rgba(0,255,65,0.1)" strokeWidth="1" strokeDasharray="6 10" className="torpedo-ring-spin-rev" />
        <circle cx="250" cy="250" r="120" fill="none" stroke="rgba(0,255,65,0.25)" strokeWidth="1.5" strokeDasharray="4 8" />
        <circle cx="250" cy="250" r="90" fill="none" stroke="rgba(0,255,65,0.15)" strokeWidth="1" />
        <circle cx="250" cy="250" r="70" fill="none" stroke="rgba(0,255,65,0.4)" strokeWidth="2" />
        <circle cx="250" cy="250" r="30" fill="none" stroke="rgba(255,60,60,0.7)" strokeWidth="2.5" className="torpedo-bullseye" />

        {/* Kill dot */}
        <circle cx="250" cy="250" r="5" fill="rgba(255,60,60,0.9)" className="torpedo-dot-pulse" />

        {/* Main crosshairs — thicker */}
        <line x1="250" y1="10" x2="250" y2="180" stroke="rgba(0,255,65,0.6)" strokeWidth="2" />
        <line x1="250" y1="320" x2="250" y2="490" stroke="rgba(0,255,65,0.6)" strokeWidth="2" />
        <line x1="10" y1="250" x2="180" y2="250" stroke="rgba(0,255,65,0.6)" strokeWidth="2" />
        <line x1="320" y1="250" x2="490" y2="250" stroke="rgba(0,255,65,0.6)" strokeWidth="2" />

        {/* Mil-dot range marks on crosshairs */}
        {[60, 90, 120, 150].map(d => (
          <g key={d}>
            <line x1={245} y1={250-d} x2={255} y2={250-d} stroke="rgba(0,255,65,0.4)" strokeWidth="1" />
            <line x1={245} y1={250+d} x2={255} y2={250+d} stroke="rgba(0,255,65,0.4)" strokeWidth="1" />
            <line x1={250-d} y1={245} x2={250-d} y2={255} stroke="rgba(0,255,65,0.4)" strokeWidth="1" />
            <line x1={250+d} y1={245} x2={250+d} y2={255} stroke="rgba(0,255,65,0.4)" strokeWidth="1" />
          </g>
        ))}

        {/* Diagonal guide lines */}
        <line x1="80" y1="80" x2="180" y2="180" stroke="rgba(0,255,65,0.15)" strokeWidth="1" />
        <line x1="420" y1="80" x2="320" y2="180" stroke="rgba(0,255,65,0.15)" strokeWidth="1" />
        <line x1="80" y1="420" x2="180" y2="320" stroke="rgba(0,255,65,0.15)" strokeWidth="1" />
        <line x1="420" y1="420" x2="320" y2="320" stroke="rgba(0,255,65,0.15)" strokeWidth="1" />

        {/* Range ticks — 72 of them */}
        {Array.from({ length: 72 }, (_, i) => {
          const angle = (i * 5 * Math.PI) / 180;
          const major = i % 6 === 0;
          const r1 = major ? 210 : 220;
          const r2 = 235;
          return (
            <line key={i}
              x1={250 + r1 * Math.cos(angle)} y1={250 + r1 * Math.sin(angle)}
              x2={250 + r2 * Math.cos(angle)} y2={250 + r2 * Math.sin(angle)}
              stroke={i % 18 === 0 ? 'rgba(255,60,60,0.7)' : major ? 'rgba(0,255,65,0.5)' : 'rgba(0,255,65,0.2)'}
              strokeWidth={major ? 2 : 0.8}
            />
          );
        })}

        {/* Corner bracket frames */}
        <path d="M25,25 L25,95 M25,25 L95,25" fill="none" stroke="rgba(0,255,65,0.6)" strokeWidth="3" />
        <path d="M475,25 L475,95 M475,25 L405,25" fill="none" stroke="rgba(0,255,65,0.6)" strokeWidth="3" />
        <path d="M25,475 L25,405 M25,475 L95,475" fill="none" stroke="rgba(0,255,65,0.6)" strokeWidth="3" />
        <path d="M475,475 L475,405 M475,475 L405,475" fill="none" stroke="rgba(0,255,65,0.6)" strokeWidth="3" />

        {/* Target diamond pulsing */}
        <polygon points="250,195 305,250 250,305 195,250" fill="none" stroke="rgba(255,60,60,0.5)" strokeWidth="2" className="torpedo-diamond-pulse" />

        {/* Compass rose */}
        <text x="245" y="48" fill="rgba(0,255,65,0.5)" fontSize="10" fontFamily="monospace" fontWeight="bold">N</text>
        <text x="245" y="478" fill="rgba(0,255,65,0.4)" fontSize="10" fontFamily="monospace" fontWeight="bold">S</text>
        <text x="468" y="254" fill="rgba(0,255,65,0.4)" fontSize="10" fontFamily="monospace" fontWeight="bold">E</text>
        <text x="22" y="254" fill="rgba(0,255,65,0.4)" fontSize="10" fontFamily="monospace" fontWeight="bold">W</text>

        {/* HUD text */}
        <text x="35" y="22" fill="rgba(0,255,65,0.8)" fontSize="12" fontFamily="'Courier New', monospace" fontWeight="bold">NVG SCOPE MK-IV</text>
        <text x="355" y="22" fill="rgba(255,60,60,0.9)" fontSize="12" fontFamily="'Courier New', monospace" fontWeight="bold" className="torpedo-text-blink">● ARMED</text>
        <text x="35" y="492" fill="rgba(0,255,65,0.6)" fontSize="10" fontFamily="'Courier New', monospace">BRG 247° · SPD 12kts · WIND 8mph NE</text>
        <text x="355" y="492" fill="rgba(0,255,65,0.6)" fontSize="10" fontFamily="'Courier New', monospace">ALT 200ft</text>
      </svg>

      {/* Radar sweep */}
      <div className="torpedo-sweep" />

      {/* HUD data bars */}
      <div className="torpedo-hud-top">
        <span className="torpedo-rec">● REC</span>
        <span className="torpedo-label">NIGHT VISION · BINOCULAR FEED</span>
        <span className="torpedo-data">TGT {route.id}</span>
      </div>

      {/* Side HUD panels */}
      <div className="nvg-side-hud nvg-side-left">
        <div className="nvg-readout">PWR<br/>87%</div>
        <div className="nvg-bar-v"><div className="nvg-bar-fill" style={{height:'87%'}} /></div>
        <div className="nvg-readout">GAIN<br/>+4.2</div>
        <div className="nvg-bar-v"><div className="nvg-bar-fill" style={{height:'65%'}} /></div>
        <div className="nvg-readout">IR</div>
      </div>
      <div className="nvg-side-hud nvg-side-right">
        <div className="nvg-readout">RNG<br/>1.4mi</div>
        <div className="nvg-bar-v"><div className="nvg-bar-fill" style={{height:'45%'}} /></div>
        <div className="nvg-readout">MAG<br/>12x</div>
        <div className="nvg-bar-v"><div className="nvg-bar-fill" style={{height:'72%'}} /></div>
        <div className="nvg-readout">BAT</div>
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
          <div className="torpedo-card-coords">
            {getRouteCenter(route.coords)[0].toFixed(4)}°N {Math.abs(getRouteCenter(route.coords)[1]).toFixed(4)}°W
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
