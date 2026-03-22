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

/** Alien cyborg spaceship landing dashboard reveal */
function TargetLockReveal({ route, onComplete }) {
  const [phase, setPhase] = useState('warp');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('approach'), 600);
    const t2 = setTimeout(() => setPhase('scan'), 1200);
    const t3 = setTimeout(() => setPhase('land'), 2200);
    const t4 = setTimeout(() => setPhase('exit'), 2800);
    const t5 = setTimeout(() => onComplete(), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); };
  }, [onComplete]);

  const center = getRouteCenter(route.coords);

  return (
    <div className={`alien-overlay alien-${phase}`}>
      {/* Deep space background */}
      <div className="alien-space" />

      {/* Warp speed lines */}
      <div className="warp-tunnel">
        {Array.from({ length: 40 }, (_, i) => (
          <div key={i} className="warp-line" style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 0.5}s`,
            animationDuration: `${0.4 + Math.random() * 0.4}s`,
            transform: `rotate(${Math.atan2(50 - Math.random()*100, 50 - Math.random()*100) * 180/Math.PI}deg)`,
          }} />
        ))}
      </div>

      {/* Nebula glow */}
      <div className="alien-nebula" />

      {/* Stars field */}
      <div className="alien-stars">
        {Array.from({ length: 60 }, (_, i) => (
          <div key={i} className="alien-star" style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            width: `${1 + Math.random() * 2.5}px`,
            height: `${1 + Math.random() * 2.5}px`,
            background: i % 5 === 0 ? '#ff6bff' : i % 3 === 0 ? '#6bffff' : 'white',
          }} />
        ))}
      </div>

      {/* Hexagonal HUD grid */}
      <svg className="hex-grid" viewBox="0 0 600 600" preserveAspectRatio="xMidYMid meet">
        {/* Outer hex ring */}
        <polygon points="300,30 540,165 540,435 300,570 60,435 60,165" fill="none" stroke="rgba(0,255,255,0.15)" strokeWidth="1.5" className="hex-spin" />
        <polygon points="300,60 510,180 510,420 300,540 90,420 90,180" fill="none" stroke="rgba(0,255,255,0.1)" strokeWidth="1" strokeDasharray="10 5" className="hex-spin-rev" />
        <polygon points="300,100 470,200 470,400 300,500 130,400 130,200" fill="none" stroke="rgba(180,100,255,0.2)" strokeWidth="1.5" />
        <polygon points="300,150 430,220 430,380 300,450 170,380 170,220" fill="none" stroke="rgba(0,255,255,0.25)" strokeWidth="1" strokeDasharray="6 8" className="hex-spin" />
        <polygon points="300,200 380,250 380,350 300,400 220,350 220,250" fill="none" stroke="rgba(255,100,200,0.3)" strokeWidth="2" />

        {/* Center targeting eye */}
        <circle cx="300" cy="300" r="40" fill="none" stroke="rgba(0,255,255,0.4)" strokeWidth="2" className="alien-eye-pulse" />
        <circle cx="300" cy="300" r="15" fill="none" stroke="rgba(255,0,200,0.6)" strokeWidth="2" />
        <circle cx="300" cy="300" r="5" fill="rgba(255,0,200,0.8)" className="alien-core-pulse" />

        {/* Scanning beam lines radiating from center */}
        {[0, 60, 120, 180, 240, 300].map(angle => {
          const rad = (angle * Math.PI) / 180;
          return (
            <line key={angle}
              x1={300 + 50 * Math.cos(rad)} y1={300 + 50 * Math.sin(rad)}
              x2={300 + 260 * Math.cos(rad)} y2={300 + 260 * Math.sin(rad)}
              stroke="rgba(0,255,255,0.12)" strokeWidth="1"
            />
          );
        })}

        {/* Data nodes at hex vertices */}
        {[[300,30],[540,165],[540,435],[300,570],[60,435],[60,165]].map(([x,y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="6" fill="rgba(0,255,255,0.3)" className="node-pulse" style={{animationDelay:`${i*0.2}s`}} />
            <circle cx={x} cy={y} r="3" fill="rgba(0,255,255,0.7)" />
          </g>
        ))}

        {/* Alien script text around rings */}
        <text x="300" y="85" textAnchor="middle" fill="rgba(0,255,255,0.4)" fontSize="9" fontFamily="monospace">XENO-NAV // SECTOR 7G</text>
        <text x="300" y="555" textAnchor="middle" fill="rgba(0,255,255,0.3)" fontSize="9" fontFamily="monospace">ORBITAL DESCENT PROTOCOL</text>
        <text x="75" y="300" fill="rgba(180,100,255,0.4)" fontSize="8" fontFamily="monospace" transform="rotate(-90,75,300)">HULL INTEGRITY 98.7%</text>
        <text x="525" y="300" fill="rgba(180,100,255,0.4)" fontSize="8" fontFamily="monospace" transform="rotate(90,525,300)">SHIELDS NOMINAL</text>
      </svg>

      {/* Cyborg pilot silhouette at bottom */}
      <svg className="cyborg-pilot" viewBox="0 0 200 160" preserveAspectRatio="xMidYMax meet">
        {/* Chair base */}
        <rect x="60" y="140" width="80" height="10" rx="3" fill="rgba(0,255,255,0.08)" stroke="rgba(0,255,255,0.15)" strokeWidth="1" />
        {/* Seat back */}
        <path d="M70,140 L65,90 Q65,80 75,80 L125,80 Q135,80 135,90 L130,140" fill="rgba(0,255,255,0.05)" stroke="rgba(0,255,255,0.12)" strokeWidth="1" />
        {/* Body */}
        <line x1="100" y1="75" x2="100" y2="120" stroke="rgba(0,255,255,0.2)" strokeWidth="5" strokeLinecap="round" />
        {/* Head — elongated alien */}
        <ellipse cx="100" cy="55" rx="14" ry="20" fill="rgba(0,255,255,0.1)" stroke="rgba(0,255,255,0.2)" strokeWidth="1" />
        {/* Eyes — large, glowing */}
        <ellipse cx="93" cy="50" rx="6" ry="4" fill="rgba(255,0,200,0.3)" className="alien-eye-glow" />
        <ellipse cx="107" cy="50" rx="6" ry="4" fill="rgba(255,0,200,0.3)" className="alien-eye-glow" />
        <ellipse cx="93" cy="50" rx="3" ry="2" fill="rgba(255,0,200,0.7)" />
        <ellipse cx="107" cy="50" rx="3" ry="2" fill="rgba(255,0,200,0.7)" />
        {/* Arms reaching to controls */}
        <line x1="90" y1="85" x2="55" y2="105" stroke="rgba(0,255,255,0.15)" strokeWidth="3" strokeLinecap="round" />
        <line x1="110" y1="85" x2="145" y2="105" stroke="rgba(0,255,255,0.15)" strokeWidth="3" strokeLinecap="round" />
        {/* Hands on controls */}
        <circle cx="55" cy="105" r="4" fill="rgba(0,255,255,0.1)" stroke="rgba(0,255,255,0.2)" strokeWidth="1" />
        <circle cx="145" cy="105" r="4" fill="rgba(0,255,255,0.1)" stroke="rgba(0,255,255,0.2)" strokeWidth="1" />
        {/* Legs */}
        <line x1="95" y1="120" x2="85" y2="145" stroke="rgba(0,255,255,0.12)" strokeWidth="3" strokeLinecap="round" />
        <line x1="105" y1="120" x2="115" y2="145" stroke="rgba(0,255,255,0.12)" strokeWidth="3" strokeLinecap="round" />
        {/* Cybernetic implants — lines on head */}
        <line x1="86" y1="42" x2="78" y2="38" stroke="rgba(0,255,255,0.3)" strokeWidth="1" />
        <line x1="114" y1="42" x2="122" y2="38" stroke="rgba(0,255,255,0.3)" strokeWidth="1" />
        <circle cx="78" cy="38" r="2" fill="rgba(0,255,255,0.5)" className="node-pulse" />
        <circle cx="122" cy="38" r="2" fill="rgba(0,255,255,0.5)" className="node-pulse" />
        {/* Spine glow */}
        <line x1="100" y1="75" x2="100" y2="40" stroke="rgba(255,0,200,0.15)" strokeWidth="1" strokeDasharray="2 3" />
      </svg>

      {/* Holographic display panels — left */}
      <div className="holo-panel holo-left">
        <div className="holo-title">PLANETARY DATA</div>
        <div className="holo-row"><span>MASS</span><span className="holo-val">5.97×10²⁴</span></div>
        <div className="holo-row"><span>GRAV</span><span className="holo-val">9.81 m/s²</span></div>
        <div className="holo-row"><span>ATM</span><span className="holo-val">N₂/O₂</span></div>
        <div className="holo-row"><span>TEMP</span><span className="holo-val">295K</span></div>
        <div className="holo-bar"><div className="holo-bar-fill holo-bar-1" /></div>
        <div className="holo-row"><span>FUEL</span><span className="holo-val">73%</span></div>
        <div className="holo-bar"><div className="holo-bar-fill holo-bar-2" /></div>
      </div>

      {/* Holographic display panels — right */}
      <div className="holo-panel holo-right">
        <div className="holo-title">LANDING SEQ</div>
        <div className="holo-row"><span>ALT</span><span className="holo-val alien-descent">12,400 ft</span></div>
        <div className="holo-row"><span>VEL</span><span className="holo-val">MACH 0.3</span></div>
        <div className="holo-row"><span>ANG</span><span className="holo-val">-4.2°</span></div>
        <div className="holo-row"><span>ETA</span><span className="holo-val alien-blink">00:03</span></div>
        <div className="holo-bar"><div className="holo-bar-fill holo-bar-3" /></div>
        <div className="holo-row"><span>SHLD</span><span className="holo-val">ACTIVE</span></div>
        <div className="holo-bar"><div className="holo-bar-fill holo-bar-4" /></div>
      </div>

      {/* HUD top bar */}
      <div className="alien-hud-top">
        <span className="alien-blink">◆ LIVE FEED</span>
        <span className="alien-title">CYBORG NAVIGATION SYSTEM v7.2.1</span>
        <span className="alien-data">SECTOR {route.id}-ALPHA</span>
      </div>

      {/* Landing target card */}
      <div className="alien-target-card">
        <div className="alien-card-glow" />
        <div className="alien-card-inner">
          <div className="alien-card-header">◇ LANDING ZONE CONFIRMED ◇</div>
          <div className="alien-card-color" style={{ background: route.color, boxShadow: `0 0 12px ${route.color}` }} />
          <div className="alien-card-name">{route.name}</div>
          <div className="alien-card-stats">
            <span>{route.distance} MI</span>
            <span>•</span>
            <span>{route.duration}</span>
            <span>•</span>
            <span>{route.type.toUpperCase()}</span>
          </div>
          <div className="alien-card-coords">{center[0].toFixed(4)}°N · {Math.abs(center[1]).toFixed(4)}°W</div>
        </div>
      </div>

      {/* Bottom HUD */}
      <div className="alien-hud-bottom">
        <span className="alien-data">LAT {center[0].toFixed(4)}</span>
        <span className="alien-lock">◈ TOUCHDOWN IMMINENT ◈</span>
        <span className="alien-data">LON {center[1].toFixed(4)}</span>
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
