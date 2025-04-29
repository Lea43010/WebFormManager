import { useState, useEffect, Dispatch, SetStateAction } from 'react';

/**
 * Hook zum Speichern und Abrufen von Werten im Local Storage
 * @param key Der Schlüssel unter dem der Wert im Local Storage gespeichert wird
 * @param initialValue Der Initialwert, falls kein Wert im Local Storage gefunden wird
 * @returns Ein Tupel aus aktuellem Wert und Setter-Funktion
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, Dispatch<SetStateAction<T>>] {
  // State zum Speichern des aktuellen Werts
  const [value, setValue] = useState<T>(() => {
    // Versuche den Wert aus dem Local Storage zu lesen
    if (typeof window !== 'undefined') {
      try {
        const item = window.localStorage.getItem(key);
        // Wenn der Wert existiert, parse ihn und gib ihn zurück
        return item ? JSON.parse(item) : initialValue;
      } catch (error) {
        console.error(`Fehler beim Laden des Local Storage Werts für Schlüssel "${key}":`, error);
        return initialValue;
      }
    }
    return initialValue;
  });

  // Aktualisiere den Local Storage, wenn sich der Wert ändert
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Wenn der Wert undefined ist, entferne den Eintrag
        if (value === undefined) {
          window.localStorage.removeItem(key);
        } else {
          // Ansonsten speichere den Wert
          window.localStorage.setItem(key, JSON.stringify(value));
        }
      } catch (error) {
        console.error(`Fehler beim Speichern des Local Storage Werts für Schlüssel "${key}":`, error);
      }
    }
  }, [key, value]);

  return [value, setValue];
}

export default useLocalStorage;