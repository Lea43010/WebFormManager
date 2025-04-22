/**
 * Einfaches Skript zum Senden einer simulierten E-Mail
 */
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import config from '../config.js';

// Dateipfade in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Lade Umgebungsvariablen
dotenv.config({ path: resolve(__dirname, '../.env') });
dotenv.config({ path: resolve(__dirname, '../.env.development') });

// Parameter aus Befehlszeile
const email = process.argv[2] || 'lea.zimmer@gmx.net';
const subject = process.argv[3] || 'Test der Domain-Authentifizierung - Bau-Structura';
const message = process.argv[4] || 'Dies ist ein Test der E-Mail-Funktionalität mit der authentifizierten Domain bau-structura.de.';

console.log('\n======== TEST-E-MAIL SIMULATION ========');
console.log(`Von: Bau-Structura <info@bau-structura.de>`);
console.log(`An: ${email}`);
console.log(`Betreff: ${subject}`);
console.log(`Nachricht: ${message}`);
console.log(`Datum: ${new Date().toLocaleString('de-DE')}`);
console.log(`App-URL: ${config.APP_URL}`);
console.log('========================================\n');

console.log('✅ Test-E-Mail-Simulation erfolgreich. Sobald der korrekte API-Schlüssel vorliegt, wird der E-Mail-Versand an echte E-Mail-Adressen erfolgen.');