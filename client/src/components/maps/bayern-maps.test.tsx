import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import BayernMaps from './bayern-maps';

// Mock für die IFrame-Inhalte
jest.mock('react-iframe', () => {
  return {
    __esModule: true,
    default: ({ url, ...props }: { url: string }) => (
      <div data-testid="mock-iframe" data-url={url} {...props}>
        Mocked IFrame Content
      </div>
    ),
  };
});

describe('BayernMaps Component', () => {
  it('sollte den BayernAtlas standardmäßig anzeigen, wenn kein Tab übergeben wird', () => {
    render(<BayernMaps />);
    
    const iframe = screen.getByTestId('mock-iframe');
    expect(iframe).toHaveAttribute('data-url', expect.stringContaining('geoportal.bayern.de'));
  });

  it('sollte den DenkmalAtlas anzeigen, wenn "denkmalatlas" als defaultTab gesetzt ist', () => {
    render(<BayernMaps defaultTab="denkmalatlas" />);
    
    const iframe = screen.getByTestId('mock-iframe');
    expect(iframe).toHaveAttribute('data-url', expect.stringContaining('geoportal.bayern.de/denkmalatlas'));
  });

  it('sollte zwischen BayernAtlas und DenkmalAtlas wechseln können', async () => {
    const user = userEvent.setup();
    render(<BayernMaps />);
    
    // Initial sollte BayernAtlas angezeigt werden
    let iframe = screen.getByTestId('mock-iframe');
    expect(iframe).toHaveAttribute('data-url', expect.stringContaining('geoportal.bayern.de'));
    
    // Auf den DenkmalAtlas Tab klicken
    const denkmalTab = screen.getByRole('tab', { name: /denkmal/i });
    await user.click(denkmalTab);
    
    // Jetzt sollte der DenkmalAtlas angezeigt werden
    iframe = screen.getByTestId('mock-iframe');
    expect(iframe).toHaveAttribute('data-url', expect.stringContaining('geoportal.bayern.de/denkmalatlas'));
  });

  it('sollte die Überschrift und Beschreibung korrekt anzeigen', () => {
    render(<BayernMaps />);
    
    expect(screen.getByText(/bayernatlas/i)).toBeInTheDocument();
    expect(screen.getByText(/geoportal des freistaats bayern/i)).toBeInTheDocument();
  });
});