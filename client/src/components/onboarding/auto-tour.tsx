import React, { useState, useEffect } from 'react';
import { InteractiveTour } from './interactive-tour';
import { useAuth } from '@/hooks/use-auth';

// Interner useLocalStorage Hook für die Tour-Komponente
function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, value]);

  return [value, setValue];
}

/**
 * Überprüft, ob ein Benutzer als neu registriert gilt
 * Ein Benutzer gilt als neu registriert, wenn:
 * 1. Er ein Registrierungsdatum hat
 * 2. Das Registrierungsdatum weniger als 24 Stunden zurückliegt
 */
function isNewlyRegistered(registrationDate: Date | null | undefined): boolean {
  if (!registrationDate) return false;
  
  const regDate = new Date(registrationDate);
  const now = new Date();
  const hoursSinceRegistration = (now.getTime() - regDate.getTime()) / (1000 * 60 * 60);
  
  return hoursSinceRegistration < 24; // Benutzer gilt als neu, wenn weniger als 24 Stunden seit Registrierung vergangen sind
}

/**
 * Komponente, die automatisch eine Tour für neu registrierte Benutzer startet
 */
export const AutoTour: React.FC = () => {
  const { user } = useAuth();
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [hasSeenTour, setHasSeenTour] = useLocalStorage('hasSeenTour', false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Prüfe nach dem Laden der Seite, ob die Tour gestartet werden soll
  useEffect(() => {
    // Verzögerung hinzufügen, damit die Seite vollständig geladen ist
    const timer = setTimeout(() => {
      setIsLoaded(true);
      
      // Tour nur anzeigen, wenn:
      // 1. Der Benutzer die Tour noch nicht gesehen hat
      // 2. Der Benutzer neu registriert ist
      if (!hasSeenTour && user && isNewlyRegistered(user.registrationDate)) {
        console.log('Starte Tour für neu registrierten Benutzer:', user.username);
        setIsTourOpen(true);
      }
    }, 1500); // 1,5 Sekunden Verzögerung

    return () => clearTimeout(timer);
  }, [hasSeenTour, user]);

  const closeTour = () => {
    setIsTourOpen(false);
    setHasSeenTour(true); // Tour als gesehen markieren
  };

  if (!isLoaded) return null;

  return <InteractiveTour isOpen={isTourOpen} onRequestClose={closeTour} />;
};

export default AutoTour;