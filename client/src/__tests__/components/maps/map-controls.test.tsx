import React from 'react';
import { render, screen } from '../../test-utils';
import { Button } from '@/components/ui/button';
import { Map as MapIcon, MapPin } from 'lucide-react';

// Mock für die MapContainer-Komponente, da wir in der Testumgebung keine echte Karte rendern können
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-marker">{children}</div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-popup">{children}</div>
  ),
  useMap: () => ({
    setView: jest.fn(),
  }),
  useMapEvents: () => ({
    on: jest.fn(),
    off: jest.fn(),
  }),
}));

// Tests für Map-Control-Komponenten
describe('Map Control Components', () => {
  it('rendert einen Button mit Kartenicon', () => {
    render(
      <Button variant="outline" size="sm">
        <MapIcon className="h-4 w-4 mr-1" /> Kartenansicht
      </Button>
    );
    
    expect(screen.getByRole('button', { name: /kartenansicht/i })).toBeInTheDocument();
  });
  
  it('rendert einen Button mit Marker-Icon', () => {
    render(
      <Button variant="outline" size="sm">
        <MapPin className="h-4 w-4 mr-1" /> Marker setzen
      </Button>
    );
    
    expect(screen.getByRole('button', { name: /marker setzen/i })).toBeInTheDocument();
  });
});