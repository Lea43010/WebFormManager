import React, { ReactElement } from 'react';
import { render as rtlRender, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

/**
 * Eine Hilfsfunktion zum Testen von Form-Komponenten mit React Hook Form
 * @param ui - Die zu testende Komponente
 * @param schema - Das zod-Schema für die Formularvalidierung (optional)
 * @param defaultValues - Standardwerte für das Formular (optional)
 * @param renderOptions - Optionen für die render-Funktion von RTL (optional)
 * @returns Die render-Funktion von RTL mit zusätzlichen Hilfsfunktionen
 */
export function renderWithForm(
  ui: ReactElement,
  {
    schema = z.object({}),
    defaultValues = {},
    ...renderOptions
  }: {
    schema?: z.ZodType<any, any>;
    defaultValues?: Record<string, any>;
  } & Omit<RenderOptions, 'wrapper'> = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    const methods = useForm({
      resolver: schema ? zodResolver(schema) : undefined,
      defaultValues,
      mode: 'onChange'
    });

    return <FormProvider {...methods}>{children}</FormProvider>;
  }

  return {
    user: userEvent.setup(),
    ...rtlRender(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

/**
 * Beispiel für ein Testschema
 * import { renderWithForm } from '@/lib/__tests__/test-form-utils';
 * 
 * // Für ein Formular mit Validierung
 * const schema = z.object({
 *   username: z.string().min(3, 'Benutzername muss mindestens 3 Zeichen haben'),
 *   email: z.string().email('Bitte geben Sie eine gültige E-Mail-Adresse ein'),
 * });
 * 
 * test('Formular sollte bei Validierungsfehlern Fehlermeldungen anzeigen', async () => {
 *   const { getByLabelText, getByText, user } = renderWithForm(<MeinFormular />, { schema });
 *   
 *   await user.type(getByLabelText(/Benutzername/i), 'ab');
 *   await user.click(getByText(/Absenden/i));
 *   
 *   expect(getByText(/mindestens 3 Zeichen/i)).toBeInTheDocument();
 * });
 */