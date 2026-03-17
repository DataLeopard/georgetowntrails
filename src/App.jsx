import { useState, useCallback, useEffect } from 'react';
import Map from './components/Map';
import Sidebar from './components/Sidebar';
import { routes } from './data/routes';
import './App.css';

export default function App() {
  const [activeRouteId, setActiveRouteId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleRouteClick = useCallback((id) => {
    setActiveRouteId(prev => prev === id ? null : id);
  }, []);

  // Escape key dismisses active route
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setActiveRouteId(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeRoute = activeRouteId ? routes.find(r => r.id === activeRouteId) : null;

  return (
    <div className="app-shell">
      <Sidebar
        routes={routes}
        activeRouteId={activeRouteId}
        onRouteClick={handleRouteClick}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(o => !o)}
      />
      <main className={`map-container ${sidebarOpen ? 'sidebar-open' : ''}`} aria-label="Trail map view">
        <Map
          routes={routes}
          activeRouteId={activeRouteId}
          onRouteClick={handleRouteClick}
        />
        {activeRoute && (
          <div className="active-route-banner">
            <span className="banner-dot" style={{ background: activeRoute.color }} />
            <strong>{activeRoute.name}</strong>
            <span>{activeRoute.distance} mi · {activeRoute.duration}</span>
            <button onClick={() => setActiveRouteId(null)} aria-label="Deselect route">✕</button>
          </div>
        )}
      </main>
    </div>
  );
}
