import React from 'react';
import { render, screen, fireEvent } from '../../test-utils';
import BayernMaps from '@/components/maps/bayern-maps';

describe('BayernMaps Component', () => {
  beforeEach(() => {
    // Setze das Fenster zurück
    window.open = jest.fn();
  });

  it('zeigt standardmäßig den BayernAtlas an', () => {
    render(<BayernMaps />);
    
    // Überprüfe, ob der Titel und der Text korrekt angezeigt werden
    expect(screen.getByText('Bayerische Geo-Informationen')).toBeInTheDocument();
    expect(screen.getByText(/BayernAtlas ermöglicht es Ihnen/i)).toBeInTheDocument();

    // Prüfe, ob der Öffnen-Button für BayernAtlas vorhanden ist
    const atlasLink = screen.getByText('BayernAtlas öffnen');
    expect(atlasLink).toBeInTheDocument();
    expect(atlasLink).toHaveAttribute('href', 'https://geoportal.bayern.de/bayernatlas/');
  });

  it('wechselt zum DenkmalAtlas, wenn der entsprechende Tab ausgewählt wird', () => {
    render(<BayernMaps />);
    
    // Finde den Tab für DenkmalAtlas und klicke darauf
    const denkmalTab = screen.getByRole('tab', { name: /DenkmalAtlas/i });
    fireEvent.click(denkmalTab);
    
    // Überprüfe, ob der Inhalt des DenkmalAtlas angezeigt wird
    expect(screen.getByText('DenkmalAtlas öffnen')).toBeInTheDocument();
    expect(screen.getByText(/DenkmalAtlas Bayern bietet Informationen/i)).toBeInTheDocument();
  });

  it('akzeptiert einen defaultTab Parameter', () => {
    render(<BayernMaps defaultTab="denkmalatlas" />);
    
    // Prüfe, ob der DenkmalAtlas als Standardtab angezeigt wird
    expect(screen.getByText('DenkmalAtlas öffnen')).toBeInTheDocument();
    expect(screen.getByText(/DenkmalAtlas Bayern bietet Informationen/i)).toBeInTheDocument();
  });

  it('zeigt eine Hinweismeldung zu Sicherheitseinstellungen an', () => {
    render(<BayernMaps />);
    
    // Überprüfe, ob der Hinweis zur Einbettung angezeigt wird
    expect(screen.getByText('Hinweis')).toBeInTheDocument();
    expect(screen.getByText(/Manche Kartenansichten erlauben keine Einbettung/i)).toBeInTheDocument();
  });

  it('enthält Links zu externen Ressourcen', () => {
    render(<BayernMaps />);
    
    // Prüfe, ob der Link zum Luftbild vorhanden ist
    const luftbildLink = screen.getByText('Direkt zum Luftbild');
    expect(luftbildLink).toBeInTheDocument();
    expect(luftbildLink).toHaveAttribute('href', expect.stringContaining('atlas.bayern.de'));
  });
});