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
    // Prüfen, ob Features vorhanden sind
    if (!wmsData || !wmsData.features || wmsData.features.length === 0) {
      return { 
        error: true,
        message: 'Keine Bodendaten gefunden'
      };
    }
    
    // Erstes Feature extrahieren
    const feature = wmsData.features[0];
    const properties = feature.properties || {};
    
    // Bodenartinformationen extrahieren
    // Die Feldnamen können je nach WMS-Service variieren
    // Wir verwenden allgemeine Namen, die Werte sind möglicherweise andere
    return {
      bodenart: properties.BOART || properties.boart || properties.Bodenart || 'Unbekannt',
      bodentyp: properties.BOTYP || properties.botyp || properties.Bodentyp || 'Unbekannt',
      bodenregion: properties.REGION || properties.region || properties.Bodenregion || 'Unbekannt',
      nutzung: properties.NUTZUNG || properties.nutzung || properties.Nutzung || 'Unbekannt',
      // Weitere Eigenschaften können hinzugefügt werden, wenn sie im Service verfügbar sind
      zusatzInfos: properties // Wir geben alle Eigenschaften zurück, damit wir später sehen können, was verfügbar ist
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
    // WGS84 -> ETRS89/UTM32N Transformation
    const [x, y] = transformCoordinates(lat, lng);
    
    // BGR WMS-URL - aktualisierte URL für den BGR-Dienst
    const bgrWmsUrl = 'https://services.bgr.de/wms/boden/boart1000/?';
    
    // WMS-GetFeatureInfo-Parameter erstellen
    // Wir nutzen GetFeatureInfo statt WFS-GetFeature, da dies besser für Punktabfragen geeignet ist
    const params = {
      SERVICE: 'WMS',
      VERSION: '1.3.0',
      REQUEST: 'GetFeatureInfo',
      LAYERS: 'BOART1000',
      QUERY_LAYERS: 'BOART1000',
      CRS: 'EPSG:25832',
      BBOX: `${x-1000},${y-1000},${x+1000},${y+1000}`,
      WIDTH: 101,
      HEIGHT: 101,
      I: 50,
      J: 50,
      INFO_FORMAT: 'application/json',
      FEATURE_COUNT: 1
    };

    // HTTP-Anfrage an BGR-WMS senden
    const response = await axios.get(bgrWmsUrl, { params });
    
    // Antwort ist bereits im JSON-Format
    const result = response.data;
    
    // Daten extrahieren und aufbereiten - angepasst für WMS GetFeatureInfo
    const soilData = extractSoilDataFromWMS(result);
    
    return {
      coordinates: {
        lat,
        lng,
        utm32: { x, y }
      },
      success: !soilData.error,
      data: soilData
    };
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