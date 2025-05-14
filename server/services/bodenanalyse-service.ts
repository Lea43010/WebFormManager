/**
 * Bodenanalyse-Service für BGR-WFS-Abfragen
 * 
 * Dieses Modul stellt Funktionen für die Abfrage von Bodenart-Informationen
 * von der Bundesanstalt für Geowissenschaften und Rohstoffe (BGR) bereit.
 * Es nutzt den WFS-Dienst der BGR, um Bodenart-Informationen für bestimmte
 * Koordinaten zu erhalten.
 */

import axios from 'axios';
import { parseStringPromise } from 'xml2js';
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

/**
 * Extrahiert relevante Bodenartinformationen aus der XML-Antwort des BGR WFS
 * @param featureData GML-Feature-Daten aus der WFS-Antwort
 * @returns Aufbereitete Bodenartdaten
 */
function extractSoilData(featureData: any): any {
  try {
    // Haupt-Feature finden
    const mainFeature = featureData?.['wfs:FeatureCollection']?.['gml:featureMember']?.[0]?.['bss:natboflgru'];
    
    if (!mainFeature) {
      return { 
        error: true,
        message: 'Keine Bodendaten gefunden'
      };
    }
    
    // Extrahieren der Bodenartinformationen
    const bodenart = mainFeature['bss:nam05']?.[0] || 'Unbekannt';
    const leitbodentyp = mainFeature['bss:nam21']?.[0] || 'Unbekannt';
    const hauptbodentyp = mainFeature['bss:nam25']?.[0] || 'Unbekannt';
    const bodenregion = mainFeature['bss:nam50']?.[0] || 'Unbekannt';
    const nutzung = mainFeature['bss:nam61']?.[0] || 'Unbekannt';
    const bodeneinheit = mainFeature['bss:nambse']?.[0] || 'Unbekannt';
    const bodengesellschaft = mainFeature['bss:namgsl']?.[0] || 'Unbekannt';
    const substratsystematik = mainFeature['bss:namsub']?.[0] || 'Unbekannt';

    return {
      bodenart,
      leitbodentyp,
      hauptbodentyp,
      bodenregion,
      nutzung,
      bodeneinheit,
      bodengesellschaft,
      substratsystematik,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Fehler beim Extrahieren der Bodendaten: ${errorMessage}`);
    return { 
      error: true,
      message: 'Fehler beim Extrahieren der Bodendaten'
    };
  }
}

/**
 * Führt eine WFS-Abfrage zur BGR für eine bestimmte Koordinate durch
 * @param lat Breitengrad (WGS84)
 * @param lng Längengrad (WGS84)
 * @returns Bodenartdaten für die angegebene Position
 */
export async function queryBGRWfs(lat: number, lng: number): Promise<any> {
  try {
    // WGS84 -> ETRS89/UTM32N Transformation
    const [x, y] = transformCoordinates(lat, lng);
    
    // BGR WFS-URL
    const bgrWfsUrl = 'https://services.bgr.de/wfs/boden/natboflgru/1.0.0/wfs';
    
    // WFS-Abfrage-Parameter erstellen
    const params = {
      service: 'WFS',
      version: '1.1.0',
      request: 'GetFeature',
      typeName: 'bss:natboflgru',
      srsName: 'EPSG:25832',
      filter: `<Filter xmlns="http://www.opengis.net/ogc">
                <Intersects>
                  <PropertyName>geom</PropertyName>
                  <gml:Point xmlns:gml="http://www.opengis.net/gml" srsName="EPSG:25832">
                    <gml:coordinates>${x},${y}</gml:coordinates>
                  </gml:Point>
                </Intersects>
              </Filter>`
    };

    // HTTP-Anfrage an BGR-WFS senden
    const response = await axios.get(bgrWfsUrl, { params });
    
    // XML-Antwort in JSON umwandeln
    const result = await parseStringPromise(response.data);
    
    // Daten extrahieren und aufbereiten
    const soilData = extractSoilData(result);
    
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
    logger.error(`BGR-WFS-Abfragefehler: ${errorMessage}`);
    return {
      coordinates: { lat, lng },
      success: false,
      error: errorMessage,
      message: 'Fehler bei der BGR-WFS-Abfrage'
    };
  }
}

/**
 * Batch-Abfrage für mehrere Koordinaten
 * @param points Array von Koordinaten-Objekten mit lat/lng
 * @returns Array von Bodenart-Ergebnissen
 */
export async function queryBGRWfsPoints(points: Array<{lat: number, lng: number}>): Promise<any[]> {
  try {
    // Begrenzen der Parallelität, um Server nicht zu überlasten
    const batchSize = 5; 
    const results = [];
    
    // Punkte in Batches verarbeiten
    for (let i = 0; i < points.length; i += batchSize) {
      const batch = points.slice(i, i + batchSize);
      
      // Parallele Abfragen für den aktuellen Batch
      const batchPromises = batch.map(point => queryBGRWfs(point.lat, point.lng));
      const batchResults = await Promise.all(batchPromises);
      
      results.push(...batchResults);
    }
    
    return results;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`BGR-WFS-Batch-Abfragefehler: ${errorMessage}`);
    throw new Error(`Fehler bei der Batch-Verarbeitung: ${errorMessage}`);
  }
}