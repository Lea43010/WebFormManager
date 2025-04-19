import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
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
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: import.meta.env.PROD, // Nur in Produktionsumgebung bei Fokuswechsel aktualisieren
      staleTime: 1000 * 60 * 5, // 5 Minuten Standardwert
      retry: 1, // Ein Wiederholungsversuch bei Netzwerkproblemen
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponentiell mit max. 30 Sekunden
      // Fehler innerhalb der Komponenten behandeln
    },
    mutations: {
      retry: 1, // Ein Wiederholungsversuch bei Netzwerkproblemen
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponentiell mit max. 30 Sekunden
    },
  },
});
