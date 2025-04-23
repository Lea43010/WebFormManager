/**
 * Skript zum Generieren einer aktuellen Zugangsseite für Bau-Structura
 * 
 * Dieses Skript erstellt oder aktualisiert eine HTML-Seite mit aktuellen
 * Zugangsinformationen. Es kann manuell oder automatisiert aufgerufen werden.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Konfiguration
const outputPath = path.join(process.cwd(), 'public', 'access.html');
const templatePath = path.join(process.cwd(), 'public', 'access.html');
const replitName = 'workspace-leazimmer';
const tunnelNames = ['bau-structura-app', 'bau-structura-test'];

// Timestamp für aktuelle Version
const now = new Date();
const timestamp = `${now.toLocaleDateString('de-DE')} ${now.toLocaleTimeString('de-DE')}`;

// Prüfe, ob aktive Tunnel existieren
function getActiveTunnels() {
  try {
    // Versuche, aktive Tunnel über Prozessliste zu finden
    const ps = execSync('ps aux | grep localtunnel').toString();
    
    const activeTunnels = [];
    for (const tunnelName of tunnelNames) {
      if (ps.includes(tunnelName)) {
        activeTunnels.push(`https://${tunnelName}.loca.lt`);
      }
    }
    
    return activeTunnels;
  } catch (error) {
    console.error('Fehler beim Erkennen aktiver Tunnel:', error.message);
    return [];
  }
}

// Hauptfunktion zum Generieren der Zugangsseite
function generateAccessPage() {
  try {
    console.log('Generiere aktuelle Zugangsseite...');
    
    // Template laden
    let template = fs.existsSync(templatePath) 
      ? fs.readFileSync(templatePath, 'utf8')
      : getDefaultTemplate();
    
    // Aktuelle Tunnel-URLs erfassen
    const activeTunnels = getActiveTunnels();
    
    // In der Anleitung empfohlene direkte URL
    const recommendedUrl = `https://${replitName}.repl.co`;
    
    // Tunnel-URLs im Template aktualisieren
    let tunnelListHtml = '';
    if (activeTunnels.length > 0) {
      tunnelListHtml = activeTunnels.map(url => 
        `<li><a href="${url}" target="_blank">${url}</a></li>`
      ).join('\n');
    } else {
      tunnelListHtml = tunnelNames.map(name => 
        `<li><a href="https://${name}.loca.lt" target="_blank">https://${name}.loca.lt</a></li>`
      ).join('\n');
    }
    
    // Hauptlink aktualisieren
    template = template.replace(
      /<a href="https:\/\/[^"]*" target="_blank" class="btn btn-primary btn-block">/,
      `<a href="${recommendedUrl}" target="_blank" class="btn btn-primary btn-block">`
    );
    
    // Tunnel-Liste aktualisieren
    template = template.replace(
      /<ul class="link-list">[\s\S]*?<\/ul>/,
      `<ul class="link-list">${tunnelListHtml}</ul>`
    );
    
    // Zeitstempel hinzufügen
    template = template.replace(
      /<footer>[\s\S]*?<\/footer>/,
      `<footer>\n<p>© 2025 Bau-Structura App | Letzte Aktualisierung: ${timestamp}</p>\n</footer>`
    );
    
    // Generierte Seite speichern
    fs.writeFileSync(outputPath, template, 'utf8');
    console.log(`Zugangsseite wurde unter ${outputPath} gespeichert`);
    
  } catch (error) {
    console.error('Fehler beim Generieren der Zugangsseite:', error.message);
  }
}

// Standard-Template (wird nur verwendet, wenn die Template-Datei nicht existiert)
function getDefaultTemplate() {
  return `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bau-Structura Zugang</title>
    <style>
        body { font-family: sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
        .card { border: 1px solid #ddd; border-radius: 8px; margin-bottom: 20px; overflow: hidden; }
        .card-header { padding: 10px 15px; background-color: #0056b3; color: white; }
        .card-body { padding: 15px; }
        .btn { display: inline-block; padding: 10px 15px; background-color: #0056b3; color: white; text-decoration: none; border-radius: 4px; }
        .btn:hover { background-color: #003d82; }
        .btn-block { display: block; width: 100%; text-align: center; }
        .link-list { list-style-type: none; padding-left: 0; }
        .link-list li { padding: 8px 0; border-bottom: 1px solid #eee; }
        .link-list li:last-child { border-bottom: none; }
        footer { margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px; text-align: center; color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <h1>Bau-Structura App</h1>
    <p>Testzugang und Hilfestellungen</p>
    
    <div class="card">
        <div class="card-header">Zugriff auf die Test-Umgebung</div>
        <div class="card-body">
            <h3>Direkte Zugriffs-URLs</h3>
            <p>Folgende URLs können für den Zugriff auf die Anwendung verwendet werden:</p>
            
            <h4>Haupt-URL (Replit):</h4>
            <a href="https://workspace-leazimmer.repl.co" target="_blank" class="btn btn-primary btn-block">Bau-Structura App öffnen</a>
            
            <h4>Alternative Tunnel-URLs:</h4>
            <ul class="link-list">
                <li><a href="https://bau-structura-app.loca.lt" target="_blank">https://bau-structura-app.loca.lt</a></li>
                <li><a href="https://bau-structura-test.loca.lt" target="_blank">https://bau-structura-test.loca.lt</a></li>
            </ul>
        </div>
    </div>
    
    <div class="card">
        <div class="card-header">Problembehebung</div>
        <div class="card-body">
            <h3>IPv4-Adresse Fehlermeldung</h3>
            <p>Falls Sie die Meldung erhalten, dass eine IPv4-Adresse erforderlich ist:</p>
            <ol>
                <li>Sie können dieses Feld leer lassen oder "127.0.0.1" eingeben und dann auf "Weiter" klicken.</li>
                <li>Falls die Meldung "Die IPv4-Adresse ist nicht korrekt" erscheint, schließen Sie das Dialogfenster und kehren Sie zur Anmeldung zurück.</li>
                <li>Verwenden Sie die direkte Replit-URL (erste Option oben), die sollte ohne diese Probleme funktionieren.</li>
            </ol>
        </div>
    </div>
    
    <footer>
        <p>© 2025 Bau-Structura App | Letzte Aktualisierung: [TIMESTAMP]</p>
    </footer>
</body>
</html>`;
}

// Skript ausführen
generateAccessPage();