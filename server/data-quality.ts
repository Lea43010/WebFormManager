import { db } from "./db";
import { sql } from "drizzle-orm";
import { 
  users, 
  customers, 
  persons, 
  companies, 
  constructionDiaryEmployees 
} from "@shared/schema";

// Typdefinitionen für die Datenqualitätsberichte
export interface DataQualityIssue {
  id: number;
  entityType: string;
  entityId: number;
  entityName: string;
  issueType: string;
  issueDescription: string;
  severity: "low" | "medium" | "high";
  detected: string;
  resolved: boolean;
  resolvedAt?: string;
}

export interface DataQualityReport {
  totalRecords: number;
  issues: {
    type: string;
    count: number;
    severity: "low" | "medium" | "high";
    description: string;
    affectedEntities: string[];
  }[];
  overallScore: number;
  lastUpdated: string;
}

/**
 * Validiert eine E-Mail-Adresse mit einer stärkeren Prüfung
 * - Syntaxprüfung nach RFC 5322
 * - Domainprüfung auf bekannte Tippfehler
 */
export function validateEmail(email: string): { isValid: boolean; reason?: string } {
  if (!email) {
    return { isValid: false, reason: "E-Mail-Adresse fehlt" };
  }

  // Grundsätzliche Syntax-Prüfung
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, reason: "Ungültige E-Mail-Syntax" };
  }

  // Prüfung auf bekannte Tippfehler in Domains
  const commonMistyped: Record<string, string> = {
    "gmial.com": "gmail.com",
    "gmail.de": "gmail.com",
    "gmal.com": "gmail.com",
    "hotmial.com": "hotmail.com",
    "hotmal.com": "hotmail.com",
    "yaho.com": "yahoo.com",
    "yahooo.com": "yahoo.com",
    "outlok.com": "outlook.com",
    "outlook.de": "outlook.com"
  };

  const domain = email.split("@")[1].toLowerCase();
  if (domain in commonMistyped) {
    return { 
      isValid: false, 
      reason: `Domain-Tippfehler: ${domain} (meinten Sie ${commonMistyped[domain]}?)` 
    };
  }

  // Prüfung auf weitere ungültige Domains wie .con anstatt .com
  if (domain.endsWith(".con")) {
    return {
      isValid: false,
      reason: `Ungültige TLD: ${domain} (meinten Sie ${domain.replace(".con", ".com")}?)`
    };
  }

  return { isValid: true };
}

/**
 * Validiert eine Telefonnummer für deutsche Nummern
 * - Prüft auf gültige Formate für deutsche Festnetz- und Mobilnummern
 * - Entfernt Leerzeichen und Sonderzeichen für den Vergleich
 */
export function validatePhoneNumber(phone: string): { isValid: boolean; reason?: string; normalized?: string } {
  if (!phone) {
    return { isValid: false, reason: "Telefonnummer fehlt" };
  }

  // Normalisierung: Entfernen aller Zeichen außer Ziffern, + am Anfang und evtl. Klammern
  const normalizedPhone = phone.replace(/[^\d+()]/g, "");
  
  // Deutsche Mobilnummer prüfen (mit oder ohne Ländervorwahl)
  const mobileRegex = /^(\+49|0)[1][5-7][0-9]{8,9}$/;
  
  // Deutsche Festnetznummer prüfen
  const landlineRegex = /^(\+49|0)[2-9][0-9]{5,13}$/;
  
  if (!mobileRegex.test(normalizedPhone) && !landlineRegex.test(normalizedPhone)) {
    return { 
      isValid: false, 
      reason: "Ungültiges Format für deutsche Telefonnummer",
      normalized: normalizedPhone
    };
  }

  // Zu lange Nummern erkennen (mehr als 15 Ziffern nach E.164-Standard)
  if (normalizedPhone.replace(/[^0-9]/g, "").length > 15) {
    return { 
      isValid: false, 
      reason: "Telefonnummer zu lang (max. 15 Ziffern)",
      normalized: normalizedPhone
    };
  }

  // Zu kurze Nummern erkennen (weniger als 8 Ziffern)
  if (normalizedPhone.replace(/[^0-9]/g, "").length < 8) {
    return { 
      isValid: false, 
      reason: "Telefonnummer zu kurz (min. 8 Ziffern)",
      normalized: normalizedPhone
    };
  }

  return { 
    isValid: true, 
    normalized: normalizedPhone 
  };
}

/**
 * Prüft auf ähnliche Namen im selben Kontext
 * @param firstName Vorname
 * @param lastName Nachname
 * @param listToCompare Liste von {firstName, lastName} Objekten zum Vergleich
 * @returns Array von möglichen Duplikaten
 */
export function findSimilarNames(
  firstName: string, 
  lastName: string, 
  listToCompare: { firstName: string; lastName: string; id: number }[]
): { id: number; firstName: string; lastName: string; similarity: number }[] {
  const normalizedFirstName = firstName.toLowerCase().trim();
  const normalizedLastName = lastName.toLowerCase().trim();
  
  return listToCompare
    .map(item => {
      const itemFirstName = item.firstName.toLowerCase().trim();
      const itemLastName = item.lastName.toLowerCase().trim();
      
      // Exakte Übereinstimmung
      if (itemFirstName === normalizedFirstName && itemLastName === normalizedLastName) {
        return { ...item, similarity: 1.0 };
      }
      
      // Berechnung der Ähnlichkeit
      let similarity = 0;
      
      // Jaccard-Ähnlichkeit für Vor- und Nachnamen
      const firstNameSimilarity = calculateJaccardSimilarity(normalizedFirstName, itemFirstName);
      const lastNameSimilarity = calculateJaccardSimilarity(normalizedLastName, itemLastName);
      
      // Gewichtete Kombination (Nachname ist wichtiger)
      similarity = (firstNameSimilarity * 0.4) + (lastNameSimilarity * 0.6);
      
      return { ...item, similarity };
    })
    .filter(item => item.similarity > 0.7) // Nur hohe Ähnlichkeiten zurückgeben
    .sort((a, b) => b.similarity - a.similarity); // Nach Ähnlichkeit sortieren
}

/**
 * Berechnet die Jaccard-Ähnlichkeit zwischen zwei Strings
 * (Anzahl gemeinsamer Zeichen geteilt durch Gesamtanzahl der Zeichen)
 */
function calculateJaccardSimilarity(str1: string, str2: string): number {
  const set1 = new Set(str1.split(''));
  const set2 = new Set(str2.split(''));
  
  // Array.from zur Konvertierung von Set zu Array für TypeScript-Kompatibilität
  const set1Array = Array.from(set1);
  const set2Array = Array.from(set2);
  
  // Berechne Schnittmenge durch Filterung
  const intersection = set1Array.filter(x => set2.has(x));
  
  // Vereinigungsmenge durch Zusammenführen der Arrays und Entfernen von Duplikaten
  const unionArray = [...new Set([...set1Array, ...set2Array])];
  
  return intersection.length / unionArray.length;
}

/**
 * Generiert einen Datenqualitätsbericht für alle relevanten Entitäten im System
 * @returns DataQualityReport
 */
export async function generateDataQualityReport(): Promise<DataQualityReport> {
  try {
    // Zählen der Gesamtanzahl der Datensätze
    const customersCount = await db.select({ count: sql`count(*)` }).from(customers);
    const usersCount = await db.select({ count: sql`count(*)` }).from(users);
    const personsCount = await db.select({ count: sql`count(*)` }).from(persons);
    const companiesCount = await db.select({ count: sql`count(*)` }).from(companies);
    
    const totalRecords = 
      Number(customersCount[0]?.count || 0) + 
      Number(usersCount[0]?.count || 0) + 
      Number(personsCount[0]?.count || 0) + 
      Number(companiesCount[0]?.count || 0);
    
    // Array für alle gefundenen Probleme
    const issues: DataQualityReport['issues'] = [];
    let totalIssues = 0;
    
    // E-Mail-Validierungsprobleme prüfen
    const invalidEmails = await findInvalidEmails();
    if (invalidEmails.length > 0) {
      issues.push({
        type: "email",
        count: invalidEmails.length,
        severity: invalidEmails.length > 10 ? "high" : "medium",
        description: "Ungültige E-Mail-Adressen",
        affectedEntities: ["Kunden", "Benutzer", "Kontakte"]
      });
      totalIssues += invalidEmails.length;
    }
    
    // Telefonnummerprobleme prüfen
    const invalidPhones = await findInvalidPhoneNumbers();
    if (invalidPhones.length > 0) {
      issues.push({
        type: "phone",
        count: invalidPhones.length,
        severity: invalidPhones.length > 15 ? "high" : "medium",
        description: "Ungültige Telefonnummern",
        affectedEntities: ["Kunden", "Kontakte"]
      });
      totalIssues += invalidPhones.length;
    }
    
    // Duplikate bei Mitarbeitern prüfen
    const duplicateEmployees = await findDuplicateEmployees();
    if (duplicateEmployees.length > 0) {
      issues.push({
        type: "duplicate",
        count: duplicateEmployees.length,
        severity: "medium",
        description: "Mögliche Duplikate bei Mitarbeitern",
        affectedEntities: ["Bautagebuch"]
      });
      totalIssues += duplicateEmployees.length;
    }
    
    // Fehlende Felder prüfen
    const missingFields = await findMissingOptionalFields();
    if (missingFields.length > 0) {
      issues.push({
        type: "missing",
        count: missingFields.length,
        severity: "low",
        description: "Fehlende optionale Felder",
        affectedEntities: ["Projekte", "Kunden"]
      });
      totalIssues += missingFields.length;
    }
    
    // Gesamtbewertung berechnen (einfache Formel: 100% - Prozentsatz der Probleme)
    const overallScore = Math.max(0, Math.min(100, Math.round(100 - (totalIssues / totalRecords * 100))));
    
    return {
      totalRecords,
      issues,
      overallScore,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error("Fehler bei der Generierung des Datenqualitätsberichts:", error);
    throw error;
  }
}

/**
 * Sucht nach ungültigen E-Mail-Adressen im System
 */
async function findInvalidEmails(): Promise<DataQualityIssue[]> {
  try {
    const issues: DataQualityIssue[] = [];
    
    // Kunden mit E-Mails prüfen
    const customersWithEmails = await db
      .select({
        id: customers.id,
        email: customers.customerEmail,
        firstName: customers.firstName,
        lastName: customers.lastName
      })
      .from(customers)
      .where(sql`${customers.customerEmail} IS NOT NULL`);
    
    // Benutzer mit E-Mails prüfen
    const usersWithEmails = await db
      .select({
        id: users.id,
        email: users.userEmail,
        name: users.userName
      })
      .from(users)
      .where(sql`${users.userEmail} IS NOT NULL`);
    
    // Kontakte mit E-Mails prüfen
    const personsWithEmails = await db
      .select({
        id: persons.id,
        email: persons.personEmail,
        firstName: persons.firstName,
        lastName: persons.lastName
      })
      .from(persons)
      .where(sql`${persons.personEmail} IS NOT NULL`);
    
    // Kunden validieren
    customersWithEmails.forEach((customer, index) => {
      const validation = validateEmail(customer.email);
      if (!validation.isValid) {
        issues.push({
          id: index + 1, // Generiere eine eindeutige ID
          entityType: "Kunde",
          entityId: customer.id,
          entityName: `${customer.firstName} ${customer.lastName}`,
          issueType: "email",
          issueDescription: `Ungültige E-Mail: ${customer.email} (${validation.reason})`,
          severity: "high",
          detected: new Date().toISOString(),
          resolved: false
        });
      }
    });
    
    // Benutzer validieren
    usersWithEmails.forEach((user, index) => {
      const validation = validateEmail(user.email);
      if (!validation.isValid) {
        issues.push({
          id: customersWithEmails.length + index + 1,
          entityType: "Benutzer",
          entityId: user.id,
          entityName: user.name,
          issueType: "email",
          issueDescription: `Ungültige E-Mail: ${user.email} (${validation.reason})`,
          severity: "high",
          detected: new Date().toISOString(),
          resolved: false
        });
      }
    });
    
    // Kontakte validieren
    personsWithEmails.forEach((person, index) => {
      const validation = validateEmail(person.email);
      if (!validation.isValid) {
        issues.push({
          id: customersWithEmails.length + usersWithEmails.length + index + 1,
          entityType: "Kontakt",
          entityId: person.id,
          entityName: `${person.firstName} ${person.lastName}`,
          issueType: "email",
          issueDescription: `Ungültige E-Mail: ${person.email} (${validation.reason})`,
          severity: "high",
          detected: new Date().toISOString(),
          resolved: false
        });
      }
    });
    
    return issues;
  } catch (error) {
    console.error("Fehler beim Suchen nach ungültigen E-Mail-Adressen:", error);
    return [];
  }
}

/**
 * Sucht nach ungültigen Telefonnummern im System
 */
async function findInvalidPhoneNumbers(): Promise<DataQualityIssue[]> {
  try {
    const issues: DataQualityIssue[] = [];
    
    // Kunden mit Telefonnummern prüfen
    const customersWithPhones = await db
      .select({
        id: customers.id,
        phone: customers.customerPhone,
        firstName: customers.firstName,
        lastName: customers.lastName
      })
      .from(customers)
      .where(sql`${customers.customerPhone} IS NOT NULL`);
    
    // Kontakte mit Telefonnummern prüfen
    const personsWithPhones = await db
      .select({
        id: persons.id,
        phone: persons.personPhone,
        firstName: persons.firstName,
        lastName: persons.lastName
      })
      .from(persons)
      .where(sql`${persons.personPhone} IS NOT NULL`);
    
    // Kunden validieren
    customersWithPhones.forEach((customer, index) => {
      const validation = validatePhoneNumber(customer.phone);
      if (!validation.isValid) {
        issues.push({
          id: index + 1,
          entityType: "Kunde",
          entityId: customer.id,
          entityName: `${customer.firstName} ${customer.lastName}`,
          issueType: "phone",
          issueDescription: `Ungültige Telefonnummer: ${customer.phone} (${validation.reason})`,
          severity: "medium",
          detected: new Date().toISOString(),
          resolved: false
        });
      }
    });
    
    // Kontakte validieren
    personsWithPhones.forEach((person, index) => {
      const validation = validatePhoneNumber(person.phone);
      if (!validation.isValid) {
        issues.push({
          id: customersWithPhones.length + index + 1,
          entityType: "Kontakt",
          entityId: person.id,
          entityName: `${person.firstName} ${person.lastName}`,
          issueType: "phone",
          issueDescription: `Ungültige Telefonnummer: ${person.phone} (${validation.reason})`,
          severity: "medium",
          detected: new Date().toISOString(),
          resolved: false
        });
      }
    });
    
    return issues;
  } catch (error) {
    console.error("Fehler beim Suchen nach ungültigen Telefonnummern:", error);
    return [];
  }
}

/**
 * Sucht nach möglichen Duplikaten bei Bautagebuch-Mitarbeitern
 */
async function findDuplicateEmployees(): Promise<DataQualityIssue[]> {
  try {
    const issues: DataQualityIssue[] = [];
    
    // Gruppiere Mitarbeiter nach Bautagebuch-Einträgen
    const allEmployees = await db.select().from(constructionDiaryEmployees);
    
    // Gruppieren nach Bautagebuch-ID
    const employeesByDiary = allEmployees.reduce((acc, employee) => {
      const diaryId = employee.constructionDiaryId;
      if (!acc[diaryId]) {
        acc[diaryId] = [];
      }
      acc[diaryId].push(employee);
      return acc;
    }, {});
    
    // Für jedes Bautagebuch nach Duplikaten suchen
    let idCounter = 1;
    Object.entries(employeesByDiary).forEach(([diaryId, employees]) => {
      // Prüfe jeden Mitarbeiter gegen alle anderen im selben Eintrag
      employees.forEach(employee => {
        const otherEmployees = employees.filter(e => e.id !== employee.id);
        const similarEmployees = findSimilarNames(
          employee.firstName,
          employee.lastName,
          otherEmployees
        );
        
        // Wenn ähnliche Mitarbeiter gefunden wurden, erstelle ein Issue
        if (similarEmployees.length > 0) {
          const mostSimilar = similarEmployees[0];
          
          issues.push({
            id: idCounter++,
            entityType: "Mitarbeiter",
            entityId: employee.id,
            entityName: `${employee.firstName} ${employee.lastName}`,
            issueType: "duplicate",
            issueDescription: `Mögliches Duplikat: ${mostSimilar.firstName} ${mostSimilar.lastName} (ID: ${mostSimilar.id})`,
            severity: "medium",
            detected: new Date().toISOString(),
            resolved: false
          });
        }
      });
    });
    
    return issues;
  } catch (error) {
    console.error("Fehler beim Suchen nach Mitarbeiter-Duplikaten:", error);
    return [];
  }
}

/**
 * Sucht nach Entitäten mit fehlenden optionalen Feldern
 */
async function findMissingOptionalFields(): Promise<DataQualityIssue[]> {
  try {
    const issues: DataQualityIssue[] = [];
    
    // Kunden mit fehlenden Feldern prüfen
    const customersWithMissingFields = await db
      .select({
        id: customers.id,
        firstName: customers.firstName,
        lastName: customers.lastName,
        street: customers.street,
        city: customers.city,
        postalCode: customers.postalCode
      })
      .from(customers)
      .where(
        sql`${customers.street} IS NULL OR ${customers.city} IS NULL OR ${customers.postalCode} IS NULL`
      );
    
    // Issues für Kunden erstellen
    customersWithMissingFields.forEach((customer, index) => {
      const missingFields = [];
      if (!customer.street) missingFields.push("Straße");
      if (!customer.city) missingFields.push("Stadt");
      if (!customer.postalCode) missingFields.push("PLZ");
      
      issues.push({
        id: index + 1,
        entityType: "Kunde",
        entityId: customer.id,
        entityName: `${customer.firstName} ${customer.lastName}`,
        issueType: "missing",
        issueDescription: `Fehlende Felder: ${missingFields.join(", ")}`,
        severity: "low",
        detected: new Date().toISOString(),
        resolved: false
      });
    });
    
    return issues;
  } catch (error) {
    console.error("Fehler beim Suchen nach fehlenden Feldern:", error);
    return [];
  }
}

/**
 * Liefert eine Liste aller aktuellen Datenqualitätsprobleme
 */
export async function getAllDataQualityIssues(): Promise<DataQualityIssue[]> {
  try {
    // In einer realen Implementierung würden die Issues in einer Datenbank gespeichert
    // und hier abgerufen werden. Für diesen Prototyp generieren wir sie on-the-fly.
    const emailIssues = await findInvalidEmails();
    const phoneIssues = await findInvalidPhoneNumbers();
    const duplicateIssues = await findDuplicateEmployees();
    const missingFieldIssues = await findMissingOptionalFields();
    
    return [
      ...emailIssues,
      ...phoneIssues,
      ...duplicateIssues,
      ...missingFieldIssues
    ];
  } catch (error) {
    console.error("Fehler beim Abrufen der Datenqualitätsprobleme:", error);
    return [];
  }
}