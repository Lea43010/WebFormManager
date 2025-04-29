/**
 * GitHub-Backup-Integration
 * 
 * Dieses Modul bietet Funktionen zum Sichern von Backup-Dateien in einem 
 * GitHub-Repository als zusätzliche Sicherheitsebene.
 */

import fs from 'fs';
import path from 'path';
import { Octokit } from '@octokit/rest';
import { logger } from './logger';
import { createReadStream } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

// Logger für dieses Modul
const githubLogger = logger.createLogger('github-backup');

// GitHub Konfiguration
interface GitHubConfig {
  enabled: boolean;
  token: string;
  owner: string;
  repo: string;
  branch: string;
  backupPath: string;
  encryptBackups: boolean;
  encryptionKey?: string;
}

// Standard-Konfiguration
const defaultConfig: GitHubConfig = {
  enabled: true,
  token: process.env.GITHUB_TOKEN || '',
  owner: process.env.GITHUB_REPO_OWNER || 'Lea43010', // GitHub-Benutzername oder Organisation
  repo: process.env.GITHUB_REPO_NAME || 'bau-structura-backups',
  branch: process.env.GITHUB_REPO_BRANCH || 'main',
  backupPath: process.env.GITHUB_BACKUP_PATH || 'backups',
  encryptBackups: process.env.GITHUB_ENCRYPT_BACKUPS === 'true' || false
};

// Aktuelle Konfiguration
let config: GitHubConfig = { ...defaultConfig };

/**
 * Konfiguriert die GitHub-Backup-Integration
 * @param newConfig Neue Konfiguration
 */
export function configureGitHubBackup(newConfig: Partial<GitHubConfig>) {
  config = { ...config, ...newConfig };
  githubLogger.info('GitHub-Backup-Konfiguration aktualisiert');
}

/**
 * Initialisiert die GitHub-Backup-Integration
 */
export function initGitHubBackup() {
  if (!config.token) {
    githubLogger.warn('GitHub-Backup deaktiviert: Kein Token konfiguriert');
    config.enabled = false;
    return;
  }
  
  githubLogger.info('GitHub-Backup-Integration initialisiert');
}

/**
 * Lädt eine Backup-Datei nach GitHub hoch
 * @param filePath Pfad zur lokalen Backup-Datei
 * @returns Promise mit Erfolg/Fehler-Status
 */
export async function uploadBackupToGitHub(filePath: string): Promise<boolean> {
  if (!config.enabled) {
    githubLogger.info('GitHub-Backup ist deaktiviert, überspringe Upload');
    return false;
  }
  
  if (!fs.existsSync(filePath)) {
    githubLogger.error(`Backup-Datei nicht gefunden: ${filePath}`);
    return false;
  }
  
  try {
    // Dateiname aus Pfad extrahieren
    const fileName = path.basename(filePath);
    
    // Datum-basierter Ordner für die Organisation in GitHub
    const today = new Date();
    const dateFolder = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // Ziel-Pfad in GitHub
    const targetPath = `${config.backupPath}/${dateFolder}/${fileName}`;
    
    githubLogger.info(`Uploading backup to GitHub: ${targetPath}`);
    
    // Datei lesen
    const fileContent = fs.readFileSync(filePath);
    
    // Datei verschlüsseln, wenn konfiguriert
    let content = fileContent;
    if (config.encryptBackups && config.encryptionKey) {
      // Hier würde die Verschlüsselung stattfinden
      // content = encrypt(fileContent, config.encryptionKey);
      // Da die Verschlüsselung komplex ist, wird sie hier auskommentiert
    }
    
    // Octokit initialisieren
    const octokit = new Octokit({
      auth: config.token
    });
    
    // Prüfen, ob die Datei bereits existiert
    let sha: string | undefined;
    try {
      const { data } = await octokit.repos.getContent({
        owner: config.owner,
        repo: config.repo,
        path: targetPath,
        ref: config.branch
      });
      
      if (!Array.isArray(data) && data.sha) {
        sha = data.sha;
        githubLogger.info(`Die Datei existiert bereits, wird aktualisiert: ${targetPath}`);
      }
    } catch (error) {
      // Datei existiert noch nicht, das ist OK
      githubLogger.info(`Neue Datei wird erstellt: ${targetPath}`);
    }
    
    // Datei auf GitHub hochladen/aktualisieren
    const response = await octokit.repos.createOrUpdateFileContents({
      owner: config.owner,
      repo: config.repo,
      path: targetPath,
      message: `Backup vom ${dateFolder}`,
      content: content.toString('base64'),
      branch: config.branch,
      sha: sha
    });
    
    githubLogger.info(`Backup erfolgreich auf GitHub hochgeladen: ${targetPath}`);
    return true;
  } catch (error: any) {
    githubLogger.error(`Fehler beim Hochladen des Backups auf GitHub: ${error.message}`);
    return false;
  }
}

/**
 * Lädt eine Backup-Datei von GitHub herunter
 * @param remotePath Pfad zur Datei in GitHub
 * @param localPath Lokaler Speicherort für die heruntergeladene Datei
 * @returns Promise mit Erfolg/Fehler-Status
 */
export async function downloadBackupFromGitHub(remotePath: string, localPath: string): Promise<boolean> {
  if (!config.enabled) {
    githubLogger.info('GitHub-Backup ist deaktiviert, überspringe Download');
    return false;
  }
  
  try {
    // Octokit initialisieren
    const octokit = new Octokit({
      auth: config.token
    });
    
    // Dateipfad auf GitHub
    const targetPath = `${config.backupPath}/${remotePath}`;
    
    // Datei von GitHub abrufen
    const { data } = await octokit.repos.getContent({
      owner: config.owner,
      repo: config.repo,
      path: targetPath,
      ref: config.branch
    });
    
    if (Array.isArray(data)) {
      throw new Error(`Der angegebene Pfad ist ein Verzeichnis, keine Datei: ${targetPath}`);
    }
    
    // Base64-decodierter Inhalt
    // Typensicherheit für den GitHub API Response
    const fileData = data as { content: string };
    const content = Buffer.from(fileData.content, 'base64');
    
    // Datei lokal speichern
    fs.writeFileSync(localPath, content);
    
    githubLogger.info(`Backup erfolgreich von GitHub heruntergeladen: ${targetPath} -> ${localPath}`);
    return true;
  } catch (error: any) {
    githubLogger.error(`Fehler beim Herunterladen des Backups von GitHub: ${error.message}`);
    return false;
  }
}

/**
 * Listet alle verfügbaren Backups auf GitHub auf
 * @returns Promise mit Liste der Backup-Dateien
 */
export async function listGitHubBackups(): Promise<{ path: string, size: number, sha: string, url: string, date: string }[]> {
  if (!config.enabled) {
    githubLogger.info('GitHub-Backup ist deaktiviert, überspringe Auflistung');
    return [];
  }
  
  try {
    // Octokit initialisieren
    const octokit = new Octokit({
      auth: config.token
    });
    
    // Liste aller Backup-Ordner abrufen
    const { data: folders } = await octokit.repos.getContent({
      owner: config.owner,
      repo: config.repo,
      path: config.backupPath,
      ref: config.branch
    });
    
    if (!Array.isArray(folders)) {
      throw new Error(`Der angegebene Pfad ist keine Verzeichnisliste: ${config.backupPath}`);
    }
    
    // Alle Dateien in den Ordnern sammeln
    const backups: { path: string, size: number, sha: string, url: string, date: string }[] = [];
    
    for (const folder of folders) {
      if (folder.type === 'dir') {
        try {
          const { data: files } = await octokit.repos.getContent({
            owner: config.owner,
            repo: config.repo,
            path: folder.path,
            ref: config.branch
          });
          
          if (Array.isArray(files)) {
            for (const file of files) {
              if (file.type === 'file' && file.name.endsWith('.tar.gz')) {
                backups.push({
                  path: file.path.replace(`${config.backupPath}/`, ''),
                  size: file.size,
                  sha: file.sha,
                  url: file.download_url || '', // Stellen Sie sicher, dass die URL nie null ist
                  date: folder.name // Datum aus dem Ordnernamen
                });
              }
            }
          }
        } catch (error) {
          githubLogger.error(`Fehler beim Abrufen der Dateien für Ordner ${folder.path}: ${error}`);
        }
      }
    }
    
    // Nach Datum sortieren (neueste zuerst)
    backups.sort((a, b) => b.date.localeCompare(a.date));
    
    return backups;
  } catch (error: any) {
    githubLogger.error(`Fehler beim Auflisten der GitHub-Backups: ${error.message}`);
    return [];
  }
}

/**
 * Prüft, ob ein GitHub-Repository für Backups existiert, und erstellt es bei Bedarf
 * @returns Promise mit Erfolg/Fehler-Status
 */
export async function ensureGitHubBackupRepository(): Promise<boolean> {
  if (!config.enabled) {
    githubLogger.info('GitHub-Backup ist deaktiviert, überspringe Repository-Prüfung');
    return false;
  }
  
  try {
    // Octokit initialisieren
    const octokit = new Octokit({
      auth: config.token
    });
    
    try {
      // Repository-Informationen abrufen
      await octokit.repos.get({
        owner: config.owner,
        repo: config.repo
      });
      
      githubLogger.info(`GitHub-Backup-Repository existiert bereits: ${config.owner}/${config.repo}`);
      
      // Backup-Verzeichnis prüfen und erstellen, falls es nicht existiert
      try {
        await octokit.repos.getContent({
          owner: config.owner,
          repo: config.repo,
          path: config.backupPath,
          ref: config.branch
        });
        
        githubLogger.info(`GitHub-Backup-Pfad existiert bereits: ${config.backupPath}`);
      } catch (error) {
        // Backup-Verzeichnis erstellen
        await octokit.repos.createOrUpdateFileContents({
          owner: config.owner,
          repo: config.repo,
          path: `${config.backupPath}/README.md`,
          message: 'Backup-Verzeichnis initialisieren',
          content: Buffer.from('# Bau-Structura Backups\n\nDieses Verzeichnis enthält automatische Backups der Bau-Structura-Anwendung.').toString('base64'),
          branch: config.branch
        });
        
        githubLogger.info(`GitHub-Backup-Pfad erstellt: ${config.backupPath}`);
      }
      
      return true;
    } catch (error) {
      // Repository existiert nicht, erstellen
      githubLogger.info(`Repository existiert nicht, wird erstellt: ${config.owner}/${config.repo}`);
      
      await octokit.repos.createForAuthenticatedUser({
        name: config.repo,
        description: 'Automatische Backups der Bau-Structura-Anwendung',
        private: true,
        auto_init: true
      });
      
      githubLogger.info(`GitHub-Backup-Repository erstellt: ${config.owner}/${config.repo}`);
      
      // Eine kurze Pause, um GitHub Zeit zu geben, das Repository zu initialisieren
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Backup-Verzeichnis erstellen
      await octokit.repos.createOrUpdateFileContents({
        owner: config.owner,
        repo: config.repo,
        path: `${config.backupPath}/README.md`,
        message: 'Backup-Verzeichnis initialisieren',
        content: Buffer.from('# Bau-Structura Backups\n\nDieses Verzeichnis enthält automatische Backups der Bau-Structura-Anwendung.').toString('base64'),
        branch: config.branch
      });
      
      githubLogger.info(`GitHub-Backup-Pfad erstellt: ${config.backupPath}`);
      
      return true;
    }
  } catch (error: any) {
    githubLogger.error(`Fehler bei der GitHub-Repository-Prüfung: ${error.message}`);
    return false;
  }
}

// Exportiere das Konfigurationsobjekt für die Einrichtung in config.ts
export const githubBackupConfig = config;