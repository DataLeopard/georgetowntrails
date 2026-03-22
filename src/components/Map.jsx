import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons broken by Vite bundling
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const SPLIT_ZOOM_THRESHOLD = 14;
const OVERVIEW_ZOOM = 12;
const GEO_CENTER = [30.6627, -97.6779];

/** Escape HTML to prevent XSS in tooltips */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/** Validate a hex color to prevent XSS in divIcon style injection */
function safeColor(color) {
  return /^#[0-9a-fA-F]{3,8}$/.test(color) ? color : '#888';
}

/** Draw routes on a Leaflet map, returns { polylines, markers } refs */
function drawRoutes(map, routes, onClickRef) {
  const polylines = {};
  const markers = {};

  routes.forEach((route) => {
    const color = safeColor(route.color);

    const poly = L.polyline(route.coords, {
      color,
      weight: 3,
      opacity: 0.6,
      lineJoin: 'round',
      lineCap: 'round',
    }).addTo(map);

    poly.on('click', () => onClickRef.current(route.id));

    const safeName = escapeHtml(route.name);
    const safeDistance = escapeHtml(String(route.distance));
    const safeDuration = escapeHtml(route.duration);
    poly.bindTooltip(`<strong>${safeName}</strong><br>${safeDistance} mi · ${safeDuration}`, {
      sticky: true,
      className: 'route-tooltip',
    });

    polylines[route.id] = poly;

    const startIcon = L.divIcon({
      className: '',
      html: `<div style="
        width:12px;height:12px;
        border-radius:50%;
        background:${color};
        border:2px solid white;
        box-shadow:0 0 4px rgba(0,0,0,0.4);
      "></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    });

    const marker = L.marker(route.coords[0], { icon: startIcon }).addTo(map);
    marker.on('click', () => onClickRef.current(route.id));
    markers[route.id] = marker;
  });

  return { polylines, markers };
}

/** Apply active/inactive styling to polylines */
function styleRoutes(polylines, activeRouteId) {
  Object.values(polylines).forEach(p => {
    p.setStyle({ weight: 3, opacity: 0.6 });
  });

  if (activeRouteId) {
    const activePoly = polylines[activeRouteId];
    if (activePoly) {
      activePoly.setStyle({ weight: 5, opacity: 1 });
    }
    Object.entries(polylines).forEach(([id, p]) => {
      if (Number(id) !== activeRouteId) {
        p.setStyle({ weight: 3, opacity: 0.35 });
      }
    });
  }
}

export default function Map({ routes, activeRouteId, onRouteClick }) {
  const detailMapRef = useRef(null);
  const overviewMapRef = useRef(null);
  const detailInstanceRef = useRef(null);
  const overviewInstanceRef = useRef(null);
  const detailPolylinesRef = useRef({});
  const detailMarkersRef = useRef({});
  const overviewPolylinesRef = useRef({});
  const overviewMarkersRef = useRef({});
  const viewportRectRef = useRef(null);
  const [mapLoading, setMapLoading] = useState(true);
  const [isSplit, setIsSplit] = useState(false);

  const onRouteClickRef = useRef(onRouteClick);
  useEffect(() => { onRouteClickRef.current = onRouteClick; });

  // Update viewport rectangle on overview map
  const updateViewportRect = useCallback(() => {
    const detailMap = detailInstanceRef.current;
    const overviewMap = overviewInstanceRef.current;
    if (!detailMap || !overviewMap) return;

    const bounds = detailMap.getBounds();

    if (viewportRectRef.current) {
      viewportRectRef.current.setBounds(bounds);
    } else {
      viewportRectRef.current = L.rectangle(bounds, {
        color: '#3b82f6',
        weight: 2,
        fillOpacity: 0.1,
        dashArray: '6 4',
        interactive: false,
      }).addTo(overviewMap);
    }
  }, []);

  // Init detail (main) map
  useEffect(() => {
    if (detailInstanceRef.current) return;
    detailInstanceRef.current = L.map(detailMapRef.current, {
      center: GEO_CENTER,
      zoom: OVERVIEW_ZOOM,
      zoomControl: true,
    });

    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(detailInstanceRef.current);

    tileLayer.on('load', () => setMapLoading(false));

    // Monitor zoom to toggle split mode
    detailInstanceRef.current.on('zoomend moveend', () => {
      const zoom = detailInstanceRef.current.getZoom();
      setIsSplit(zoom >= SPLIT_ZOOM_THRESHOLD);
      if (overviewInstanceRef.current) {
        updateViewportRect();
      }
    });

    return () => {
      detailInstanceRef.current?.remove();
      detailInstanceRef.current = null;
    };
  }, [updateViewportRect]);

  // Init overview map when split activates
  useEffect(() => {
    if (!isSplit) {
      // Clean up overview map when exiting split
      if (overviewInstanceRef.current) {
        overviewInstanceRef.current.remove();
        overviewInstanceRef.current = null;
        viewportRectRef.current = null;
        overviewPolylinesRef.current = {};
        overviewMarkersRef.current = {};
      }
      return;
    }

    if (overviewInstanceRef.current) return;
    if (!overviewMapRef.current) return;

    overviewInstanceRef.current = L.map(overviewMapRef.current, {
      center: GEO_CENTER,
      zoom: OVERVIEW_ZOOM,
      zoomControl: false,
      dragging: true,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(overviewInstanceRef.current);

    // Draw routes on overview
    if (routes.length) {
      const { polylines, markers } = drawRoutes(overviewInstanceRef.current, routes, onRouteClickRef);
      overviewPolylinesRef.current = polylines;
      overviewMarkersRef.current = markers;
      styleRoutes(overviewPolylinesRef.current, activeRouteId);
    }

    // Click on overview to pan detail map there
    overviewInstanceRef.current.on('click', (e) => {
      const detailMap = detailInstanceRef.current;
      if (detailMap) {
        detailMap.setView(e.latlng, detailMap.getZoom(), { animate: true });
      }
    });

    // Draw initial viewport rect
    updateViewportRect();

    return () => {
      if (overviewInstanceRef.current) {
        overviewInstanceRef.current.remove();
        overviewInstanceRef.current = null;
        viewportRectRef.current = null;
        overviewPolylinesRef.current = {};
        overviewMarkersRef.current = {};
      }
    };
  }, [isSplit, routes, activeRouteId, updateViewportRect]);

  // Invalidate map sizes when split changes
  useEffect(() => {
    setTimeout(() => {
      detailInstanceRef.current?.invalidateSize();
      overviewInstanceRef.current?.invalidateSize();
      updateViewportRect();
    }, 50);
  }, [isSplit, updateViewportRect]);

  // Draw routes on detail map
  useEffect(() => {
    const map = detailInstanceRef.current;
    if (!map || !routes.length) return;

    Object.values(detailPolylinesRef.current).forEach(p => p.remove());
    Object.values(detailMarkersRef.current).forEach(m => m.remove());

    const { polylines, markers } = drawRoutes(map, routes, onRouteClickRef);
    detailPolylinesRef.current = polylines;
    detailMarkersRef.current = markers;
  }, [routes]);

  // Style active route on detail map + fly to bounds
  useEffect(() => {
    const map = detailInstanceRef.current;
    if (!map) return;

    styleRoutes(detailPolylinesRef.current, activeRouteId);

    if (activeRouteId) {
      const activePoly = detailPolylinesRef.current[activeRouteId];
      if (activePoly) {
        map.flyToBounds(activePoly.getBounds(), { padding: [40, 40], duration: 0.8 });
      }
    }
  }, [activeRouteId]);

  // Style active route on overview map
  useEffect(() => {
    if (!overviewInstanceRef.current) return;
    styleRoutes(overviewPolylinesRef.current, activeRouteId);
  }, [activeRouteId]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex' }}>
      {/* Detail map (left in split, full otherwise) */}
      <div
        className={`detail-map-wrapper ${isSplit ? 'split-active' : ''}`}
        style={{
          flex: isSplit ? '1 1 60%' : '1 1 100%',
          height: '100%',
          transition: 'flex 0.3s ease',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          ref={detailMapRef}
          className="detail-map-pane"
          style={{ width: '100%', height: '100%' }}
          role="application"
          aria-label="Trail map of Georgetown, Texas — detail view"
        />

        {/* Detail HUD overlay — only in split mode */}
        {isSplit && (
          <div className="detail-hud-overlay">
            {/* Subtle vignette */}
            <div className="detail-vignette" />

            {/* Minimal crosshair */}
            <svg className="detail-crosshair" viewBox="0 0 300 300" preserveAspectRatio="xMidYMid meet">
              {/* Thin crosshair lines */}
              <line x1="150" y1="0" x2="150" y2="120" stroke="rgba(0,255,65,0.2)" strokeWidth="0.5" />
              <line x1="150" y1="180" x2="150" y2="300" stroke="rgba(0,255,65,0.2)" strokeWidth="0.5" />
              <line x1="0" y1="150" x2="120" y2="150" stroke="rgba(0,255,65,0.2)" strokeWidth="0.5" />
              <line x1="180" y1="150" x2="300" y2="150" stroke="rgba(0,255,65,0.2)" strokeWidth="0.5" />
              {/* Small center circle */}
              <circle cx="150" cy="150" r="40" fill="none" stroke="rgba(0,255,65,0.15)" strokeWidth="1" />
              <circle cx="150" cy="150" r="3" fill="rgba(0,255,65,0.4)" />
              {/* Corner brackets */}
              <path d="M20,20 L20,50 M20,20 L50,20" fill="none" stroke="rgba(0,255,65,0.3)" strokeWidth="1.5" />
              <path d="M280,20 L280,50 M280,20 L250,20" fill="none" stroke="rgba(0,255,65,0.3)" strokeWidth="1.5" />
              <path d="M20,280 L20,250 M20,280 L50,280" fill="none" stroke="rgba(0,255,65,0.3)" strokeWidth="1.5" />
              <path d="M280,280 L280,250 M280,280 L250,280" fill="none" stroke="rgba(0,255,65,0.3)" strokeWidth="1.5" />
            </svg>

            {/* HUD labels */}
            <div className="detail-hud-top">
              <span className="scope-label-blink">● LIVE</span>
              <span className="scope-data">DETAIL VIEW</span>
              <span className="scope-data">NVG ON</span>
            </div>
            <div className="detail-hud-bottom">
              <span className="scope-data">GRID 4F-7A</span>
              <span className="scope-label-pulse">◉ TRACKING</span>
              <span className="scope-data">IR MODE</span>
            </div>
          </div>
        )}
      </div>

      {/* Overview map (right panel, only when split) — submarine targeting scope */}
      {isSplit && (
        <div className="overview-pane scope-panel">
          {/* Map underneath */}
          <div
            ref={overviewMapRef}
            style={{ width: '100%', height: '100%' }}
            role="application"
            aria-label="Trail map overview — targeting scope"
          />

          {/* Scope overlay HUD */}
          <div className="scope-overlay">
            {/* Circular vignette */}
            <div className="scope-vignette" />

            {/* Crosshair SVG */}
            <svg className="scope-crosshair" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet">
              {/* Outer ring */}
              <circle cx="200" cy="200" r="180" fill="none" stroke="rgba(0,255,65,0.35)" strokeWidth="2" />
              <circle cx="200" cy="200" r="160" fill="none" stroke="rgba(0,255,65,0.15)" strokeWidth="1" strokeDasharray="8 6" />
              <circle cx="200" cy="200" r="120" fill="none" stroke="rgba(0,255,65,0.2)" strokeWidth="1" />
              <circle cx="200" cy="200" r="60" fill="none" stroke="rgba(0,255,65,0.3)" strokeWidth="1.5" />
              <circle cx="200" cy="200" r="6" fill="rgba(255,60,60,0.8)" />

              {/* Crosshair lines */}
              <line x1="200" y1="10" x2="200" y2="140" stroke="rgba(0,255,65,0.4)" strokeWidth="1" />
              <line x1="200" y1="260" x2="200" y2="390" stroke="rgba(0,255,65,0.4)" strokeWidth="1" />
              <line x1="10" y1="200" x2="140" y2="200" stroke="rgba(0,255,65,0.4)" strokeWidth="1" />
              <line x1="260" y1="200" x2="390" y2="200" stroke="rgba(0,255,65,0.4)" strokeWidth="1" />

              {/* Range tick marks */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => {
                const rad = (angle * Math.PI) / 180;
                const x1 = 200 + 170 * Math.cos(rad);
                const y1 = 200 + 170 * Math.sin(rad);
                const x2 = 200 + 185 * Math.cos(rad);
                const y2 = 200 + 185 * Math.sin(rad);
                return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(0,255,65,0.5)" strokeWidth="2" />;
              })}

              {/* Corner brackets */}
              <path d="M30,30 L30,70 M30,30 L70,30" fill="none" stroke="rgba(0,255,65,0.5)" strokeWidth="2" />
              <path d="M370,30 L370,70 M370,30 L330,30" fill="none" stroke="rgba(0,255,65,0.5)" strokeWidth="2" />
              <path d="M30,370 L30,330 M30,370 L70,370" fill="none" stroke="rgba(0,255,65,0.5)" strokeWidth="2" />
              <path d="M370,370 L370,330 M370,370 L330,370" fill="none" stroke="rgba(0,255,65,0.5)" strokeWidth="2" />

              {/* Diamond target indicator */}
              <polygon points="200,170 230,200 200,230 170,200" fill="none" stroke="rgba(255,60,60,0.5)" strokeWidth="1.5" />
            </svg>

            {/* Scan line */}
            <div className="scope-scanline" />

            {/* HUD data readouts */}
            <div className="scope-hud-top">
              <span className="scope-label-blink">● REC</span>
              <span>TACTICAL OVERVIEW</span>
              <span className="scope-data">ZOOM 12x</span>
            </div>

            <div className="scope-hud-bottom">
              <span className="scope-data">LAT 30.6627</span>
              <span className="scope-label-pulse">◉ TARGET LOCK</span>
              <span className="scope-data">LON -97.6779</span>
            </div>

            <div className="scope-hud-left">
              <div className="scope-data">ALT</div>
              <div className="scope-data">3200ft</div>
              <div className="scope-rangebar" />
            </div>

            <div className="scope-hud-right">
              <div className="scope-data">RNG</div>
              <div className="scope-data">1.4mi</div>
              <div className="scope-rangebar" />
            </div>
          </div>
        </div>
      )}

      {/* Split divider — military style */}
      {isSplit && (
        <div className="split-divider-military">
          <div className="divider-line" />
          <div className="divider-glow" />
          <div className="divider-notch divider-notch-top" />
          <div className="divider-notch divider-notch-mid" />
          <div className="divider-notch divider-notch-bot" />
          <div className="divider-label">◄ DETAIL │ SCOPE ►</div>
        </div>
      )}

      {mapLoading && (
        <div className="map-loading-overlay">
          <div className="map-spinner" />
          <span>Loading map tiles...</span>
        </div>
      )}
      {!routes.length && !mapLoading && (
        <div className="map-empty-state">
          <div className="map-empty-icon">🗺️</div>
          <h2>No Routes Yet</h2>
          <p>Add your first trail or route to see it on the map.</p>
        </div>
      )}
    </div>
  );
}
