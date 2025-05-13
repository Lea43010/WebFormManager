import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { renderWithForm } from '@/lib/__tests__/test-form-utils';
import { z } from 'zod';
import { LoginForm } from '@/components/forms/login-form';
import { toast } from '@/hooks/use-toast';

// Mock der useRouter Hook
jest.mock('wouter', () => ({
  useLocation: () => ['/'],
  useRoute: () => [false],
  Link: ({ children, href }: { children: React.ReactNode, href: string }) => (
    <a href={href} data-testid="wouter-link">
      {children}
    </a>
  ),
}));

// Mock für useToast
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
  toast: jest.fn(),
}));

// Mock für API-Anfragen
jest.mock('@/lib/queryClient', () => ({
  apiRequest: jest.fn().mockImplementation(() => Promise.resolve({ 
    ok: true,
    json: () => Promise.resolve({ id: 1, username: 'testuser' })
  })),
  queryClient: {
    setQueryData: jest.fn(),
    invalidateQueries: jest.fn(),
  },
}));

// Schema für das Loginformular
const loginSchema = z.object({
  username: z.string().min(3, 'Benutzername muss mindestens 3 Zeichen haben'),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen haben'),
});

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('rendert das Formular korrekt', () => {
    renderWithForm(<LoginForm />, { schema: loginSchema });
    
    expect(screen.getByLabelText(/Benutzername/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Passwort/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Anmelden/i })).toBeInTheDocument();
  });

  test('zeigt Validierungsfehler an', async () => {
    const { user } = renderWithForm(<LoginForm />, { schema: loginSchema });
    
    // Kurzer Benutzername
    await user.type(screen.getByLabelText(/Benutzername/i), 'ab');
    await user.tab(); // Wechselt zum nächsten Feld
    
    await waitFor(() => {
      expect(screen.getByText(/mindestens 3 Zeichen/i)).toBeInTheDocument();
    });
    
    // Kurzes Passwort
    await user.type(screen.getByLabelText(/Passwort/i), 'kurz');
    await user.tab(); // Wechselt aus dem Feld
    
    await waitFor(() => {
      expect(screen.getByText(/mindestens 8 Zeichen/i)).toBeInTheDocument();
    });
  });

  test('sendet Formulardaten, wenn die Validierung erfolgreich ist', async () => {
    const { user } = renderWithForm(<LoginForm />, { schema: loginSchema });
    const apiRequest = require('@/lib/queryClient').apiRequest;
    
    // Gültige Eingabewerte
    await user.type(screen.getByLabelText(/Benutzername/i), 'testuser');
    await user.type(screen.getByLabelText(/Passwort/i), 'sicheres_passwort');
    
    // Formular absenden
    await user.click(screen.getByRole('button', { name: /Anmelden/i }));
    
    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith(
        'POST',
        '/api/login',
        expect.objectContaining({
          username: 'testuser',
          password: 'sicheres_passwort'
        })
      );
    });
    
    // Überprüfen, ob der Benutzer informiert wurde
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({
        title: expect.stringContaining('Erfolgreich angemeldet'),
      }));
    });
  });

  test('zeigt Fehlermeldung bei fehlgeschlagener Anmeldung', async () => {
    const { user } = renderWithForm(<LoginForm />, { schema: loginSchema });
    const apiRequest = require('@/lib/queryClient').apiRequest;
    
    // Mock für fehlgeschlagene Anfrage überschreiben
    apiRequest.mockImplementationOnce(() => 
      Promise.reject(new Error('Ungültige Anmeldedaten'))
    );
    
    // Gültige Eingabewerte
    await user.type(screen.getByLabelText(/Benutzername/i), 'testuser');
    await user.type(screen.getByLabelText(/Passwort/i), 'sicheres_passwort');
    
    // Formular absenden
    await user.click(screen.getByRole('button', { name: /Anmelden/i }));
    
    // Überprüfen, ob die Fehlermeldung angezeigt wird
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({
        title: expect.stringContaining('Fehler'),
        variant: 'destructive',
      }));
    });
  });
});