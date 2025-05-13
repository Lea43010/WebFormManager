import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TiefbauPDFGenerator from '../tiefbau-pdf-generator';

// Mock des Toast-Hooks
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock für html2canvas
jest.mock('html2canvas', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => {
    return {
      toDataURL: jest.fn().mockReturnValue('mock-data-url'),
    };
  }),
}));

// Mock für jsPDF
jest.mock('jspdf', () => {
  const mockJsPdfInstance = {
    setFontSize: jest.fn(),
    setTextColor: jest.fn(),
    text: jest.fn(),
    setDrawColor: jest.fn(),
    setFillColor: jest.fn(),
    rect: jest.fn(),
    addImage: jest.fn(),
    addPage: jest.fn(),
    getNumberOfPages: jest.fn().mockReturnValue(2),
    setPage: jest.fn(),
    save: jest.fn(),
    internal: {
      pageSize: {
        getWidth: jest.fn().mockReturnValue(210),
        getHeight: jest.fn().mockReturnValue(297),
      },
    },
  };

  return {
    __esModule: true,
    default: jest.fn(() => mockJsPdfInstance),
  };
});

// Mock für document.getElementById
document.getElementById = jest.fn().mockImplementation(() => {
  return {
    getBoundingClientRect: jest.fn().mockReturnValue({
      width: 800,
      height: 600,
    }),
  };
});

describe('TiefbauPDFGenerator', () => {
  // Testdaten
  const mockProps = {
    projectName: 'Test Projekt',
    routeData: {
      start: 'München',
      end: 'Berlin',
      distance: 500,
    },
    bodenartData: {
      name: 'Lehm',
      beschreibung: 'Lehmiger Boden',
      kostenProM2: 50,
      gesamtkosten: 25000,
    },
    maschinenData: [
      {
        id: 1,
        name: 'Bagger',
        typ: 'Hydraulisch',
        leistung: '150 kW',
        kostenProStunde: 120,
      },
    ],
    mapContainerId: 'tiefbau-map-container',
  };

  // Test zum Rendern der Komponente
  test('sollte den Export-Button korrekt rendern', () => {
    render(<TiefbauPDFGenerator {...mockProps} />);
    
    const exportButton = screen.getByText(/Als PDF exportieren/i);
    expect(exportButton).toBeInTheDocument();
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  // Test zum Zustandswechsel beim Generieren
  test('sollte den Ladezustand während der PDF-Generierung anzeigen', async () => {
    render(<TiefbauPDFGenerator {...mockProps} />);
    
    // Klick auf den Export-Button
    fireEvent.click(screen.getByText(/Als PDF exportieren/i));
    
    // Prüfe, ob der Ladezustand angezeigt wird
    expect(screen.getByText(/PDF wird erstellt.../i)).toBeInTheDocument();
    
    // Warte auf Abschluss der PDF-Generierung
    await waitFor(() => {
      expect(screen.queryByText(/PDF wird erstellt.../i)).not.toBeInTheDocument();
    });
  });

  // Test zum Fehlerfall wenn keine Route vorhanden ist
  test('sollte einen Fehler anzeigen, wenn keine Routendaten vorhanden sind', async () => {
    const propsWithoutRoute = {
      ...mockProps,
      routeData: null,
    };
    
    const mockToast = jest.fn();
    jest.spyOn(require('@/hooks/use-toast'), 'useToast').mockImplementation(() => ({
      toast: mockToast,
    }));
    
    render(<TiefbauPDFGenerator {...propsWithoutRoute} />);
    
    // Klick auf den Export-Button
    fireEvent.click(screen.getByText(/Als PDF exportieren/i));
    
    // Warte auf Toast-Nachricht
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Fehler',
        variant: 'destructive',
      }));
    });
  });
  
  // Test für erfolgreiche PDF-Generierung
  test('sollte bei erfolgreicher PDF-Generierung eine Erfolgsmeldung anzeigen', async () => {
    const mockToast = jest.fn();
    jest.spyOn(require('@/hooks/use-toast'), 'useToast').mockImplementation(() => ({
      toast: mockToast,
    }));
    
    render(<TiefbauPDFGenerator {...mockProps} />);
    
    // Klick auf den Export-Button
    fireEvent.click(screen.getByText(/Als PDF exportieren/i));
    
    // Warte auf Toast-Nachricht
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'PDF erstellt',
      }));
    });
  });
});