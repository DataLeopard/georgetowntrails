import { useState } from 'react';
import Map from './components/Map';
import Sidebar from './components/Sidebar';
import { routes } from './data/routes';
import './App.css';

export default function App() {
  const [activeRouteId, setActiveRouteId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleRouteClick = (id) => {
    setActiveRouteId(prev => prev === id ? null : id);
  };

  return (
    <div className="app-shell">
      <Sidebar
        routes={routes}
        activeRouteId={activeRouteId}
        onRouteClick={handleRouteClick}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(o => !o)}
      />
      <main className={`map-container ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <Map
          routes={routes}
          activeRouteId={activeRouteId}
          onRouteClick={handleRouteClick}
        />
        {activeRouteId && (
          <div className="active-route-banner">
            {(() => {
              const r = routes.find(r => r.id === activeRouteId);
              return r ? (
                <>
                  <span className="banner-dot" style={{ background: r.color }} />
                  <strong>{r.name}</strong>
                  <span>{r.distance} mi · {r.duration}</span>
                  <button onClick={() => setActiveRouteId(null)}>✕</button>
                </>
              ) : null;
            })()}
          </div>
        )}
      </main>
    </div>
  );
}
