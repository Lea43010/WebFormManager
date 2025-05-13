import { sql } from '../db';

/**
 * Interface für eine Bodenart
 */
export interface Bodenart {
  id: number;
  name: string;
  klasse: string;
  beschreibung: string;
  kosten_pro_m2: number;
}

/**
 * Interface für die Erstellung einer neuen Bodenart
 */
export interface CreateBodenartData {
  name: string;
  klasse: string;
  beschreibung: string;
  kosten_pro_m2: number;
}

/**
 * Interface für die Aktualisierung einer Bodenart
 */
export interface UpdateBodenartData {
  name?: string;
  klasse?: string;
  beschreibung?: string;
  kosten_pro_m2?: number;
}

/**
 * Service für die Verwaltung von Bodenarten
 */
export class BodenartService {
  /**
   * Alle Bodenarten abrufen
   */
  static async getAll(): Promise<Bodenart[]> {
    try {
      const result = await sql`
        SELECT * FROM bodenarten
        ORDER BY name ASC
      `;
      return result as unknown as Bodenart[];
    } catch (error) {
      console.error('Fehler beim Abrufen der Bodenarten:', error);
      throw new Error('Fehler beim Abrufen der Bodenarten');
    }
  }

  /**
   * Eine Bodenart nach ID abrufen
   */
  static async getById(id: number): Promise<Bodenart | null> {
    try {
      const result = await sql`
        SELECT * FROM bodenarten
        WHERE id = ${id}
      `;
      
      return result.length > 0 ? (result[0] as unknown as Bodenart) : null;
    } catch (error) {
      console.error(`Fehler beim Abrufen der Bodenart mit ID ${id}:`, error);
      throw new Error('Fehler beim Abrufen der Bodenart');
    }
  }

  /**
   * Eine neue Bodenart erstellen
   */
  static async create(data: CreateBodenartData): Promise<Bodenart> {
    try {
      const result = await sql`
        INSERT INTO bodenarten
          (name, klasse, beschreibung, kosten_pro_m2)
        VALUES
          (${data.name}, ${data.klasse}, ${data.beschreibung}, ${data.kosten_pro_m2})
        RETURNING *
      `;
      
      return result[0] as unknown as Bodenart;
    } catch (error) {
      console.error('Fehler beim Erstellen der Bodenart:', error);
      throw new Error('Fehler beim Erstellen der Bodenart');
    }
  }

  /**
   * Eine Bodenart aktualisieren
   */
  static async update(id: number, data: UpdateBodenartData): Promise<Bodenart | null> {
    try {
      // Erstelle dynamisches SET-Statement basierend auf den übergebenen Feldern
      const updateFields: Record<string, any> = {};
      
      if (data.name !== undefined) updateFields.name = data.name;
      if (data.klasse !== undefined) updateFields.klasse = data.klasse;
      if (data.beschreibung !== undefined) updateFields.beschreibung = data.beschreibung;
      if (data.kosten_pro_m2 !== undefined) updateFields.kosten_pro_m2 = data.kosten_pro_m2;
      
      // Wenn keine Felder aktualisiert werden sollen
      if (Object.keys(updateFields).length === 0) {
        return await this.getById(id);
      }
      
      // Da wir ein komplexes SQL-Statement mit ${sql(updateFields)} haben,
      // müssen wir es anders formulieren
      let updateQuery = 'UPDATE bodenarten SET ';
      const updateValues = [];
      const keys = Object.keys(updateFields);
      
      keys.forEach((key, index) => {
        updateQuery += `${key} = $${index + 1}`;
        updateValues.push(updateFields[key]);
        if (index < keys.length - 1) updateQuery += ', ';
      });
      
      updateQuery += ` WHERE id = $${keys.length + 1} RETURNING *`;
      updateValues.push(id);
      
      const result = await sql.raw(updateQuery, updateValues);
      
      return result.length > 0 ? (result[0] as unknown as Bodenart) : null;
    } catch (error) {
      console.error(`Fehler beim Aktualisieren der Bodenart mit ID ${id}:`, error);
      throw new Error('Fehler beim Aktualisieren der Bodenart');
    }
  }

  /**
   * Eine Bodenart löschen
   */
  static async delete(id: number): Promise<boolean> {
    try {
      const result = await sql`
        WITH deleted AS (
          DELETE FROM bodenarten
          WHERE id = ${id}
          RETURNING *
        )
        SELECT COUNT(*) FROM deleted
      `;
      
      return Number(result[0].count) > 0;
    } catch (error) {
      console.error(`Fehler beim Löschen der Bodenart mit ID ${id}:`, error);
      throw new Error('Fehler beim Löschen der Bodenart');
    }
  }
}