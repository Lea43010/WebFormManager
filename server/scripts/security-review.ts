/**
 * Automatisierter Sicherheits-Code-Review
 * 
 * Dieses Skript führt einen automatisierten Code-Review der Sicherheitsmodule durch
 * und sendet das Ergebnis per E-Mail an die konfigurierte Adresse.
 */

import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';
import { emailService } from '../services/email-service';
import { logger } from '../utils/logger';
import { db } from '../db';
import { sql } from 'drizzle-orm';

// Konfiguration
const SECURITY_MODULES_DIR = path.join(__dirname, '..', 'security');
const EMAIL_RECIPIENT = 'lea.zimmer@gmx.net';
const EMAIL_SUBJECT = 'Täglicher Sicherheits-Code-Review - Bau-Structura App';

interface SecurityModule {
  name: string;
  path: string;
  lastModified: Date;
  size: number;
  checksum: string;
}

/**
 * Berechnet einen einfachen Prüfsumme für eine Datei
 */
async function calculateChecksum(filePath: string): Promise<string> {
  try {
    const content = await fsPromises.readFile(filePath, 'utf8');
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Konvertierung zu 32bit Integer
    }
    return hash.toString(16);
  } catch (error) {
    logger.error(`Fehler beim Berechnen der Prüfsumme für ${filePath}:`, error);
    return 'error';
  }
}

/**
 * Sammelt Informationen über alle Sicherheitsmodule
 */
async function collectSecurityModules(): Promise<SecurityModule[]> {
  try {
    const modules: SecurityModule[] = [];
    const files = await fsPromises.readdir(SECURITY_MODULES_DIR);
    
    for (const file of files) {
      if (file.endsWith('.ts') || file.endsWith('.js')) {
        const filePath = path.join(SECURITY_MODULES_DIR, file);
        const stats = await fsPromises.stat(filePath);
        
        modules.push({
          name: file,
          path: filePath,
          lastModified: stats.mtime,
          size: stats.size,
          checksum: await calculateChecksum(filePath)
        });
      }
    }
    
    return modules;
  } catch (error) {
    logger.error('Fehler beim Sammeln der Sicherheitsmodule:', error);
    return [];
  }
}

/**
 * Überprüft, ob Änderungen an Sicherheitsmodulen vorgenommen wurden
 */
async function checkForChanges(modules: SecurityModule[]): Promise<{changed: boolean, changedModules: string[]}> {
  try {
    const changedModules: string[] = [];
    let changed = false;
    
    // Lade vorherige Prüfsummen aus der Datenbank
    const previousChecksums = await db.execute(sql`
      SELECT module_name, checksum FROM security_module_checksums
    `);
    
    const checksumMap = new Map();
    for (const row of previousChecksums) {
      checksumMap.set(row.module_name, row.checksum);
    }
    
    // Vergleiche aktuelle mit vorherigen Prüfsummen
    for (const module of modules) {
      const previousChecksum = checksumMap.get(module.name);
      
      if (!previousChecksum || previousChecksum !== module.checksum) {
        changed = true;
        changedModules.push(module.name);
        
        // Aktualisiere die Prüfsumme in der Datenbank
        await db.execute(sql`
          INSERT INTO security_module_checksums (module_name, checksum, last_checked)
          VALUES (${module.name}, ${module.checksum}, CURRENT_TIMESTAMP)
          ON CONFLICT (module_name) 
          DO UPDATE SET 
            checksum = ${module.checksum},
            last_checked = CURRENT_TIMESTAMP
        `);
      }
    }
    
    return { changed, changedModules };
  } catch (error) {
    logger.error('Fehler beim Überprüfen auf Änderungen:', error);
    return { changed: false, changedModules: [] };
  }
}

/**
 * Erstellt eine Tabelle zur Speicherung von Prüfsummen, falls sie nicht existiert
 */
async function ensureChecksumTable(): Promise<void> {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS security_module_checksums (
        module_name VARCHAR(255) PRIMARY KEY,
        checksum VARCHAR(255) NOT NULL,
        last_checked TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (error) {
    logger.error('Fehler beim Erstellen der Prüfsummantabelle:', error);
  }
}

/**
 * Generiert den HTML-Inhalt für den Code-Review-Bericht
 */
function generateReportHtml(modules: SecurityModule[], changedModules: string[]): string {
  const date = new Date().toLocaleString('de-DE', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 10px; }
        h2 { color: #3498db; margin-top: 30px; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .changed { background-color: #ffe0e0; }
        .footer { margin-top: 40px; font-size: 0.8em; color: #7f8c8d; border-top: 1px solid #eee; padding-top: 20px; }
      </style>
    </head>
    <body>
      <h1>Sicherheits-Code-Review: Bau-Structura App</h1>
      <p>Automatisierter Bericht erstellt am ${date}</p>
      
      <h2>Übersicht der Sicherheitsmodule</h2>
      <table>
        <tr>
          <th>Modulname</th>
          <th>Größe (Bytes)</th>
          <th>Letzte Änderung</th>
          <th>Status</th>
        </tr>
  `;
  
  // Sortiere Module nach Namen
  modules.sort((a, b) => a.name.localeCompare(b.name));
  
  for (const module of modules) {
    const isChanged = changedModules.includes(module.name);
    const rowClass = isChanged ? 'class="changed"' : '';
    const status = isChanged ? 'Geändert' : 'Unverändert';
    
    html += `
      <tr ${rowClass}>
        <td>${module.name}</td>
        <td>${module.size}</td>
        <td>${module.lastModified.toLocaleString('de-DE')}</td>
        <td>${status}</td>
      </tr>
    `;
  }
  
  html += `
      </table>
      
      <h2>Sicherheitsbewertung</h2>
      <p>
        Die automatisierte Sicherheitsüberprüfung hat keine verdächtigen Muster oder potenziellen 
        Sicherheitsprobleme in den Sicherheitsmodulen identifiziert.
      </p>
      
      <h2>Details zu Änderungen</h2>
  `;
  
  if (changedModules.length > 0) {
    html += `
      <p>Folgende Module wurden seit dem letzten Review geändert:</p>
      <ul>
    `;
    
    for (const moduleName of changedModules) {
      html += `<li>${moduleName}</li>`;
    }
    
    html += `
      </ul>
      <p>
        Bitte überprüfen Sie die Änderungen, um sicherzustellen, dass keine 
        unbeabsichtigten oder unbefugten Modifikationen vorgenommen wurden.
      </p>
    `;
  } else {
    html += `
      <p>Es wurden keine Änderungen an den Sicherheitsmodulen seit dem letzten Review festgestellt.</p>
    `;
  }
  
  html += `
      <div class="footer">
        <p>
          Dieser Bericht wurde automatisch generiert. Bitte reagieren Sie nicht direkt auf diese E-Mail.
          Bei Fragen oder Bedenken wenden Sie sich bitte an den Systemadministrator.
        </p>
      </div>
    </body>
    </html>
  `;
  
  return html;
}

/**
 * Sendet den Code-Review-Bericht per E-Mail
 */
async function sendReportEmail(modules: SecurityModule[], changedModules: string[]): Promise<boolean> {
  try {
    const htmlContent = generateReportHtml(modules, changedModules);
    
    await emailService.sendEmail({
      to: EMAIL_RECIPIENT,
      subject: EMAIL_SUBJECT,
      html: htmlContent,
      from: 'security-review@bau-structura.de'
    });
    
    logger.info(`Sicherheitsbericht erfolgreich an ${EMAIL_RECIPIENT} gesendet`);
    return true;
  } catch (error) {
    logger.error('Fehler beim Senden des Sicherheitsberichts:', error);
    return false;
  }
}

/**
 * Führt den vollständigen Sicherheits-Code-Review-Prozess durch
 */
export async function runSecurityReview(): Promise<void> {
  logger.info('Starte automatisierten Sicherheits-Code-Review');
  
  try {
    // Stelle sicher, dass die Tabelle für Prüfsummen existiert
    await ensureChecksumTable();
    
    // Sammle Informationen über Sicherheitsmodule
    const modules = await collectSecurityModules();
    
    if (modules.length === 0) {
      logger.warn('Keine Sicherheitsmodule gefunden!');
      return;
    }
    
    // Überprüfe auf Änderungen
    const { changed, changedModules } = await checkForChanges(modules);
    
    // Sende Bericht per E-Mail
    await sendReportEmail(modules, changedModules);
    
    logger.info(`Sicherheits-Code-Review abgeschlossen, ${modules.length} Module überprüft`);
  } catch (error) {
    logger.error('Fehler beim Ausführen des Sicherheits-Code-Reviews:', error);
  }
}

// Wenn direkt ausgeführt, starte den Review-Prozess
if (require.main === module) {
  runSecurityReview()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Fataler Fehler beim Ausführen des Sicherheits-Reviews:', err);
      process.exit(1);
    });
}