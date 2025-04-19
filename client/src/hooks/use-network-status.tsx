import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface NetworkStatusContextType {
  isOnline: boolean;
  wasOffline: boolean;
  resetWasOffline: () => void;
}

/**
 * Context für den Netzwerkstatus, der in der gesamten Anwendung verwendet werden kann
 */
export const NetworkStatusContext = createContext<NetworkStatusContextType | null>(null);

/**
 * Provider-Komponente, die den Netzwerkstatus überwacht und entsprechende Benachrichtigungen anzeigt
 */
export function NetworkStatusProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const { toast } = useToast();

  // Funktion zum Zurücksetzen des Offline-Status
  const resetWasOffline = () => {
    setWasOffline(false);
  };

  useEffect(() => {
    // Event-Handler für Online-/Offline-Status
    const handleOnline = () => {
      setIsOnline(true);
      
      if (wasOffline) {
        toast({
          title: "Netzwerkverbindung wiederhergestellt",
          description: "Die Verbindung zum Server wurde wiederhergestellt. Ihre Daten werden aktualisiert.",
          variant: "default",
          duration: 5000,
        });
        
        // Alle Daten neu laden wenn wieder online
        setTimeout(() => {
          queryClient.invalidateQueries();
        }, 1000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      
      toast({
        title: "Keine Netzwerkverbindung",
        description: "Bitte überprüfen Sie Ihre Internetverbindung. Einige Funktionen sind möglicherweise eingeschränkt.",
        variant: "destructive",
        duration: 10000,
      });
    };

    // Event-Listener hinzufügen
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Event-Listener beim Aufräumen entfernen
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast, wasOffline]);

  // Context-Wert
  const contextValue: NetworkStatusContextType = {
    isOnline,
    wasOffline,
    resetWasOffline,
  };

  return (
    <NetworkStatusContext.Provider value={contextValue}>
      {children}
    </NetworkStatusContext.Provider>
  );
}

/**
 * Hook, der den Netzwerkstatus bereitstellt
 */
export function useNetworkStatus() {
  const context = useContext(NetworkStatusContext);
  
  if (!context) {
    throw new Error('useNetworkStatus muss innerhalb eines NetworkStatusProviders verwendet werden');
  }
  
  return context;
}