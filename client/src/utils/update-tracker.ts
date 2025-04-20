/**
 * Hilfsfunktionen zum Tracken von Aktualisierungen und Zeitstempeln
 */

interface UpdateInfo {
  timestamp: string; // ISO-String
  version?: string;
  details?: string;
}

/**
 * Speichert Informationen zur letzten Aktualisierung im localStorage
 * @param key Der Schlüssel, unter dem die Information gespeichert wird
 * @param info Die zu speichernden Aktualisierungsinformationen
 */
export const saveUpdateInfo = (key: string, info: UpdateInfo): void => {
  try {
    localStorage.setItem(`update_${key}`, JSON.stringify(info));
  } catch (error) {
    console.error('Fehler beim Speichern der Aktualisierungsinformationen:', error);
  }
};

/**
 * Holt Informationen zur letzten Aktualisierung aus dem localStorage
 * @param key Der Schlüssel, unter dem die Information gespeichert ist
 * @returns Die gespeicherten Aktualisierungsinformationen oder einen Standardwert
 */
export const getUpdateInfo = (key: string): UpdateInfo => {
  try {
    const stored = localStorage.getItem(`update_${key}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Fehler beim Abrufen der Aktualisierungsinformationen:', error);
  }
  
  // Standardwert, wenn nichts gefunden wurde
  return {
    timestamp: new Date().toISOString()
  };
};

/**
 * Prüft, ob eine neuere Version verfügbar ist
 * @param currentVersion Die aktuelle Version (lokaler Zeitstempel)
 * @param serverVersion Die Serverversion (Server-Zeitstempel)
 * @returns true, wenn die Serverversion neuer ist
 */
export const isNewerVersionAvailable = (currentVersion: string, serverVersion: string): boolean => {
  // Vergleiche die Zeitstempel
  return new Date(serverVersion) > new Date(currentVersion);
};

/**
 * Formatiert einen Zeitstempel als deutsches Datum
 * @param timestamp Der zu formatierende Zeitstempel (ISO-String)
 * @returns Das formatierte Datum
 */
export const formatUpdateDate = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleDateString('de-DE');
  } catch (error) {
    console.error('Fehler beim Formatieren des Datums:', error);
    return 'Unbekannt';
  }
};

/**
 * Abrufen der Aktualisierungsinformationen für verschiedene Bereiche
 * In der Zukunft kann dies erweitert werden, um Daten von einem API-Endpunkt zu laden
 */
export const fetchUpdateInfo = async (section: string): Promise<UpdateInfo> => {
  // In der Zukunft könnte hier ein API-Aufruf erfolgen:
  // const response = await fetch(`/api/updates/${section}`);
  // return await response.json();
  
  // Temporäre Version mit festen Daten
  const updates: Record<string, UpdateInfo> = {
    'datenarchitektur': {
      timestamp: '2024-04-20T08:00:00.000Z',
      details: 'Tabellen für Meilenstein-Tracking und Kapazitätsplanung hinzugefügt'
    },
    'belastungsklassen': {
      timestamp: '2024-02-15T10:30:00.000Z',
      details: 'RStO 12 Belastungsklassen vollständig implementiert'
    },
    'externe-dienste': {
      timestamp: '2024-03-21T14:15:00.000Z',
      details: 'Integration mit BGR Geoportal und BASt GIS-Viewer aktualisiert'
    },
    'bauweisen': {
      timestamp: '2024-03-10T09:45:00.000Z',
      details: 'Bauweisen nach RStO 12 Tafel 1 implementiert'
    },
    'hilfreiche-links': {
      timestamp: '2024-01-25T16:20:00.000Z',
      details: 'Links zu relevanten Dokumenten und Spezifikationen aktualisiert'
    },
    'nutzungshinweise': {
      timestamp: '2024-04-05T11:10:00.000Z',
      details: 'Nutzungshinweise für neue Meilenstein-Funktionen hinzugefügt'
    },
    'eu-konformitaet': {
      timestamp: '2024-02-28T13:00:00.000Z',
      details: 'Informationen gemäß aktueller EU-Verordnungen aktualisiert'
    }
  };
  
  return updates[section] || { timestamp: new Date().toISOString() };
};

/**
 * Prüft regelmäßig auf Aktualisierungen und führt bei Bedarf Aktualisierungen durch
 * @param sections Die zu überwachenden Abschnitte
 * @param updateCallback Callback-Funktion, die bei einer Aktualisierung aufgerufen wird
 */
export const setupUpdateChecker = (
  sections: string[],
  updateCallback: (section: string, info: UpdateInfo) => void
): () => void => {
  // Erste Prüfung
  const checkUpdates = async () => {
    for (const section of sections) {
      try {
        const localInfo = getUpdateInfo(section);
        const serverInfo = await fetchUpdateInfo(section);
        
        if (isNewerVersionAvailable(localInfo.timestamp, serverInfo.timestamp)) {
          // Update gefunden
          saveUpdateInfo(section, serverInfo);
          updateCallback(section, serverInfo);
        }
      } catch (error) {
        console.error(`Fehler beim Prüfen auf Updates für ${section}:`, error);
      }
    }
  };
  
  // Sofort ausführen
  checkUpdates();
  
  // Regelmäßig prüfen (alle 30 Minuten)
  const intervalId = setInterval(checkUpdates, 30 * 60 * 1000);
  
  // Cleanup-Funktion
  return () => clearInterval(intervalId);
};