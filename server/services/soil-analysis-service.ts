/**
 * Bodenanalyse-Service für die Abfrage von Bodenarten vom BGR WFS
 */
import axios from 'axios';
import proj4 from 'proj4';
import { Feature, FeatureCollection, Point } from 'geojson';

// Bodenarten-Klassifikation
export const SOIL_CLASSIFICATION = {
  "Reinsande (ss)": ["Ss", "fSms", "mSfs", "mSgs", "gSms"],
  "Lehmsande (ls)": ["Sl2", "Sl3", "Sl4"],
  "Schluffsande (us)": ["Su2", "Su3", "Su4"],
  "Sandlehme (sl)": ["Slu", "St2", "St3"],
  "Normallehme (ll)": ["Ls2", "Ls3", "Ls4", "Lt2"],
  "Tonlehme (tl)": ["Lts", "Lt3", "Tu3"],
  "Lehmschluffe (lu)": ["Lu", "Uls"],
  "Tonschluffe (tu)": ["Tu2", "Tu4", "Ut2", "Ut3"],
  "Schlufftone (ut)": ["Ut4", "Tu4", "Uu"],
  "Moore (mo)": ["HH", "Hn", "Hh"],
  "Watt": ["Watt"],
  "Siedlung": ["Siedlung", "Bebauung", "Urban"],
  "Abbauflächen": ["Abbaufläche", "Tagebau", "Bergbau"],
  "Gewässer": ["Gewässer", "See", "Fluss"]
};

// Farbzuordnung für Visualisierung
export const COLOR_MAPPING = {
  "Reinsande (ss)": "#FFFACD", // beige
  "Lehmsande (ls)": "#90EE90", // lightgreen
  "Schluffsande (us)": "#32CD32", // green
  "Sandlehme (sl)": "#006400", // darkgreen
  "Normallehme (ll)": "#8B4513", // brown
  "Tonlehme (tl)": "#5D4037", // darkbrown
  "Lehmschluffe (lu)": "#FFA500", // orange
  "Tonschluffe (tu)": "#FF8C00", // darkorange
  "Schlufftone (ut)": "#FF0000", // red
  "Moore (mo)": "#000000", // black
  "Watt": "#ADD8E6", // lightblue
  "Siedlung": "#808080", // gray
  "Abbauflächen": "#800080", // purple
  "Gewässer": "#0000FF", // blue
  "Unbekannt": "#FFFFFF" // white
};

export interface SoilAnalysisResult {
  bodenartCode: string;
  bodenartDescription: string;
  classification: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  color: string;
}

export interface BatchAnalysisResult {
  results: SoilAnalysisResult[];
  count: number;
}

class SoilAnalysisService {
  private bgrWfsUrl = "https://services.bgr.de/wfs/boden/boart1000ob/?";
  private bgrLayer = "boart1000ob";

  /**
   * Klassifiziert eine Bodenart entsprechend der BGR-Codes
   * @param bgrCode BGR-Bodenart-Code
   * @returns Klassifikation der Bodenart
   */
  public classifySoilType(bgrCode: string): string {
    for (const [classification, codes] of Object.entries(SOIL_CLASSIFICATION)) {
      for (const code of codes) {
        if (bgrCode.toLowerCase().includes(code.toLowerCase())) {
          return classification;
        }
      }
    }
    return "Unbekannt";
  }

  /**
   * Transformiert Koordinaten von WGS84 zu ETRS89/UTM
   * @param lon Längengrad (WGS84)
   * @param lat Breitengrad (WGS84)
   * @returns Transformierte Koordinaten [x, y] in ETRS89/UTM
   */
  private transformCoordinates(lon: number, lat: number): [number, number] {
    // Definition der Projektionen
    const wgs84 = 'EPSG:4326';
    const etrs89 = 'EPSG:25832';
    
    // Projektion durchführen
    return proj4(wgs84, etrs89, [lon, lat]);
  }

  /**
   * Erstellt eine WFS-Anfrage an den BGR-Server
   * @param lon Längengrad
   * @param lat Breitengrad
   * @returns Promise mit der Antwort des BGR-Servers
   */
  public async getSoilTypeByCoordinates(lon: number, lat: number): Promise<SoilAnalysisResult> {
    try {
      // Transformation der Koordinaten
      const [x, y] = this.transformCoordinates(lon, lat);
      
      // Erstelle ein Rechteck um den Punkt für die Abfrage
      const buffer = 100; // Puffer in Metern
      const bbox = `${x - buffer},${y - buffer},${x + buffer},${y + buffer}`;
      
      // WFS-Anfrage Parameter
      const params = {
        service: 'WFS',
        version: '2.0.0',
        request: 'GetFeature',
        typeName: this.bgrLayer,
        bbox: bbox,
        srsName: 'EPSG:25832',
        outputFormat: 'application/json'
      };
      
      // Anfrage senden
      const response = await axios.get(this.bgrWfsUrl, { params });
      
      // GeoJSON Feature Collection
      const featureCollection = response.data as FeatureCollection;
      
      if (featureCollection.features && featureCollection.features.length > 0) {
        // Bodenart-Informationen extrahieren
        const feature = featureCollection.features[0];
        const props = feature.properties || {};
        
        const bodenartCode = props.BOART || 'Unbekannt';
        const bodenartDescription = props.BOART_BEZ || 'Keine Beschreibung verfügbar';
        const classification = this.classifySoilType(bodenartCode);
        
        return {
          bodenartCode,
          bodenartDescription,
          classification,
          coordinates: { lat, lng: lon },
          color: COLOR_MAPPING[classification] || COLOR_MAPPING.Unbekannt
        };
      } else {
        return {
          bodenartCode: 'Keine Daten',
          bodenartDescription: 'Keine Bodenartdaten für diese Koordinaten verfügbar',
          classification: 'Unbekannt',
          coordinates: { lat, lng: lon },
          color: COLOR_MAPPING.Unbekannt
        };
      }
    } catch (error) {
      console.error('Fehler bei der BGR-WFS-Abfrage:', error);
      return {
        bodenartCode: 'Fehler',
        bodenartDescription: `Fehler bei der Abfrage: ${error.message || 'Unbekannter Fehler'}`,
        classification: 'Fehler',
        coordinates: { lat, lng: lon },
        color: COLOR_MAPPING.Unbekannt
      };
    }
  }

  /**
   * Verarbeitet mehrere Koordinaten als Batch
   * @param coordinates Array von Koordinaten [lon, lat]
   * @param maxPoints Maximale Anzahl zu verarbeitender Punkte
   * @returns Promise mit den Batch-Analyseergebnissen
   */
  public async processBatchCoordinates(
    coordinates: Array<{lon: number, lat: number}>,
    maxPoints: number = 100
  ): Promise<BatchAnalysisResult> {
    // Begrenze auf die angegebene Anzahl an Punkten
    const limitedCoords = coordinates.slice(0, Math.min(maxPoints, coordinates.length));
    
    // Ergebnisse sammeln
    const results: SoilAnalysisResult[] = [];
    
    // Sequentiell verarbeiten, um den Server nicht zu überlasten
    for (const coord of limitedCoords) {
      const result = await this.getSoilTypeByCoordinates(coord.lon, coord.lat);
      results.push(result);
    }
    
    return {
      results,
      count: results.length
    };
  }
}

export default new SoilAnalysisService();