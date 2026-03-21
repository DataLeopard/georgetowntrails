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
        ref={detailMapRef}
        className="detail-map-pane"
        style={{
          flex: isSplit ? '1 1 60%' : '1 1 100%',
          height: '100%',
          transition: 'flex 0.3s ease',
        }}
        role="application"
        aria-label="Trail map of Georgetown, Texas — detail view"
      />

      {/* Overview map (right panel, only when split) */}
      {isSplit && (
        <div className="overview-pane">
          <div className="overview-label">OVERVIEW</div>
          <div
            ref={overviewMapRef}
            style={{ width: '100%', height: '100%' }}
            role="application"
            aria-label="Trail map overview"
          />
        </div>
      )}

      {/* Split indicator */}
      {isSplit && (
        <div className="split-divider" />
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
