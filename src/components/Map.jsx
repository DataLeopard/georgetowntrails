import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons broken by Vite bundling
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

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

export default function Map({ routes, activeRouteId, onRouteClick }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const polylinesRef = useRef({});
  const markersRef = useRef({});
  const [mapLoading, setMapLoading] = useState(true);

  // Keep onRouteClick in a ref to avoid stale closures
  const onRouteClickRef = useRef(onRouteClick);
  useEffect(() => { onRouteClickRef.current = onRouteClick; });

  // Init map once
  useEffect(() => {
    if (mapInstanceRef.current) return;
    mapInstanceRef.current = L.map(mapRef.current, {
      center: [30.6627, -97.6779], // Georgetown TX center
      zoom: 12,
      zoomControl: true,
    });

    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);

    tileLayer.on('load', () => setMapLoading(false));

    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Draw routes (only when routes change)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !routes.length) return;

    // Clear old polylines and markers
    Object.values(polylinesRef.current).forEach(p => p.remove());
    Object.values(markersRef.current).forEach(m => m.remove());
    polylinesRef.current = {};
    markersRef.current = {};

    routes.forEach((route) => {
      const color = safeColor(route.color);

      const poly = L.polyline(route.coords, {
        color,
        weight: 3,
        opacity: 0.6,
        lineJoin: 'round',
        lineCap: 'round',
      }).addTo(map);

      poly.on('click', () => onRouteClickRef.current(route.id));

      const safeName = escapeHtml(route.name);
      const safeDistance = escapeHtml(String(route.distance));
      const safeDuration = escapeHtml(route.duration);
      poly.bindTooltip(`<strong>${safeName}</strong><br>${safeDistance} mi · ${safeDuration}`, {
        sticky: true,
        className: 'route-tooltip',
      });

      polylinesRef.current[route.id] = poly;

      // Start marker
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
      marker.on('click', () => onRouteClickRef.current(route.id));
      markersRef.current[route.id] = marker;
    });
  }, [routes]);

  // Style updates + fly to active route (depends on activeRouteId)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Reset all to default style
    Object.values(polylinesRef.current).forEach(p => {
      p.setStyle({ weight: 3, opacity: 0.6 });
    });

    if (activeRouteId) {
      const activePoly = polylinesRef.current[activeRouteId];
      if (activePoly) {
        activePoly.setStyle({ weight: 5, opacity: 1 });
        map.flyToBounds(activePoly.getBounds(), { padding: [40, 40], duration: 0.8 });
      }
      // Dim non-active routes
      Object.entries(polylinesRef.current).forEach(([id, p]) => {
        if (Number(id) !== activeRouteId) {
          p.setStyle({ weight: 3, opacity: 0.35 });
        }
      });
    }
  }, [activeRouteId]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div
        ref={mapRef}
        style={{ width: '100%', height: '100%' }}
        role="application"
        aria-label="Trail map of Georgetown, Texas"
      />
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
