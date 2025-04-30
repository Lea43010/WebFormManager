import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mocks für kontextabhängige Komponenten
const mockNavigate = jest.fn();
const mockLocation = jest.fn();

// Mock für wouter's useLocation und useRoute
jest.mock('wouter', () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
  useLocation: () => ['/test-location', mockLocation],
  useRoute: (pattern: string) => {
    return [pattern === '/test-location', { params: {} }];
  },
  useParams: () => ({})
}));

// Erweiterte Renderer-Optionen für die Bereitstellung von Mock-Providern
interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  route?: string;
}

// Render mit Providern
function renderWithProviders(
  ui: ReactElement,
  options?: ExtendedRenderOptions
) {
  return render(ui, {
    // Wrap in providers if needed (e.g., theme, authentication, etc.)
    wrapper: ({ children }) => {
      return <>{children}</>;
    },
    ...options,
  });
}

// Re-export alles aus testing-library
export * from '@testing-library/react';

// Überschreibe den render mit unserem benutzerdefinierten
export { renderWithProviders as render };

// Exportiere Mock-Funktionen für Tests, die diese benötigen
export const mocks = {
  navigate: mockNavigate,
  location: mockLocation,
};