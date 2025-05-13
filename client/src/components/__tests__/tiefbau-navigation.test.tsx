import React from 'react';
import { render, screen } from '@testing-library/react';
import { useLocation } from 'wouter';
import TiefbauNavigation from '../TiefbauNavigation';

// Mock für wouter
jest.mock('wouter', () => ({
  Link: ({ children, href }: { children: React.ReactNode, href: string }) => (
    <a href={href} data-testid="wouter-link">
      {children}
    </a>
  ),
  useLocation: jest.fn(),
}));

describe('TiefbauNavigation', () => {
  beforeEach(() => {
    // Standard-Mock für useLocation
    (useLocation as jest.Mock).mockReturnValue(['/']);
  });

  test('sollte alle Navigationsitems korrekt rendern', () => {
    render(<TiefbauNavigation />);
    
    // Überprüfe die Überschrift
    expect(screen.getByText('Tiefbau-Navigation')).toBeInTheDocument();
    
    // Überprüfe die Navigation-Items
    expect(screen.getByText('Tiefbau Karte')).toBeInTheDocument();
    expect(screen.getByText('Kostenkalkulation')).toBeInTheDocument();
    expect(screen.getByText('Bodenanalyse')).toBeInTheDocument();
    
    // Überprüfe die Beschreibungen
    expect(screen.getByText('Höhenprofil und Baustellen-Übersicht')).toBeInTheDocument();
    expect(screen.getByText('Projektkosten kalkulieren')).toBeInTheDocument();
    expect(screen.getByText('Analyse von Bodenarten und Eigenschaften')).toBeInTheDocument();
  });

  test('sollte das "comingSoon"-Label für die Bodenanalyse anzeigen', () => {
    render(<TiefbauNavigation />);
    
    expect(screen.getByText('Demnächst')).toBeInTheDocument();
  });

  test('sollte das aktive Menüelement hervorheben - Tiefbau Karte', () => {
    // Simuliere, dass wir uns auf der Tiefbau-Karten-Seite befinden
    (useLocation as jest.Mock).mockReturnValue(['/tiefbau-map']);
    
    const { container } = render(<TiefbauNavigation />);
    
    // Finde den Button für Tiefbau Karte
    const mapButtonText = screen.getByText('Tiefbau Karte');
    const mapButton = mapButtonText.closest('button');
    
    // Überprüfe, ob der Button die aktive Klasse hat
    expect(mapButton).toHaveClass('bg-primary');
    expect(mapButton).toHaveClass('text-white');
  });

  test('sollte das aktive Menüelement hervorheben - Kostenkalkulation', () => {
    // Simuliere, dass wir uns auf der Kostenkalkulation-Seite befinden
    (useLocation as jest.Mock).mockReturnValue(['/kostenkalkulation']);
    
    const { container } = render(<TiefbauNavigation />);
    
    // Finde den Button für Kostenkalkulation
    const kalkulationButtonText = screen.getByText('Kostenkalkulation');
    const kalkulationButton = kalkulationButtonText.closest('button');
    
    // Überprüfe, ob der Button die aktive Klasse hat
    expect(kalkulationButton).toHaveClass('bg-primary');
    expect(kalkulationButton).toHaveClass('text-white');
  });

  test('sollte den "Coming Soon" Button deaktivieren', () => {
    render(<TiefbauNavigation />);
    
    // Finde den Button für Bodenanalyse
    const analyseButtonText = screen.getByText('Bodenanalyse');
    const analyseButton = analyseButtonText.closest('button');
    
    // Überprüfe, ob der Button deaktiviert ist
    expect(analyseButton).toBeDisabled();
    expect(analyseButton).toHaveClass('cursor-not-allowed');
  });
});