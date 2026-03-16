import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons broken by Vite bundling
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function Map({ routes, activeRouteId, onRouteClick }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const polylinesRef = useRef({});
  const markersRef = useRef({});

  // Init map once
  useEffect(() => {
    if (mapInstanceRef.current) return;
    mapInstanceRef.current = L.map(mapRef.current, {
      center: [30.6627, -97.6779], // Georgetown TX center
      zoom: 12,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);

    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Draw/update routes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !routes.length) return;

    // Clear old polylines and markers
    Object.values(polylinesRef.current).forEach(p => p.remove());
    Object.values(markersRef.current).forEach(m => m.remove());
    polylinesRef.current = {};
    markersRef.current = {};

    routes.forEach((route) => {
      const isActive = route.id === activeRouteId;
      const weight = isActive ? 5 : 3;
      const opacity = isActive ? 1 : 0.6;

      const poly = L.polyline(route.coords, {
        color: route.color,
        weight,
        opacity,
        lineJoin: 'round',
        lineCap: 'round',
      }).addTo(map);

      poly.on('click', () => onRouteClick(route.id));
      poly.bindTooltip(`<strong>${route.name}</strong><br>${route.distance} mi · ${route.duration}`, {
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
          background:${route.color};
          border:2px solid white;
          box-shadow:0 0 4px rgba(0,0,0,0.4);
        "></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });

      const marker = L.marker(route.coords[0], { icon: startIcon }).addTo(map);
      marker.on('click', () => onRouteClick(route.id));
      markersRef.current[route.id] = marker;
    });
  }, [routes, activeRouteId, onRouteClick]);

  // Fly to active route
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !activeRouteId) return;
    const poly = polylinesRef.current[activeRouteId];
    if (poly) {
      map.flyToBounds(poly.getBounds(), { padding: [40, 40], duration: 0.8 });
      poly.setStyle({ weight: 5, opacity: 1 });
    }
    // Dim others
    Object.entries(polylinesRef.current).forEach(([id, p]) => {
      if (Number(id) !== activeRouteId) {
        p.setStyle({ weight: 3, opacity: 0.35 });
      }
    });
  }, [activeRouteId]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
}
