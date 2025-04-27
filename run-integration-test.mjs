import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Starte Integrationstest...');
console.log('Führe Integration-Test aus: integration-tests/app-integration.test.js');

exec('node integration-tests/app-integration.test.js', (error, stdout, stderr) => {
  if (error) {
    console.error(`Fehler bei der Ausführung: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Fehler: ${stderr}`);
    return;
  }
  console.log(stdout);
});