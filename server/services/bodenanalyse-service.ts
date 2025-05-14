/**
 * Bodenanalyse-Service für die Abfrage von Bodenarten vom BGR WFS
 */
import axios from 'axios';
import { parseString } from 'xml2js';
import proj4 from 'proj4';

// Register ETRS89/UTM (EPSG:25832) projection for Germany
proj4.defs('EPSG:25832', '+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs');

// Klassifikation der Bodenarten
export const SOIL_CLASSIFICATION: Record<string, string[]> = {
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

// Farbzuordnung für die Visualisierung
export const COLOR_MAPPING: Record<string, string> = {
  "Reinsande (ss)": "#F5DEB3", // beige
  "Lehmsande (ls)": "#90EE90", // lightgreen
  "Schluffsande (us)": "#008000", // green
  "Sandlehme (sl)": "#006400", // darkgreen
  "Normallehme (ll)": "#A52A2A", // brown
  "Tonlehme (tl)": "#5C4033", // darkbrown
  "Lehmschluffe (lu)": "#FFA500", // orange
  "Tonschluffe (tu)": "#FF8C00", // darkorange
  "Schlufftone (ut)": "#FF0000", // red
  "Moore (mo)": "#000000", // black
  "Watt": "#ADD8E6", // lightblue
  "Siedlung": "#808080", // gray
  "Abbauflächen": "#800080", // purple
  "Gewässer": "#0000FF", // blue
  "Unbekannt": "#FFFFFF", // white
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

class BodenAnalyseService {
  private bgrWfsUrl = "https://services.bgr.de/wfs/boden/boart1000ob/?";
  private bgrLayer = "boart1000ob";

  /**
   * Klassifiziert eine Bodenart entsprechend der BGR-Codes
   * @param bgrCode BGR-Bodenart-Code
   * @returns Klassifikation der Bodenart
   */
  public classifySoilType(bgrCode: string): string {
    for (const [klasse, codes] of Object.entries(SOIL_CLASSIFICATION)) {
      for (const code of codes) {
        if (bgrCode && bgrCode.includes(code)) {
          return klasse;
        }
      }
    }
    return "Unbekannt";
  }

  /**
   * Gibt die Farbzuordnung für Bodenklassifikationen zurück
   */
  public getColorMapping(): { colorMapping: Record<string, string> } {
    return { colorMapping: COLOR_MAPPING };
  }

  /**
   * Transformiert Koordinaten von WGS84 zu ETRS89/UTM
   * @param lon Längengrad (WGS84)
   * @param lat Breitengrad (WGS84)
   * @returns Transformierte Koordinaten [x, y] in ETRS89/UTM
   */
  private transformCoordinates(lon: number, lat: number): [number, number] {
    return proj4('EPSG:4326', 'EPSG:25832', [lon, lat]);
  }

  /**
   * Erstellt eine WFS-Anfrage an den BGR-Server
   * @param lon Längengrad
   * @param lat Breitengrad
   * @returns Promise mit der Antwort des BGR-Servers
   */
  public async getSoilTypeByCoordinates(lon: number, lat: number): Promise<SoilAnalysisResult> {
    try {
      // Erstelle URL-Parameter für WFS-Anfrage
      const params = new URLSearchParams({
        service: 'WFS',
        version: '2.0.0',
        request: 'GetFeature',
        typeName: this.bgrLayer,
        outputFormat: 'application/json',
        srsName: 'EPSG:25832',
        bbox: `${lon-0.01},${lat-0.01},${lon+0.01},${lat+0.01},EPSG:4326`
      });
      
      const response = await axios.get(`${this.bgrWfsUrl}${params.toString()}`);
      
      if (response.data.features && response.data.features.length > 0) {
        const feature = response.data.features[0];
        const bodenartCode = feature.properties.BOART || 'Unbekannt';
        const bodenartDescription = feature.properties.BOART_BEZ || 'Keine Beschreibung';
        const classification = this.classifySoilType(bodenartCode);
        const color = COLOR_MAPPING[classification] || COLOR_MAPPING['Unbekannt'];
        
        return {
          bodenartCode,
          bodenartDescription,
          classification,
          coordinates: {
            lat: lat,
            lng: lon
          },
          color
        };
      } else {
        return {
          bodenartCode: 'Keine Daten',
          bodenartDescription: 'Keine Daten für diese Koordinaten verfügbar',
          classification: 'Unbekannt',
          coordinates: {
            lat: lat,
            lng: lon
          },
          color: COLOR_MAPPING['Unbekannt']
        };
      }
    } catch (error) {
      console.error('Fehler bei der WFS-Abfrage:', error);
      return {
        bodenartCode: 'Fehler',
        bodenartDescription: `Fehler bei der Abfrage: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
        classification: 'Fehler',
        coordinates: {
          lat: lat,
          lng: lon
        },
        color: COLOR_MAPPING['Unbekannt']
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
    coordinates: Array<{ lon: number, lat: number }>,
    maxPoints: number = 100
  ): Promise<BatchAnalysisResult> {
    // Begrenze die Anzahl der zu verarbeitenden Punkte
    const limitedCoordinates = coordinates.slice(0, maxPoints);
    
    const results: SoilAnalysisResult[] = [];
    
    // Verarbeite Koordinaten sequentiell, um die BGR-API nicht zu überlasten
    for (const coord of limitedCoordinates) {
      const result = await this.getSoilTypeByCoordinates(coord.lon, coord.lat);
      results.push(result);
    }
    
    return {
      results,
      count: results.length
    };
  }
}

export default new BodenAnalyseService();