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

/** Epic multi-phase cinematic reveal */
function TargetLockReveal({ route, onComplete }) {
  const [phase, setPhase] = useState('warp');

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase('approach'), 600),
      setTimeout(() => setPhase('scan'), 1200),
      setTimeout(() => setPhase('asteroids'), 1800),
      setTimeout(() => setPhase('explode'), 2600),
      setTimeout(() => setPhase('heaven'), 3400),
      setTimeout(() => setPhase('battle'), 4400),
      setTimeout(() => setPhase('civilwar'), 5400),
      setTimeout(() => setPhase('burns'), 6400),
      setTimeout(() => setPhase('exit'), 7600),
      setTimeout(() => onComplete(), 8000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  const center = getRouteCenter(route.coords);
  const tileUrl = getTileUrl(center[0], center[1], 15);

  return (
    <div className={`alien-overlay alien-${phase}`}>
      {/* ═══ PHASE 1-3: Space approach (existing) ═══ */}
      <div className="alien-space" />

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

      <div className="alien-nebula" />

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

      <svg className="hex-grid" viewBox="0 0 600 600" preserveAspectRatio="xMidYMid meet">
        <polygon points="300,30 540,165 540,435 300,570 60,435 60,165" fill="none" stroke="rgba(0,255,255,0.15)" strokeWidth="1.5" className="hex-spin" />
        <polygon points="300,60 510,180 510,420 300,540 90,420 90,180" fill="none" stroke="rgba(0,255,255,0.1)" strokeWidth="1" strokeDasharray="10 5" className="hex-spin-rev" />
        <polygon points="300,100 470,200 470,400 300,500 130,400 130,200" fill="none" stroke="rgba(180,100,255,0.2)" strokeWidth="1.5" />
        <polygon points="300,150 430,220 430,380 300,450 170,380 170,220" fill="none" stroke="rgba(0,255,255,0.25)" strokeWidth="1" strokeDasharray="6 8" className="hex-spin" />
        <polygon points="300,200 380,250 380,350 300,400 220,350 220,250" fill="none" stroke="rgba(255,100,200,0.3)" strokeWidth="2" />
        <circle cx="300" cy="300" r="40" fill="none" stroke="rgba(0,255,255,0.4)" strokeWidth="2" className="alien-eye-pulse" />
        <circle cx="300" cy="300" r="15" fill="none" stroke="rgba(255,0,200,0.6)" strokeWidth="2" />
        <circle cx="300" cy="300" r="5" fill="rgba(255,0,200,0.8)" className="alien-core-pulse" />
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
        {[[300,30],[540,165],[540,435],[300,570],[60,435],[60,165]].map(([x,y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="6" fill="rgba(0,255,255,0.3)" className="node-pulse" style={{animationDelay:`${i*0.2}s`}} />
            <circle cx={x} cy={y} r="3" fill="rgba(0,255,255,0.7)" />
          </g>
        ))}
        <text x="300" y="85" textAnchor="middle" fill="rgba(0,255,255,0.4)" fontSize="9" fontFamily="monospace">XENO-NAV // SECTOR 7G</text>
        <text x="300" y="555" textAnchor="middle" fill="rgba(0,255,255,0.3)" fontSize="9" fontFamily="monospace">ORBITAL DESCENT PROTOCOL</text>
        <text x="75" y="300" fill="rgba(180,100,255,0.4)" fontSize="8" fontFamily="monospace" transform="rotate(-90,75,300)">HULL INTEGRITY 98.7%</text>
        <text x="525" y="300" fill="rgba(180,100,255,0.4)" fontSize="8" fontFamily="monospace" transform="rotate(90,525,300)">SHIELDS NOMINAL</text>
      </svg>

      <svg className="cyborg-pilot" viewBox="0 0 200 160" preserveAspectRatio="xMidYMax meet">
        <rect x="60" y="140" width="80" height="10" rx="3" fill="rgba(0,255,255,0.08)" stroke="rgba(0,255,255,0.15)" strokeWidth="1" />
        <path d="M70,140 L65,90 Q65,80 75,80 L125,80 Q135,80 135,90 L130,140" fill="rgba(0,255,255,0.05)" stroke="rgba(0,255,255,0.12)" strokeWidth="1" />
        <line x1="100" y1="75" x2="100" y2="120" stroke="rgba(0,255,255,0.2)" strokeWidth="5" strokeLinecap="round" />
        <ellipse cx="100" cy="55" rx="14" ry="20" fill="rgba(0,255,255,0.1)" stroke="rgba(0,255,255,0.2)" strokeWidth="1" />
        <ellipse cx="93" cy="50" rx="6" ry="4" fill="rgba(255,0,200,0.3)" className="alien-eye-glow" />
        <ellipse cx="107" cy="50" rx="6" ry="4" fill="rgba(255,0,200,0.3)" className="alien-eye-glow" />
        <ellipse cx="93" cy="50" rx="3" ry="2" fill="rgba(255,0,200,0.7)" />
        <ellipse cx="107" cy="50" rx="3" ry="2" fill="rgba(255,0,200,0.7)" />
        <line x1="90" y1="85" x2="55" y2="105" stroke="rgba(0,255,255,0.15)" strokeWidth="3" strokeLinecap="round" />
        <line x1="110" y1="85" x2="145" y2="105" stroke="rgba(0,255,255,0.15)" strokeWidth="3" strokeLinecap="round" />
        <circle cx="55" cy="105" r="4" fill="rgba(0,255,255,0.1)" stroke="rgba(0,255,255,0.2)" strokeWidth="1" />
        <circle cx="145" cy="105" r="4" fill="rgba(0,255,255,0.1)" stroke="rgba(0,255,255,0.2)" strokeWidth="1" />
        <line x1="95" y1="120" x2="85" y2="145" stroke="rgba(0,255,255,0.12)" strokeWidth="3" strokeLinecap="round" />
        <line x1="105" y1="120" x2="115" y2="145" stroke="rgba(0,255,255,0.12)" strokeWidth="3" strokeLinecap="round" />
        <line x1="86" y1="42" x2="78" y2="38" stroke="rgba(0,255,255,0.3)" strokeWidth="1" />
        <line x1="114" y1="42" x2="122" y2="38" stroke="rgba(0,255,255,0.3)" strokeWidth="1" />
        <circle cx="78" cy="38" r="2" fill="rgba(0,255,255,0.5)" className="node-pulse" />
        <circle cx="122" cy="38" r="2" fill="rgba(0,255,255,0.5)" className="node-pulse" />
        <line x1="100" y1="75" x2="100" y2="40" stroke="rgba(255,0,200,0.15)" strokeWidth="1" strokeDasharray="2 3" />
      </svg>

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

      <div className="alien-hud-top">
        <span className="alien-blink">◆ LIVE FEED</span>
        <span className="alien-title">CYBORG NAVIGATION SYSTEM v7.2.1</span>
        <span className="alien-data">SECTOR {route.id}-ALPHA</span>
      </div>

      <div className="alien-hud-bottom">
        <span className="alien-data">LAT {center[0].toFixed(4)}</span>
        <span className="alien-lock">◈ TOUCHDOWN IMMINENT ◈</span>
        <span className="alien-data">LON {center[1].toFixed(4)}</span>
      </div>

      {/* ═══ PHASE 4: ASTEROIDS — retro vector text ═══ */}
      <div className="asteroids-layer">
        <div className="asteroids-screen-border" />
        <div className="asteroids-text-main">INCOMING</div>
        <div className="asteroids-text-sub">COLLISION COURSE DETECTED</div>
        <div className="asteroids-score">SCORE: 0000042069</div>
        <div className="asteroids-lives">
          <span>▲</span><span>▲</span><span>▲</span>
        </div>
        {/* Vector asteroids floating */}
        {Array.from({ length: 8 }, (_, i) => (
          <svg key={i} className="asteroid-rock" style={{
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
            width: `${30 + Math.random() * 40}px`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${3 + Math.random() * 4}s`,
          }} viewBox="0 0 40 40">
            <polygon points="20,2 35,10 38,25 30,38 12,36 3,22 8,8" fill="none" stroke="white" strokeWidth="1.5" />
          </svg>
        ))}
        {/* Player ship */}
        <svg className="asteroids-ship" viewBox="0 0 30 30">
          <polygon points="15,2 28,28 15,22 2,28" fill="none" stroke="white" strokeWidth="1.5" />
        </svg>
        {/* Bullet trails */}
        <div className="asteroids-bullet b1" />
        <div className="asteroids-bullet b2" />
        <div className="asteroids-bullet b3" />
      </div>

      {/* ═══ PHASE 5: EXPLOSION ═══ */}
      <div className="explode-layer">
        <div className="explosion-flash" />
        <div className="explosion-core" />
        {/* Debris particles */}
        {Array.from({ length: 24 }, (_, i) => {
          const angle = (i / 24) * 360;
          const dist = 100 + Math.random() * 300;
          return (
            <div key={i} className="explosion-debris" style={{
              '--angle': `${angle}deg`,
              '--dist': `${dist}px`,
              '--size': `${2 + Math.random() * 6}px`,
              '--color': i % 3 === 0 ? '#ff4400' : i % 3 === 1 ? '#ffaa00' : '#ff0066',
              animationDelay: `${Math.random() * 0.15}s`,
            }} />
          );
        })}
        {/* Shockwave rings */}
        <div className="shockwave ring1" />
        <div className="shockwave ring2" />
        <div className="explosion-text">DIRECT HIT</div>
      </div>

      {/* ═══ PHASE 6: HEAVEN'S DOOR — angel knocking ═══ */}
      <div className="heaven-layer">
        <div className="heaven-light" />
        <div className="heaven-clouds">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="heaven-cloud" style={{
              left: `${-10 + i * 20}%`,
              top: `${60 + Math.random() * 30}%`,
              animationDelay: `${i * 0.3}s`,
              opacity: 0.3 + Math.random() * 0.4,
            }} />
          ))}
        </div>
        {/* Golden gate / door */}
        <svg className="heaven-gate" viewBox="0 0 300 400" preserveAspectRatio="xMidYMid meet">
          {/* Door frame */}
          <rect x="60" y="50" width="180" height="320" rx="5" fill="none" stroke="rgba(255,215,0,0.6)" strokeWidth="3" />
          {/* Arch top */}
          <path d="M60,150 Q150,20 240,150" fill="none" stroke="rgba(255,215,0,0.7)" strokeWidth="3" />
          {/* Door panels */}
          <rect x="65" y="55" width="85" height="310" fill="rgba(255,215,0,0.05)" stroke="rgba(255,215,0,0.3)" strokeWidth="1" className="heaven-door-left" />
          <rect x="150" y="55" width="85" height="310" fill="rgba(255,215,0,0.05)" stroke="rgba(255,215,0,0.3)" strokeWidth="1" className="heaven-door-right" />
          {/* Door handles */}
          <circle cx="140" cy="220" r="5" fill="rgba(255,215,0,0.6)" />
          <circle cx="160" cy="220" r="5" fill="rgba(255,215,0,0.6)" />
          {/* Cross on door */}
          <line x1="150" y1="80" x2="150" y2="140" stroke="rgba(255,215,0,0.4)" strokeWidth="2" />
          <line x1="120" y1="110" x2="180" y2="110" stroke="rgba(255,215,0,0.4)" strokeWidth="2" />
        </svg>
        {/* Angel silhouette */}
        <svg className="heaven-angel" viewBox="0 0 120 180" preserveAspectRatio="xMidYMid meet">
          {/* Halo */}
          <ellipse cx="60" cy="20" rx="18" ry="6" fill="none" stroke="rgba(255,215,0,0.8)" strokeWidth="2" className="halo-glow" />
          {/* Head */}
          <circle cx="60" cy="35" r="12" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
          {/* Body / robe */}
          <path d="M48,47 L38,140 Q60,155 82,140 L72,47" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
          {/* Wings */}
          <path d="M48,55 Q15,30 10,70 Q20,80 42,65" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
          <path d="M72,55 Q105,30 110,70 Q100,80 78,65" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
          {/* Knocking arm extended */}
          <line x1="72" y1="65" x2="100" y2="55" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" className="angel-knock" />
          <circle cx="100" cy="55" r="3" fill="rgba(255,255,255,0.6)" className="angel-knock" />
        </svg>
        <div className="heaven-text">KNOCKING ON HEAVEN'S DOOR</div>
        <div className="heaven-subtext">✦ THE GATES OPEN ✦</div>
      </div>

      {/* ═══ PHASE 7: BATTLE MODE — tanks & panzers ═══ */}
      <div className="battle-layer">
        <div className="battle-bg" />
        <div className="battle-smoke">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="smoke-puff" style={{
              left: `${Math.random() * 100}%`,
              bottom: `${10 + Math.random() * 30}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }} />
          ))}
        </div>
        {/* Tank 1 — left */}
        <svg className="battle-tank tank-left" viewBox="0 0 200 100" preserveAspectRatio="xMidYMid meet">
          {/* Tracks */}
          <rect x="10" y="65" width="180" height="25" rx="12" fill="rgba(80,90,60,0.8)" stroke="rgba(120,130,80,0.6)" strokeWidth="2" />
          {/* Track wheels */}
          {[30,60,90,120,150].map(x => <circle key={x} cx={x} cy="77" r="8" fill="rgba(50,55,40,0.9)" stroke="rgba(100,110,70,0.5)" strokeWidth="1.5" />)}
          {/* Hull */}
          <polygon points="25,65 40,35 160,35 175,65" fill="rgba(90,100,65,0.85)" stroke="rgba(120,130,80,0.6)" strokeWidth="1.5" />
          {/* Turret */}
          <rect x="70" y="25" width="60" height="20" rx="3" fill="rgba(80,90,55,0.9)" stroke="rgba(110,120,70,0.6)" strokeWidth="1.5" />
          {/* Gun barrel */}
          <rect x="130" y="30" width="55" height="8" rx="2" fill="rgba(70,80,50,0.9)" stroke="rgba(100,110,65,0.6)" strokeWidth="1" />
          {/* Muzzle flash */}
          <polygon points="185,25 200,34 185,43" fill="rgba(255,200,0,0.7)" className="muzzle-flash" />
          {/* Star emblem */}
          <text x="100" y="55" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="14">★</text>
        </svg>
        {/* Tank 2 — right (Panzer style) */}
        <svg className="battle-tank tank-right" viewBox="0 0 200 100" preserveAspectRatio="xMidYMid meet">
          <rect x="10" y="65" width="180" height="25" rx="12" fill="rgba(70,70,60,0.8)" stroke="rgba(100,100,80,0.6)" strokeWidth="2" />
          {[30,60,90,120,150].map(x => <circle key={x} cx={x} cy="77" r="8" fill="rgba(45,45,35,0.9)" stroke="rgba(80,80,60,0.5)" strokeWidth="1.5" />)}
          <polygon points="25,65 40,35 160,35 175,65" fill="rgba(75,75,60,0.85)" stroke="rgba(100,100,75,0.6)" strokeWidth="1.5" />
          <rect x="65" y="22" width="70" height="22" rx="4" fill="rgba(65,65,50,0.9)" stroke="rgba(90,90,65,0.6)" strokeWidth="1.5" />
          <rect x="10" y="29" width="60" height="8" rx="2" fill="rgba(60,60,45,0.9)" stroke="rgba(85,85,60,0.6)" strokeWidth="1" />
          <polygon points="10,20 -5,33 10,46" fill="rgba(255,150,0,0.7)" className="muzzle-flash" />
          {/* Iron cross */}
          <g transform="translate(100,53)">
            <line x1="-6" y1="0" x2="6" y2="0" stroke="rgba(255,255,255,0.5)" strokeWidth="3" />
            <line x1="0" y1="-6" x2="0" y2="6" stroke="rgba(255,255,255,0.5)" strokeWidth="3" />
          </g>
        </svg>
        {/* Explosions in background */}
        <div className="battle-explosion be1" />
        <div className="battle-explosion be2" />
        <div className="battle-explosion be3" />
        <div className="battle-hud">
          <span>◆ BATTLE MODE ENGAGED ◆</span>
          <span>SURVEYING THE DAMAGE</span>
        </div>
        <div className="battle-text-main">TAKE THESE GUNS AWAY</div>
        <div className="battle-text-sub">I CAN'T USE THEM ANYMORE</div>
      </div>

      {/* ═══ PHASE 8: CIVIL WAR — Lincoln points at property ═══ */}
      <div className="civilwar-layer">
        <div className="civilwar-bg" />
        <div className="civilwar-vignette" />
        {/* Abraham Lincoln SVG */}
        <svg className="lincoln-svg" viewBox="0 0 200 400" preserveAspectRatio="xMidYMid meet">
          {/* Top hat */}
          <rect x="65" y="10" width="70" height="80" rx="3" fill="rgba(30,20,10,0.9)" stroke="rgba(80,60,30,0.5)" strokeWidth="1.5" />
          <rect x="50" y="85" width="100" height="10" rx="2" fill="rgba(30,20,10,0.9)" stroke="rgba(80,60,30,0.5)" strokeWidth="1" />
          {/* Hat band */}
          <rect x="65" y="75" width="70" height="8" fill="rgba(60,40,20,0.8)" />
          {/* Face */}
          <ellipse cx="100" cy="120" rx="30" ry="35" fill="rgba(210,180,140,0.25)" stroke="rgba(180,150,100,0.5)" strokeWidth="1" />
          {/* Beard */}
          <path d="M75,130 Q80,170 100,175 Q120,170 125,130" fill="rgba(50,35,20,0.4)" stroke="rgba(80,60,30,0.3)" strokeWidth="1" />
          {/* Eyes */}
          <circle cx="88" cy="112" r="3" fill="rgba(40,30,20,0.7)" />
          <circle cx="112" cy="112" r="3" fill="rgba(40,30,20,0.7)" />
          {/* Nose */}
          <line x1="100" y1="115" x2="100" y2="130" stroke="rgba(180,140,100,0.4)" strokeWidth="1.5" />
          {/* Mouth */}
          <line x1="90" y1="140" x2="110" y2="140" stroke="rgba(150,100,70,0.4)" strokeWidth="1" />
          {/* Body — Civil War coat */}
          <path d="M65,175 L55,320 Q100,340 145,320 L135,175" fill="rgba(30,40,80,0.6)" stroke="rgba(60,70,120,0.5)" strokeWidth="1.5" />
          {/* Double-breasted buttons */}
          {[195, 215, 235, 255, 275, 295].map(y => (
            <g key={y}>
              <circle cx="85" cy={y} r="3" fill="rgba(200,180,50,0.6)" />
              <circle cx="115" cy={y} r="3" fill="rgba(200,180,50,0.6)" />
            </g>
          ))}
          {/* Belt */}
          <rect x="60" y="260" width="80" height="6" fill="rgba(60,40,20,0.7)" />
          <rect x="95" y="258" width="10" height="10" rx="1" fill="rgba(200,180,50,0.5)" />
          {/* Right arm — pointing */}
          <line x1="135" y1="190" x2="190" y2="170" stroke="rgba(30,40,80,0.6)" strokeWidth="8" strokeLinecap="round" />
          <line x1="190" y1="170" x2="198" y2="165" stroke="rgba(210,180,140,0.3)" strokeWidth="4" strokeLinecap="round" />
          {/* Left arm down */}
          <line x1="65" y1="190" x2="50" y2="260" stroke="rgba(30,40,80,0.6)" strokeWidth="8" strokeLinecap="round" />
          {/* Legs */}
          <line x1="85" y1="320" x2="80" y2="390" stroke="rgba(30,30,30,0.6)" strokeWidth="8" strokeLinecap="round" />
          <line x1="115" y1="320" x2="120" y2="390" stroke="rgba(30,30,30,0.6)" strokeWidth="8" strokeLinecap="round" />
          {/* Boots */}
          <ellipse cx="80" cy="392" rx="12" ry="5" fill="rgba(30,20,10,0.7)" />
          <ellipse cx="120" cy="392" rx="12" ry="5" fill="rgba(30,20,10,0.7)" />
        </svg>
        {/* Pointing indicator — arrow from Lincoln's hand */}
        <div className="lincoln-point-arrow">
          <svg viewBox="0 0 80 30">
            <polygon points="0,10 60,10 60,0 80,15 60,30 60,20 0,20" fill="rgba(200,180,50,0.6)" />
          </svg>
        </div>
        {/* Property label */}
        <div className="lincoln-property-label">
          <div className="lincoln-label-text">THIS PROPERTY</div>
          <div className="lincoln-label-name">{route.name}</div>
        </div>
        <div className="civilwar-text">FOUR SCORE AND SEVEN TRAILS AGO</div>
        <div className="civilwar-subtext">A. LINCOLN DESIGNATES THIS ROUTE</div>
        {/* Old paper / parchment texture overlay */}
        <div className="civilwar-paper" />
      </div>

      {/* ═══ PHASE 9: KEN BURNS — documentary zoom ═══ */}
      <div className="burns-layer">
        <div className="burns-bg" />
        {/* Slow-zoom photo frame */}
        <div className="burns-photo-frame">
          <div className="burns-photo" style={{ backgroundImage: `url(${tileUrl})` }} />
          <div className="burns-photo-border" />
        </div>
        {/* Documentary narration text — appears letter by letter style */}
        <div className="burns-narration">
          <div className="burns-quote">"The trail stretched before them,</div>
          <div className="burns-quote q2">a ribbon of earth cutting through Georgetown..."</div>
        </div>
        {/* Route card reveal */}
        <div className="burns-card">
          <div className="burns-card-inner">
            <div className="burns-card-header">— {route.name} —</div>
            <div className="burns-card-color" style={{ background: route.color, boxShadow: `0 0 12px ${route.color}` }} />
            <div className="burns-card-stats">
              <span>{route.distance} MILES</span>
              <span>·</span>
              <span>{route.duration}</span>
              <span>·</span>
              <span>{route.type.toUpperCase()}</span>
            </div>
            <div className="burns-card-coords">{center[0].toFixed(4)}°N · {Math.abs(center[1]).toFixed(4)}°W</div>
          </div>
        </div>
        <div className="burns-credit">A KEN BURNS PRODUCTION</div>
        {/* Sepia film grain */}
        <div className="burns-grain" />
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
