/**
 * Skript zum Aktualisieren der Rolle eines Benutzers
 * 
 * Dieses Skript ändert die Rolle eines existierenden Benutzers.
 * 
 * Verwendung:
 * npx tsx scripts/update-user-role.ts --username [username] --role [role]
 * 
 * Gültige Rollen: administrator, manager, benutzer
 */

import { sql } from '../server/db';

// Kommandozeilenargumente parsen
const args = process.argv.slice(2);
let username = '';
let role = '';

for (let i = 0; i < args.length; i += 2) {
  const arg = args[i];
  const value = args[i + 1];
  
  if (arg === '--username') username = value;
  if (arg === '--role') role = value;
}

// Prüfen, ob erforderliche Parameter vorhanden sind
if (!username || !role) {
  console.error('Fehler: Benutzername und Rolle sind erforderlich!');
  console.log('Verwendung: npx tsx scripts/update-user-role.ts --username [username] --role [role]');
  console.log('Gültige Rollen: administrator, manager, benutzer');
  process.exit(1);
}

// Gültige Rollen definieren
const validRoles = ['administrator', 'manager', 'benutzer'];
if (!validRoles.includes(role)) {
  console.error(`Fehler: "${role}" ist keine gültige Rolle!`);
  console.log('Gültige Rollen: administrator, manager, benutzer');
  process.exit(1);
}

async function updateUserRole() {
  try {
    console.log(`Prüfe Benutzer ${username}...`);
    
    // Prüfen, ob der Benutzer existiert
    const checkResult = await sql`
      SELECT id, username, user_name, user_email, role FROM tbluser WHERE username = ${username}
    `;
    
    if (checkResult.length === 0) {
      console.error(`Fehler: Benutzer "${username}" existiert nicht!`);
      process.exit(1);
    }
    
    const user = checkResult[0];
    
    if (user.role === role) {
      console.log(`Benutzer ${username} hat bereits die Rolle "${role}".`);
      process.exit(0);
    }
    
    // Rolle aktualisieren
    await sql`
      UPDATE tbluser
      SET role = ${role}
      WHERE id = ${user.id}
    `;
    
    console.log(`✅ Rolle für Benutzer ${user.username} wurde aktualisiert:`);
    console.log(`Name: ${user.user_name}`);
    console.log(`E-Mail: ${user.user_email}`);
    console.log(`Alte Rolle: ${user.role}`);
    console.log(`Neue Rolle: ${role}`);
    
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Benutzerrolle:', error);
    process.exit(1);
  }
}

// Skript ausführen
updateUserRole().catch(console.error).finally(() => {
  // Verbindung beenden
  process.exit(0);
});