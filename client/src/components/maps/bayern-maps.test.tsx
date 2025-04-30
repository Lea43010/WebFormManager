import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import BayernMaps from './bayern-maps';

describe('BayernMaps Component', () => {
  it('sollte den BayernAtlas standardmäßig anzeigen, wenn kein Tab übergeben wird', () => {
    render(<BayernMaps />);
    
    // Prüfen, ob der BayernAtlas-Link vorhanden ist
    const atlasLink = screen.getByText(/BayernAtlas öffnen/i);
    expect(atlasLink).toBeInTheDocument();
    expect(atlasLink).toHaveAttribute('href', 'https://geoportal.bayern.de/bayernatlas/');
  });

  it('sollte den DenkmalAtlas anzeigen, wenn "denkmalatlas" als defaultTab gesetzt ist', () => {
    render(<BayernMaps defaultTab="denkmalatlas" />);
    
    // Prüfen, ob der DenkmalAtlas-Link vorhanden ist
    const denkmalLink = screen.getByText(/DenkmalAtlas öffnen/i);
    expect(denkmalLink).toBeInTheDocument();
    expect(denkmalLink).toHaveAttribute('href', 'https://geoportal.bayern.de/denkmalatlas/');
  });

  it('sollte zwischen BayernAtlas und DenkmalAtlas wechseln können', async () => {
    const user = userEvent.setup();
    render(<BayernMaps />);
    
    // Initial sollte BayernAtlas aktiv sein
    expect(screen.getByText(/BayernAtlas öffnen/i)).toBeInTheDocument();
    
    // Auf den DenkmalAtlas Tab klicken
    const denkmalTab = screen.getByRole('tab', { name: /denkmal/i });
    await user.click(denkmalTab);
    
    // Jetzt sollte der DenkmalAtlas angezeigt werden
    expect(screen.getByText(/DenkmalAtlas öffnen/i)).toBeInTheDocument();
  });

  it('sollte die Überschrift und Beschreibung korrekt anzeigen', () => {
    render(<BayernMaps />);
    
    // Der Titel sollte korrekt angezeigt werden
    expect(screen.getByText(/Bayerische Geo-Informationen/i)).toBeInTheDocument();
    // Eine der Beschreibungstexte sollte sichtbar sein
    expect(screen.getByText(/Informationen zu geografischen Standorten in Bayern/i)).toBeInTheDocument();
  });
});