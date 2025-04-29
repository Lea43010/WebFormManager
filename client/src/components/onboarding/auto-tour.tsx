import React, { useState, useEffect } from 'react';
import { InteractiveTour } from './interactive-tour';

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
 * Komponente, die automatisch eine Tour für neue Benutzer startet
 */
export const AutoTour: React.FC = () => {
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [hasSeenTour, setHasSeenTour] = useLocalStorage('hasSeenTour', false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Prüfe nach dem Laden der Seite, ob die Tour gestartet werden soll
  useEffect(() => {
    // Verzögerung hinzufügen, damit die Seite vollständig geladen ist
    const timer = setTimeout(() => {
      setIsLoaded(true);
      if (!hasSeenTour) {
        setIsTourOpen(true);
      }
    }, 1500); // 1,5 Sekunden Verzögerung

    return () => clearTimeout(timer);
  }, [hasSeenTour]);

  const closeTour = () => {
    setIsTourOpen(false);
  };

  if (!isLoaded) return null;

  return <InteractiveTour isOpen={isTourOpen} onRequestClose={closeTour} />;
};

export default AutoTour;