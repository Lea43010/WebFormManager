// BodenAnalyseService.ts
// Dieser Service verwaltet die Kommunikation mit dem Bodenanalyse-API-Endpunkt

import axios from 'axios';

// Typdefinitionen
export interface BodenartResult {
  bodenartCode: string;
  bodenartBeschreibung: string;
  klassifikation: string;
  farbe: string;
  koordinaten: {
    latitude: number;
    longitude: number;
  };
}

export interface Koordinate {
  longitude: number;
  latitude: number;
}

export interface BatchResult {
  ergebnisse: BodenartResult[];
  anzahl: number;
}

// Service-Klasse für die Bodenanalyse
class BodenAnalyseService {
  private readonly apiBaseUrl = '/api/soil-analysis';
  
  // Holt die Bodenart für eine bestimmte Koordinate
  public async getBodenartByCoords(lon: number, lat: number): Promise<BodenartResult> {
    try {
      const response = await axios.get(`${this.apiBaseUrl}`, {
        params: {
          lon,
          lat
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Fehler bei der Bodenanalyse-Anfrage:', error);
      throw error;
    }
  }
  
  // Führt eine Batch-Verarbeitung mehrerer Koordinaten durch
  public async batchProcess(coordinates: Koordinate[], maxPoints: number = 100): Promise<BatchResult> {
    try {
      const response = await axios.post(`${this.apiBaseUrl}/batch`, {
        coordinates,
        maxPoints
      });
      
      return response.data;
    } catch (error) {
      console.error('Fehler bei der Batch-Verarbeitung:', error);
      throw error;
    }
  }
  
  // Holt alle verfügbaren Bodenklassifikationen
  public async getKlassifikationen(): Promise<string[]> {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/classifications`);
      return response.data.classifications;
    } catch (error) {
      console.error('Fehler beim Abrufen der Klassifikationen:', error);
      throw error;
    }
  }
  
  // Holt die Farbzuordnung für die Klassifikationen
  public async getColorMapping(): Promise<Record<string, string>> {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/color-mapping`);
      return response.data.colorMapping;
    } catch (error) {
      console.error('Fehler beim Abrufen der Farbzuordnung:', error);
      throw error;
    }
  }
}

export default new BodenAnalyseService();