import { QueryClient, QueryFunction } from "@tanstack/react-query";
import env from './environment';

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    
    // In der Entwicklungsumgebung ausführlichere Fehlerinformationen anzeigen
    if (env.isDevelopment) {
      console.error(`API-Fehler (${res.status})`, { 
        url: res.url, 
        status: res.status, 
        statusText: res.statusText, 
        body: text 
      });
    }
    
    // Spezielle Behandlung für Anhangs-Berechtigungsfehler
    if (res.url.includes('/api/attachments') && res.status === 403) {
      console.warn("Berechtigung für Anhänge fehlt, aber wir vermeiden den Fehler");
      return; // Keinen Fehler werfen, stattdessen normal fortfahren
    }
    
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // URL mit Basis-URL-Präfix versehen, wenn konfiguriert
  const apiUrl = env.apiBaseUrl ? `${env.apiBaseUrl}${url}` : url;
  
  // In der Entwicklungsumgebung API-Anfragen protokollieren
  if (env.isDevelopment) {
    console.debug(`[API] ${method} ${apiUrl}`, data ? { body: data } : '');
  }
  
  // Request-Timeout basierend auf der Umgebung setzen
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), env.timeouts.apiRequest);
  
  try {
    const res = await fetch(apiUrl, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      signal: controller.signal
    });
    
    // Timeout-Fehlerbehandlung entfernen
    clearTimeout(timeoutId);
    
    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    // Spezielle Behandlung von Timeout-Fehlern
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`API-Anfrage-Timeout (> ${env.timeouts.apiRequest / 1000}s): ${method} ${apiUrl}`);
    }
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // URL-Präfix hinzufügen, wenn konfiguriert
    const path = queryKey[0] as string;
    const url = env.apiBaseUrl ? `${env.apiBaseUrl}${path}` : path;
    
    // In der Entwicklungsumgebung API-Anfragen protokollieren
    if (env.isDevelopment) {
      console.debug(`[API] GET ${url}`);
    }
    
    // Spezielle Behandlung für Anhänge-Anfragen
    if (path === '/api/attachments') {
      try {
        // Request-Timeout basierend auf der Umgebung setzen
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), env.timeouts.apiRequest);
        
        const res = await fetch(url, {
          credentials: "include",
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Bei 403-Fehlern leeres Array zurückgeben statt Fehler zu werfen
        if (res.status === 403) {
          console.warn("Berechtigung für Anhänge fehlt, leeres Array wird zurückgegeben");
          return [];
        }
        
        if (unauthorizedBehavior === "returnNull" && res.status === 401) {
          return null;
        }
        
        await throwIfResNotOk(res);
        return await res.json();
      } catch (error) {
        // Bei Anhängen-Fehlern leeres Array zurückgeben
        console.warn("Fehler bei Anhänge-Anfrage, leeres Array wird zurückgegeben:", error);
        return [];
      }
    }
    
    // Standard-Behandlung für alle anderen Anfragen
    // Request-Timeout basierend auf der Umgebung setzen
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), env.timeouts.apiRequest);
    
    try {
      const res = await fetch(url, {
        credentials: "include",
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }
      
      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      // Spezielle Behandlung von Timeout-Fehlern
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error(`API-Anfrage-Timeout (> ${env.timeouts.apiRequest / 1000}s): GET ${url}`);
      }
      throw error;
    }
  };

/**
 * Definition differenzierter Caching-Strategien für unterschiedliche Datentypen
 */
const cacheConfig = {
  staticData: { staleTime: 1000 * 60 * 60 * 24 }, // 24 Stunden für statische Daten
  userRelatedData: { staleTime: 1000 * 60 * 15 }, // 15 Minuten für benutzerbezogene Daten
  frequentlyChangingData: { staleTime: 1000 * 60 * 5 }, // 5 Minuten für häufig ändernde Daten
  projectData: { staleTime: 1000 * 60 * 30 }, // 30 Minuten für Projektdaten
};

/**
 * Erstellt einen verbesserten QueryClient mit optimierten Cache-Einstellungen
 * und intelligentem Netzwerkstatus-Handling
 */
/**
 * Stellt Caching- und Netzwerk-Strategie basierend auf Umgebung und Datentyp bereit
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      // Nur in Produktionsumgebung bei Fokuswechsel aktualisieren
      refetchOnWindowFocus: env.isProduction,
      // Standard-Stale-Time aus dem Cache-Config (5 Minuten)
      staleTime: cacheConfig.frequentlyChangingData.staleTime,
      // Wiederholungsversuche basierend auf Umgebung 
      retry: env.isDevelopment ? 1 : 2,
      // Exponentielles Backoff für Wiederholungsversuche
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      // In der Produktion längeres Timeout als in Entwicklung
      // Eigene Fehlerbehandlung in den Hooks um benutzerdefinierte Fehlermeldungen anzuzeigen
    },
    mutations: {
      // Ähnliche Konfiguration für Mutations
      retry: env.isDevelopment ? 0 : 1,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});
