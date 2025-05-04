import React from 'react';

interface SimpleMapProps {
  apiKey: string;
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{ lat: number; lng: number; title?: string }>;
  height?: string;
  width?: string;
}

/**
 * Eine sehr einfache Map-Komponente, die nur einen Link zur Google Maps-Website anzeigt
 * anstatt eine interaktive Karte zu laden. Dies ist eine Fallback-Lösung für
 * Umgebungen mit Leistungsproblemen.
 */
export default function SimpleMap({
  apiKey,
  center = { lat: 48.137154, lng: 11.576124 },
  zoom = 10,
  markers = [],
  height = '400px',
  width = '100%'
}: SimpleMapProps) {
  // Generiere Google Maps URL basierend auf den Parametern
  const generateGoogleMapsUrl = () => {
    let url = `https://www.google.com/maps?q=${center.lat},${center.lng}`;
    if (zoom) {
      url += `&z=${zoom}`;
    }
    return url;
  };

  return (
    <div
      style={{
        height,
        width,
        border: '1px solid #e2e8f0',
        borderRadius: '0.375rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        backgroundColor: '#f8fafc',
      }}
    >
      <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>Karte</h3>
        <p style={{ margin: '0', color: '#64748b', fontSize: '0.875rem' }}>
          {markers.length > 0 
            ? `${markers.length} Standorte markiert`
            : 'Keine Markierungen'
          }
        </p>
      </div>

      <a
        href={generateGoogleMapsUrl()}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#3b82f6',
          color: 'white',
          borderRadius: '0.25rem',
          textDecoration: 'none',
          fontSize: '0.875rem',
          fontWeight: 500,
        }}
      >
        In Google Maps öffnen
      </a>

      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
        <small style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
          © Google Maps
        </small>
      </div>
    </div>
  );
}