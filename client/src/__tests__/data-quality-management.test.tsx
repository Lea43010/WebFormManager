import { describe, it, expect, vi } from 'vitest';
import { DataQualityManagement } from '../components/admin/data-quality-management';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '@/hooks/use-toast';

// Mocking der fetch-Funktion für API-Aufrufe
global.fetch = vi.fn();

function mockFetch(data: any) {
  return vi.fn().mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(data),
    })
  );
}

// Mock für React Query
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn().mockReturnValue({
    data: null,
    isLoading: false,
    error: null,
  }),
}));

describe('DataQualityManagement Komponente', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch({
      status: 'success',
      tables: [
        { name: 'tbluser', schema: 'public' },
        { name: 'tblproject', schema: 'public' }
      ],
      columns: [
        { table: 'tbluser', name: 'id', type: 'integer', nullable: false },
        { table: 'tbluser', name: 'username', type: 'varchar', nullable: false }
      ],
      rules: [
        { id: 'rule1', name: 'Tabellennamen-Konvention', description: 'Alle Tabellen sollten mit "tbl" beginnen' }
      ]
    });
  });

  it('sollte die Komponente rendern', async () => {
    render(
      <ToastProvider>
        <DataQualityManagement />
      </ToastProvider>
    );
    
    // Auf Laden warten
    await waitFor(() => {
      expect(screen.getByText('Datenqualitätsmanagement')).toBeInTheDocument();
    });
  });

  it('sollte zwischen Tabs wechseln können', async () => {
    render(
      <ToastProvider>
        <DataQualityManagement />
      </ToastProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Datenqualitätsmanagement')).toBeInTheDocument();
    });

    // Zum JSON-Report Tab wechseln
    const jsonTab = screen.getByText('JSON-Bericht');
    await userEvent.click(jsonTab);
    
    // Prüfen, ob der fetch-Aufruf für den JSON-Report gemacht wurde
    expect(global.fetch).toHaveBeenCalledWith('/api/debug/data-quality/json-report');
  });

  it('sollte den HTML-Report in einem iframe anzeigen', async () => {
    render(
      <ToastProvider>
        <DataQualityManagement />
      </ToastProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Datenqualitätsmanagement')).toBeInTheDocument();
    });

    // Zum HTML-Report Tab wechseln
    const htmlTab = screen.getByText('HTML-Bericht');
    await userEvent.click(htmlTab);
    
    // Prüfen, ob der iframe existiert
    const iframe = screen.getByTitle('Datenbankstruktur-Qualitätsbericht');
    expect(iframe).toBeInTheDocument();
    expect(iframe.getAttribute('src')).toBe('/api/debug/data-quality/html-report');
  });

  it('sollte einen Bericht generieren können', async () => {
    render(
      <ToastProvider>
        <DataQualityManagement />
      </ToastProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Datenqualitätsmanagement')).toBeInTheDocument();
    });

    // Auf "Bericht generieren" klicken
    const generateButton = screen.getByText('Bericht generieren');
    await userEvent.click(generateButton);
    
    // Überprüfen ob ein Toast angezeigt wird
    await waitFor(() => {
      expect(screen.getByText('Bericht generiert')).toBeInTheDocument();
    });
  });

  it('sollte einen CSV-Export anbieten', async () => {
    render(
      <ToastProvider>
        <DataQualityManagement />
      </ToastProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Datenqualitätsmanagement')).toBeInTheDocument();
    });

    // Auf "Als CSV exportieren" klicken
    const exportButton = screen.getByText('Als CSV exportieren');
    
    // Mock für document.createElement und URL.createObjectURL
    const mockLink = {
      setAttribute: vi.fn(),
      click: vi.fn()
    };
    
    vi.spyOn(document, 'createElement').mockReturnValueOnce(mockLink as unknown as HTMLAnchorElement);
    vi.spyOn(URL, 'createObjectURL').mockReturnValueOnce('mock-url');
    
    await userEvent.click(exportButton);
    
    // Überprüfen ob der Download initiiert wurde
    expect(mockLink.setAttribute).toHaveBeenCalledWith('href', expect.any(String));
    expect(mockLink.setAttribute).toHaveBeenCalledWith('download', expect.stringContaining('datenqualitaetsbericht_'));
    expect(mockLink.click).toHaveBeenCalled();
  });
});