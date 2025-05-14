/**
 * Bodenanalyse-Service für BGR-WMS-Abfragen
 * 
 * Dieses Modul stellt Funktionen für die Abfrage von Bodenart-Informationen
 * von der Bundesanstalt für Geowissenschaften und Rohstoffe (BGR) bereit.
 * Es nutzt den WMS-GetFeatureInfo-Dienst der BGR, um Bodenart-Informationen 
 * für bestimmte Koordinaten zu erhalten.
 */

import axios from 'axios';
import proj4 from 'proj4';
import logger from '../logger';

// Definitionen der Koordinatensysteme
// ETRS89 / UTM zone 32N (EPSG:25832) - von BGR verwendet
// WGS84 (EPSG:4326) - Standard GPS-Koordinatensystem
proj4.defs('EPSG:25832', '+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs');
proj4.defs('EPSG:4326', '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs');

/**
 * Wandelt WGS84-Koordinaten (lat/lng) in ETRS89/UTM32N-Koordinaten um
 * @param lat Breitengrad (WGS84)
 * @param lng Längengrad (WGS84)
 * @returns {[number, number]} [x, y] Koordinaten in ETRS89/UTM32N
 */
function transformCoordinates(lat: number, lng: number): [number, number] {
  // proj4 erwartet [lng, lat] als Eingabe
  const [x, y] = proj4('EPSG:4326', 'EPSG:25832', [lng, lat]);
  return [x, y];
}

// Die alte extractSoilData-Funktion für XML-Responses wurde entfernt,
// da wir jetzt extractSoilDataFromWMS für JSON-Responses verwenden

/**
 * Extrahiert relevante Bodenartinformationen aus der JSON-Antwort des BGR WMS GetFeatureInfo
 * @param wmsData JSON-Daten aus der WMS-GetFeatureInfo-Antwort
 * @returns Aufbereitete Bodenartdaten
 */
function extractSoilDataFromWMS(wmsData: any): any {
  try {
    // Verbesserte Logging zur Fehlersuche
    logger.debug(`WMS-Datenstruktur: ${typeof wmsData}`);
    
    // Verschiedene WMS-Formate überprüfen
    
    // Format 1: Standard-GetFeatureInfo mit features
    if (wmsData && wmsData.features && Array.isArray(wmsData.features) && wmsData.features.length > 0) {
      const feature = wmsData.features[0];
      const properties = feature.properties || {};
      
      return {
        bodenart: properties.BOART || properties.boart || properties.Bodenart || 'Unbekannt',
        bodentyp: properties.BOTYP || properties.botyp || properties.Bodentyp || 'Unbekannt',
        bodenregion: properties.REGION || properties.region || properties.Bodenregion || 'Unbekannt',
        nutzung: properties.NUTZUNG || properties.nutzung || properties.Nutzung || 'Unbekannt',
        zusatzInfos: properties
      };
    }
    
    // Format 2: Direktes Eigenschaften-Objekt
    if (wmsData && typeof wmsData === 'object' && !Array.isArray(wmsData)) {
      // Suche nach Bodenart-Schlüsseln im Antwortobjekt
      const keys = Object.keys(wmsData);
      for (const key of keys) {
        if (key.toLowerCase().includes('boden') || key.toLowerCase().includes('boart')) {
          logger.debug(`Gefundener Bodenart-Schlüssel: ${key}`);
          return {
            bodenart: wmsData[key] || 'Unbekannt',
            zusatzInfos: wmsData
          };
        }
      }
      
      // Wenn kein spezifischer Schlüssel gefunden wurde, geben wir das gesamte Objekt zurück
      return {
        bodenart: 'Siehe zusätzliche Informationen',
        zusatzInfos: wmsData
      };
    }
    
    // Keine erkannten Daten gefunden
    return { 
      error: true,
      message: 'Keine erkennbaren Bodendaten gefunden'
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Fehler beim Extrahieren der WMS-Bodendaten: ${errorMessage}`);
    return { 
      error: true,
      message: 'Fehler beim Extrahieren der WMS-Bodendaten'
    };
  }
}

/**
 * Führt eine WMS-GetFeatureInfo-Abfrage zur BGR für eine bestimmte Koordinate durch
 * @param lat Breitengrad (WGS84)
 * @param lng Längengrad (WGS84)
 * @returns Bodenartdaten für die angegebene Position
 */
export async function queryBGRWms(lat: number, lng: number): Promise<any> {
  try {
    logger.debug(`BGR Bodenanalyse für Koordinaten: ${lat}, ${lng}`);
    
    // WGS84 -> ETRS89/UTM32N Transformation
    const [x, y] = transformCoordinates(lat, lng);
    logger.debug(`Transformierte Koordinaten (ETRS89/UTM32N): x=${x}, y=${y}`);
    
    // Wir versuchen zwei Ansätze:
    // 1. Versuch: BGR WMS-Service direkt abfragen
    // 2. Fallback: Approximation basierend auf bekannten Regionen
    
    try {
      // BGR WMS-URL - aktualisierte URL für den BGR-Dienst
      const bgrWmsUrl = 'https://services.bgr.de/wms/boden/boart1000/';
      
      // WMS-GetFeatureInfo-Parameter erstellen
      // Parameter basierend auf ArcGIS Server WMS-Standards, welche die BGR verwendet
      const params = {
        service: 'WMS',
        request: 'GetFeatureInfo',
        version: '1.1.1',
        layers: 'BOART1000',
        query_layers: 'BOART1000',
        srs: 'EPSG:25832',
        bbox: `${x-1000},${y-1000},${x+1000},${y+1000}`, 
        width: 101,
        height: 101,
        x: 50,
        y: 50,
        styles: '',
        format: 'image/png',
        info_format: 'application/json',
        exceptions: 'application/vnd.ogc.se_xml',
        feature_count: 1
      };

      // HTTP-Anfrage an BGR-WMS senden
      logger.debug(`BGR WMS Anfrage URL: ${bgrWmsUrl} mit Parametern: ${JSON.stringify(params)}`);
      
      // Timeout auf 3 Sekunden setzen - wenn keine schnelle Antwort, dann Fallback
      const response = await axios.get(bgrWmsUrl, { 
        params,
        timeout: 3000
      });
      
      logger.debug(`BGR WMS Antwort Status: ${response.status}`);
      
      // Wenn wir hier ankommen, war die WMS-Anfrage erfolgreich
      return extractSoilDataFromWMS(response.data);
      
    } catch (wmsError) {
      // Bei fehlgeschlagener WMS-Anfrage zum Fallback wechseln
      logger.warn(`BGR-WMS-Anfrage fehlgeschlagen, verwende Bodenregionen-Fallback: ${wmsError instanceof Error ? wmsError.message : String(wmsError)}`);
      
      // Fallback-Methode: Wir liefern einen strukturierten Hinweis an den Client
      const fallbackData = {
        coordinates: {
          lat,
          lng,
          utm32: { x, y }
        },
        success: true,
        data: {
          bodenart: "BGR-WMS-Dienst derzeit nicht verfügbar",
          bodentyp: "Nicht verfügbar",
          hinweis: "Der externe Dienst der Bundesanstalt für Geowissenschaften und Rohstoffe (BGR) ist aktuell nicht erreichbar. Bitte versuchen Sie es später erneut."
        }
      };
      
      logger.info(`Fallback-Bodenartdaten für ${lat}, ${lng} geliefert`);
      return fallbackData;
    }
    
    // Dieser Code sollte nie erreicht werden - alles wird in den try/catch-Blöcken behandelt
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`BGR-WMS-Abfragefehler: ${errorMessage}`);
    return {
      coordinates: { lat, lng },
      success: false,
      error: errorMessage,
      message: 'Fehler bei der BGR-WMS-Abfrage'
    };
  }
}

/**
 * Batch-Abfrage für mehrere Koordinaten über WMS-GetFeatureInfo
 * @param points Array von Koordinaten-Objekten mit lat/lng
 * @returns Array von Bodenart-Ergebnissen
 */
export async function queryBGRWmsPoints(points: Array<{lat: number, lng: number}>): Promise<any[]> {
  try {
    // Begrenzen der Parallelität, um Server nicht zu überlasten
    const batchSize = 3; // Reduziert für WMS-Anfragen
    const results = [];
    
    // Punkte in Batches verarbeiten
    for (let i = 0; i < points.length; i += batchSize) {
      const batch = points.slice(i, i + batchSize);
      
      // Parallele Abfragen für den aktuellen Batch
      const batchPromises = batch.map(point => queryBGRWms(point.lat, point.lng));
      const batchResults = await Promise.all(batchPromises);
      
      results.push(...batchResults);
    }
    
    return results;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`BGR-WMS-Batch-Abfragefehler: ${errorMessage}`);
    throw new Error(`Fehler bei der Batch-Verarbeitung: ${errorMessage}`);
  }
}