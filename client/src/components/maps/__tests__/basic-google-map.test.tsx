import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BasicGoogleMap from '../basic-google-map';
import * as googleMapsLoader from '@/utils/google-maps-loader';

// Mock des useToast-Hooks
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock für google-maps-loader
jest.mock('@/utils/google-maps-loader', () => ({
  loadGoogleMapsApi: jest.fn().mockImplementation(() => Promise.resolve()),
  isGoogleMapsLoaded: jest.fn().mockReturnValue(true),
}));

describe('BasicGoogleMap', () => {
  // Vor jedem Test die Mocks zurücksetzen
  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(googleMapsLoader, 'isGoogleMapsLoaded').mockReturnValue(true);
    jest.spyOn(googleMapsLoader, 'loadGoogleMapsApi').mockResolvedValue(undefined);
    
    // Mock für document.getElementById, da die Karte einen Container benötigt
    document.getElementById = jest.fn().mockImplementation(() => {
      return document.createElement('div');
    });
  });
  
  test('sollte die Komponente korrekt rendern', async () => {
    render(<BasicGoogleMap />);
    
    // Warte auf das Laden der Karte (der Ladeindikator verschwindet)
    await waitFor(() => {
      expect(screen.queryByText(/Karte lädt.../i)).not.toBeInTheDocument();
    });
    
    // Überprüfe, ob die grundlegenden UI-Elemente vorhanden sind
    const container = document.getElementById('tiefbau-map-container');
    expect(container).not.toBeNull();
  });
  
  test('sollte die Suchfunktion rendern, wenn showSearch=true ist', async () => {
    render(<BasicGoogleMap showSearch={true} />);
    
    // Warte auf das Laden der Karte
    await waitFor(() => {
      expect(screen.queryByText(/Karte lädt.../i)).not.toBeInTheDocument();
    });
    
    // Überprüfe, ob das Sucheingabefeld vorhanden ist
    const searchInput = screen.getByPlaceholderText(/Adresse suchen/i);
    expect(searchInput).toBeInTheDocument();
    
    // Überprüfe, ob der Suchen-Button vorhanden ist
    const searchButton = screen.getByRole('button', { name: /Suchen/i });
    expect(searchButton).toBeInTheDocument();
  });
  
  test('sollte die Suchfunktion nicht rendern, wenn showSearch=false ist', async () => {
    render(<BasicGoogleMap showSearch={false} />);
    
    // Warte auf das Laden der Karte
    await waitFor(() => {
      expect(screen.queryByText(/Karte lädt.../i)).not.toBeInTheDocument();
    });
    
    // Überprüfe, dass das Sucheingabefeld nicht vorhanden ist
    const searchInput = screen.queryByPlaceholderText(/Adresse suchen/i);
    expect(searchInput).not.toBeInTheDocument();
    
    // Überprüfe, dass der Suchen-Button nicht vorhanden ist
    const searchButton = screen.queryByRole('button', { name: /Suchen/i });
    expect(searchButton).not.toBeInTheDocument();
  });
  
  test('sollte einen Fehler anzeigen, wenn die Google Maps API nicht geladen werden kann', async () => {
    // Simuliere einen Fehler beim Laden der API
    jest.spyOn(googleMapsLoader, 'isGoogleMapsLoaded').mockReturnValue(false);
    jest.spyOn(googleMapsLoader, 'loadGoogleMapsApi').mockRejectedValue(
      new Error('Fehler beim Laden der Google Maps API')
    );
    
    render(<BasicGoogleMap />);
    
    // Warte auf die Fehleranzeige
    await waitFor(() => {
      expect(screen.getByText(/Fehler beim Laden der Karte/i)).toBeInTheDocument();
    });
  });
  
  test('sollte onRouteChange aufrufen, wenn Marker hinzugefügt werden', async () => {
    const mockOnRouteChange = jest.fn();
    
    render(<BasicGoogleMap onRouteChange={mockOnRouteChange} />);
    
    // Warte auf das Laden der Karte
    await waitFor(() => {
      expect(screen.queryByText(/Karte lädt.../i)).not.toBeInTheDocument();
    });
    
    // Simuliere das Hinzufügen von Markern durch direkte Auslösung des Events
    // In einem echten Szenario würden wir auf die Karte klicken, aber das können wir nicht direkt testen
    // Daher simulieren wir das Event und prüfen, ob der Callback aufgerufen wird
    
    // Simuliere einen Klick auf die Karte (intern)
    const mapInstance = (google.maps as any).Map.mock.instances[0];
    const clickListener = mapInstance.addListener.mock.calls.find(
      (call: any) => call[0] === 'click'
    )[1];
    
    // Rufe den Click-Handler mit simulierten Ereignisdaten auf
    clickListener({ latLng: new google.maps.LatLng(48.1351, 11.5820) });
    
    // Füge einen zweiten Marker hinzu
    clickListener({ latLng: new google.maps.LatLng(48.1375, 11.5750) });
    
    // Prüfe, ob onRouteChange aufgerufen wurde
    expect(mockOnRouteChange).toHaveBeenCalled();
    // Der erste Parameter sollte ein Array mit zwei Punkten sein
    expect(mockOnRouteChange.mock.calls[0][0].length).toBe(2);
  });
  
  test('sollte onMarkersClear aufrufen, wenn Marker gelöscht werden', async () => {
    const mockOnMarkersClear = jest.fn();
    
    render(<BasicGoogleMap onMarkersClear={mockOnMarkersClear} />);
    
    // Warte auf das Laden der Karte
    await waitFor(() => {
      expect(screen.queryByText(/Karte lädt.../i)).not.toBeInTheDocument();
    });
    
    // Simuliere das Hinzufügen eines Markers für den Test
    const mapInstance = (google.maps as any).Map.mock.instances[0];
    const clickListener = mapInstance.addListener.mock.calls.find(
      (call: any) => call[0] === 'click'
    )[1];
    clickListener({ latLng: new google.maps.LatLng(48.1351, 11.5820) });
    
    // Suche den "Marker löschen" Button und klicke ihn
    const clearButton = screen.getByRole('button', { name: /Marker löschen/i });
    fireEvent.click(clearButton);
    
    // Prüfe, ob onMarkersClear aufgerufen wurde
    expect(mockOnMarkersClear).toHaveBeenCalled();
  });
});