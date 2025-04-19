import { useState, useEffect } from 'react';

/**
 * Hook für die persistente Speicherung von Formulardaten im localStorage
 * 
 * Dieser Hook speichert automatisch den Zustand eines Formulars in localStorage
 * und stellt ihn beim Neuladen der Seite wieder her, um Datenverlust zu verhindern.
 * 
 * @param formId - Eindeutige ID für das Formular (z.B. "create-project-form")
 * @param initialData - Anfangsdaten für das Formular
 * @param expireTimeInMinutes - Gültigkeitsdauer in Minuten (Default: 60 Minuten)
 * @returns Ein Objekt mit den wiederhergestellten Daten und Methoden zum Verwalten dieser Daten
 */
export function useFormPersistence<T>(
  formId: string,
  initialData: T,
  expireTimeInMinutes: number = 60
) {
  const storageKey = `form_data_${formId}`;
  
  // Daten aus dem localStorage laden oder Initialdaten verwenden
  const loadSavedData = (): T => {
    try {
      const savedDataString = localStorage.getItem(storageKey);
      
      if (!savedDataString) return initialData;
      
      const savedData = JSON.parse(savedDataString);
      
      // Prüfen, ob die gespeicherten Daten abgelaufen sind
      if (savedData.timestamp && Date.now() - savedData.timestamp > expireTimeInMinutes * 60 * 1000) {
        localStorage.removeItem(storageKey);
        return initialData;
      }
      
      return savedData.data;
    } catch (error) {
      console.error('Fehler beim Laden gespeicherter Formulardaten:', error);
      return initialData;
    }
  };
  
  const [formData, setFormData] = useState<T>(loadSavedData);
  const [hasSavedData, setHasSavedData] = useState<boolean>(false);
  
  // Daten im localStorage speichern, wenn sie sich ändern
  useEffect(() => {
    try {
      const dataToSave = {
        data: formData,
        timestamp: Date.now()
      };
      
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      setHasSavedData(true);
    } catch (error) {
      console.error('Fehler beim Speichern von Formulardaten:', error);
    }
  }, [formData, storageKey]);
  
  // Gespeicherte Daten löschen
  const clearSavedData = () => {
    localStorage.removeItem(storageKey);
    setFormData(initialData);
    setHasSavedData(false);
  };
  
  // Gespeicherte Daten aktualisieren
  const updateFormData = (newData: Partial<T>) => {
    setFormData(prevData => ({
      ...prevData,
      ...newData
    }));
  };
  
  return {
    formData,
    updateFormData,
    clearSavedData,
    hasSavedData
  };
}