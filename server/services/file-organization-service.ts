import { db } from "../db";
import { Attachment, FileOrganizationSuggestion, InsertFileOrganizationSuggestion, attachments, fileOrganizationSuggestions } from "@shared/schema";
import { eq, inArray, and, like } from "drizzle-orm";
import OpenAI from "openai";
import path from "path";
import fs from "fs";

// Initialisierung von OpenAI mit dem API-Key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Konstantendefinitionen für Kategorien-Schlüsselwörter
const CATEGORY_KEYWORDS = {
  Verträge: ["vertrag", "vereinbarung", "kontrakt", "leistungsverzeichnis", "angebot", "abkommen", "abnahmevereinbarung"],
  Rechnungen: ["rechnung", "zahlung", "invoice", "leistungsnachweis", "kostenaufstellung"],
  Pläne: ["plan", "bauplan", "grundriss", "zeichnung", "skizze", "entwurf", "lageplan", "schnitt", "ansicht"],
  Protokolle: ["protokoll", "besprechung", "meeting", "sitzung", "bautagebuch", "dokumentation"],
  Genehmigungen: ["genehmigung", "antrag", "erlaubnis", "zulassung", "behörde", "bewilligung"],
  Fotos: ["foto", "bild", "image", "aufnahme", "dokumentation", "beweissicherung"],
  Analysen: ["analyse", "gutachten", "bericht", "prüfung", "untersuchung", "boden", "asphalt", "material"],
};

interface AnalysisResult {
  suggestedCategory: "Verträge" | "Rechnungen" | "Pläne" | "Protokolle" | "Genehmigungen" | "Fotos" | "Analysen" | "Andere";
  suggestedTags: string[];
  confidence: number;
  reason: string;
}

/**
 * Analysiert eine Datei basierend auf Namen und (wenn verfügbar) dem Inhalt
 * und gibt Vorschläge für Kategorien und Tags zurück
 */
async function analyzeFile(attachment: Attachment): Promise<AnalysisResult> {
  const fileName = attachment.originalName;
  const fileExtension = path.extname(fileName).toLowerCase().replace(".", "");
  const fileNameWithoutExtension = path.basename(fileName, path.extname(fileName));
  
  // Einfache regelbasierte Kategorisierung basierend auf Dateinamen
  const simpleCategory = determineCategoryByFileName(fileName);
  
  // Wenn wir nur einen Dateinamen haben, verwenden wir die einfache Kategorisierung
  if (!attachment.description) {
    return {
      suggestedCategory: simpleCategory.category,
      suggestedTags: simpleCategory.tags,
      confidence: simpleCategory.confidence,
      reason: `Kategorisierung basierend auf Dateinamen: ${fileName}`
    };
  }
  
  // Komplexere Analyse mit KI, wenn wir eine Beschreibung haben
  try {
    // Nutzung der OpenAI API, um den Dateinamen und die Beschreibung zu analysieren
    const result = await analyzeWithAI(attachment);
    return result;
  } catch (error) {
    console.error("Fehler bei der AI-Analyse:", error);
    
    // Fallback zur einfachen Analyse, wenn die KI-Analyse fehlschlägt
    return {
      suggestedCategory: simpleCategory.category,
      suggestedTags: simpleCategory.tags,
      confidence: simpleCategory.confidence,
      reason: `Einfache Analyse basierend auf Dateinamen: ${fileName} (KI-Analyse fehlgeschlagen)`
    };
  }
}

/**
 * Bestimmt die Kategorie einer Datei anhand des Dateinamens
 */
function determineCategoryByFileName(fileName: string): {
  category: "Verträge" | "Rechnungen" | "Pläne" | "Protokolle" | "Genehmigungen" | "Fotos" | "Analysen" | "Andere";
  tags: string[];
  confidence: number;
} {
  const lowerFileName = fileName.toLowerCase();
  let bestCategory = "Andere";
  let bestScore = 0;
  let tags: string[] = [];
  
  // Prüfen, ob der Dateiname Schlüsselwörter für bestimmte Kategorien enthält
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    const matchedKeywords: string[] = [];
    
    for (const keyword of keywords) {
      if (lowerFileName.includes(keyword.toLowerCase())) {
        score += 0.2;
        matchedKeywords.push(keyword);
      }
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
      tags = matchedKeywords;
    }
  }
  
  // Berücksichtigung des Dateityps für bestimmte Kategorien
  if (lowerFileName.endsWith(".jpg") || lowerFileName.endsWith(".png") || lowerFileName.endsWith(".jpeg")) {
    if (bestScore < 0.3) {
      bestCategory = "Fotos";
      bestScore = Math.max(bestScore, 0.5);
      if (!tags.includes("foto")) tags.push("foto");
    }
  } else if (lowerFileName.endsWith(".pdf")) {
    if (lowerFileName.includes("rechnung") || lowerFileName.includes("invoice")) {
      bestCategory = "Rechnungen";
      bestScore = Math.max(bestScore, 0.7);
      if (!tags.includes("rechnung")) tags.push("rechnung");
    } else if (lowerFileName.includes("vertrag") || lowerFileName.includes("contract")) {
      bestCategory = "Verträge";
      bestScore = Math.max(bestScore, 0.7);
      if (!tags.includes("vertrag")) tags.push("vertrag");
    }
  }
  
  // Minimale Konfidenz von 0.3 für sinnvolle Vorschläge
  return {
    category: bestCategory,
    tags: tags,
    confidence: Math.max(0.3, bestScore)
  };
}

/**
 * Analysiert Datei mit OpenAI API
 */
async function analyzeWithAI(attachment: Attachment): Promise<AnalysisResult> {
  try {
    // Vorbereitung der Anfrage an OpenAI
    const prompt = `
    Analysiere folgende Datei für ein Bauprojektmanagement-System:
    
    Dateiname: ${attachment.originalName}
    Beschreibung: ${attachment.description || "Keine Beschreibung verfügbar"}
    Dateityp: ${attachment.fileType}
    
    Kategorisiere diese Datei in eine der folgenden Kategorien:
    - Verträge
    - Rechnungen
    - Pläne
    - Protokolle
    - Genehmigungen
    - Fotos
    - Analysen
    - Andere
    
    Schlage auch 2-5 relevante Tags für die Datei vor.
    
    Antworte im JSON-Format mit den Feldern:
    - suggestedCategory: Die vorgeschlagene Kategorie
    - suggestedTags: Ein Array von relevanten Tags
    - confidence: Ein Wert zwischen 0 und 1, der die Konfidenz der Kategorisierung angibt
    - reason: Eine kurze Erklärung für die Kategorisierung
    `;

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 1000,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Keine Antwort von OpenAI erhalten");
    }

    // Parse die JSON-Antwort
    const result = JSON.parse(content) as AnalysisResult;
    
    // Stelle sicher, dass die Antwort alle erforderlichen Felder enthält
    if (!result.suggestedCategory || !result.suggestedTags || !result.confidence || !result.reason) {
      throw new Error("Unvollständige Antwort von OpenAI erhalten");
    }
    
    return result;
  } catch (error) {
    console.error("Fehler bei der KI-Analyse:", error);
    
    // Fallback zur manuellen Analyse
    const simpleCategory = determineCategoryByFileName(attachment.originalName);
    return {
      suggestedCategory: simpleCategory.category,
      suggestedTags: simpleCategory.tags,
      confidence: simpleCategory.confidence,
      reason: `Einfache Analyse basierend auf Dateinamen (KI-Fehler): ${attachment.originalName}`
    };
  }
}

/**
 * Analysiert mehrere Dateien und erstellt eine Gruppierungsempfehlung
 */
async function analyzeFilesForGrouping(projectId: number, attachmentIds: number[]): Promise<FileOrganizationSuggestion | null> {
  try {
    // Hole alle angegebenen Anhänge
    const files = await db.select().from(attachments).where(
      and(
        eq(attachments.projectId, projectId),
        inArray(attachments.id, attachmentIds)
      )
    );
    
    if (files.length === 0) {
      console.log("Keine Dateien gefunden");
      return null;
    }
    
    // Analysiere jede Datei einzeln
    const analysisPromises = files.map(file => analyzeFile(file));
    const analysisResults = await Promise.all(analysisPromises);
    
    // Finde die häufigste vorgeschlagene Kategorie
    const categoryCounts = analysisResults.reduce((counts, result) => {
      const category = result.suggestedCategory;
      counts[category] = (counts[category] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    
    let mostCommonCategory = "Andere";
    let maxCount = 0;
    
    for (const [category, count] of Object.entries(categoryCounts)) {
      if (count > maxCount) {
        maxCount = count;
        mostCommonCategory = category;
      }
    }
    
    // Sammle alle vorgeschlagenen Tags
    const allTags = new Set<string>();
    analysisResults.forEach(result => {
      result.suggestedTags.forEach(tag => allTags.add(tag));
    });
    
    // Berechne die durchschnittliche Konfidenz
    const avgConfidence = analysisResults.reduce((sum, result) => sum + result.confidence, 0) / analysisResults.length;
    
    // Erstelle die Begründung
    const reason = `Basierend auf der Analyse von ${files.length} Dateien: ${files.length > 1 ? 
      `${maxCount} von ${files.length} Dateien scheinen zur Kategorie "${mostCommonCategory}" zu gehören.` : 
      `Die Datei scheint zur Kategorie "${mostCommonCategory}" zu gehören.`}`;
    
    // Erstelle den Vorschlag
    const suggestion: InsertFileOrganizationSuggestion = {
      projectId,
      fileIds: attachmentIds.join(','),
      suggestedCategory: mostCommonCategory,
      suggestedTags: Array.from(allTags).join(','),
      reason,
      confidence: avgConfidence,
      isApplied: false,
    };
    
    // Speichere den Vorschlag in der Datenbank
    const [savedSuggestion] = await db.insert(fileOrganizationSuggestions)
      .values(suggestion)
      .returning();
    
    return savedSuggestion;
  } catch (error) {
    console.error("Fehler bei der Gruppenanalyse:", error);
    return null;
  }
}

/**
 * Wendet einen Vorschlag auf die entsprechenden Dateien an
 */
async function applySuggestion(suggestionId: number): Promise<boolean> {
  try {
    // Hole den Vorschlag
    const [suggestion] = await db.select().from(fileOrganizationSuggestions).where(eq(fileOrganizationSuggestions.id, suggestionId));
    
    if (!suggestion) {
      console.error("Vorschlag nicht gefunden");
      return false;
    }
    
    // Extrahiere die Datei-IDs
    const fileIds = suggestion.fileIds?.split(',').map(id => parseInt(id, 10)) || [];
    
    // Aktualisiere jede Datei
    for (const fileId of fileIds) {
      await db.update(attachments)
        .set({
          fileCategory: suggestion.suggestedCategory,
          tags: suggestion.suggestedTags
        })
        .where(eq(attachments.id, fileId));
    }
    
    // Markiere den Vorschlag als angewendet
    await db.update(fileOrganizationSuggestions)
      .set({
        isApplied: true,
        appliedAt: new Date()
      })
      .where(eq(fileOrganizationSuggestions.id, suggestionId));
    
    return true;
  } catch (error) {
    console.error("Fehler beim Anwenden des Vorschlags:", error);
    return false;
  }
}

/**
 * Findet ähnliche Dateien zu einer gegebenen Datei
 */
async function findSimilarFiles(fileId: number, projectId: number): Promise<Attachment[]> {
  try {
    // Hole die Informationen der Ausgangsdatei
    const [file] = await db.select().from(attachments).where(eq(attachments.id, fileId));
    
    if (!file) {
      console.error("Datei nicht gefunden");
      return [];
    }
    
    // Analysiere die Datei
    const analysis = await analyzeFile(file);
    
    // Suche nach Dateien mit ähnlichem Namen oder ähnlicher Beschreibung
    const fileNameWithoutExtension = path.basename(file.originalName, path.extname(file.originalName));
    
    const similarFiles = await db.select().from(attachments).where(
      and(
        eq(attachments.projectId, projectId),
        inArray(attachments.fileType, [file.fileType]),
        // Ignoriere die Ausgangsdatei selbst
        file.id ? inArray(attachments.id, [fileId]).not() : undefined
      )
    );
    
    // Bewerte die Ähnlichkeit der Dateien
    const scoredFiles = similarFiles.map(similarFile => {
      let score = 0;
      
      // Gleicher Dateityp gibt Punkte
      if (similarFile.fileType === file.fileType) {
        score += 0.3;
      }
      
      // Ähnlicher Dateiname gibt Punkte
      const similarFileName = path.basename(similarFile.originalName, path.extname(similarFile.originalName));
      if (similarFileName.includes(fileNameWithoutExtension) || fileNameWithoutExtension.includes(similarFileName)) {
        score += 0.5;
      }
      
      // Ähnliche Beschreibung gibt Punkte
      if (similarFile.description && file.description && 
          (similarFile.description.includes(file.description) || file.description.includes(similarFile.description))) {
        score += 0.3;
      }
      
      return { file: similarFile, score };
    });
    
    // Sortiere nach Ähnlichkeitswert und gib die Top-Treffer zurück
    return scoredFiles
      .filter(scoredFile => scoredFile.score > 0.3) // Nur Dateien mit ausreichender Ähnlichkeit
      .sort((a, b) => b.score - a.score)
      .map(scoredFile => scoredFile.file);
    
  } catch (error) {
    console.error("Fehler beim Finden ähnlicher Dateien:", error);
    return [];
  }
}

/**
 * Erstellt automatisch Vorschläge für alle unorganisierten Dateien eines Projekts
 */
async function createSuggestionsForProject(projectId: number): Promise<FileOrganizationSuggestion[]> {
  try {
    // Hole alle Anhänge ohne Kategorie oder Tags
    const unorganizedFiles = await db.select().from(attachments).where(
      and(
        eq(attachments.projectId, projectId),
        // Entweder keine Kategorie oder Standardkategorie "Andere"
        inArray(attachments.fileCategory, [null, undefined, "Andere"]),
        // Keine Tags
        inArray(attachments.tags, [null, undefined, ""])
      )
    );
    
    if (unorganizedFiles.length === 0) {
      console.log("Keine unorganisierten Dateien gefunden");
      return [];
    }
    
    console.log(`${unorganizedFiles.length} unorganisierte Dateien gefunden`);
    
    // Gruppiere Dateien nach Ähnlichkeit für gemeinsame Vorschläge
    const fileGroups: Attachment[][] = [];
    const processedFiles = new Set<number>();
    
    // Durchlaufe alle unorganisierten Dateien
    for (const file of unorganizedFiles) {
      if (processedFiles.has(file.id)) continue;
      
      // Finde ähnliche Dateien
      const similarFiles = await findSimilarFiles(file.id, projectId);
      
      // Erstelle eine neue Gruppe mit dieser Datei und den ähnlichen Dateien
      const group = [file, ...similarFiles];
      fileGroups.push(group);
      
      // Markiere alle Dateien in der Gruppe als verarbeitet
      group.forEach(f => processedFiles.add(f.id));
    }
    
    // Erstelle für jede Gruppe einen Vorschlag
    const suggestionPromises = fileGroups.map(group => 
      analyzeFilesForGrouping(projectId, group.map(file => file.id))
    );
    
    // Warte auf alle Vorschläge
    const suggestions = await Promise.all(suggestionPromises);
    
    // Filtere null-Werte
    return suggestions.filter(suggestion => suggestion !== null) as FileOrganizationSuggestion[];
    
  } catch (error) {
    console.error("Fehler beim Erstellen von Vorschlägen:", error);
    return [];
  }
}

// Exportiere die öffentlichen Funktionen
export default {
  analyzeFile,
  analyzeFilesForGrouping,
  applySuggestion,
  findSimilarFiles,
  createSuggestionsForProject
};