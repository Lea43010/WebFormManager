import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  ShieldCheck, 
  LockKeyhole, 
  FileText, 
  Users, 
  Cookie, 
  Globe, 
  Database,
  KeyRound,
  Search,
  Trash2,
  Download,
  Shield,
  Smartphone,
  UserCheck 
} from 'lucide-react';

/**
 * Komponente für die Darstellung der Sicherheits- und Datenschutzinformationen
 */
export function SecurityInfoPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-[#F8F9FA] border-b">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-[#76a730] h-6 w-6" />
            <CardTitle>Datenschutz und Sicherheit</CardTitle>
          </div>
          <CardDescription>
            Informationen zu den implementierten Sicherheitsmaßnahmen und zum Datenschutz
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="mb-4">
            Die Bau-Structura App setzt modernste Sicherheitsstandards ein, um Ihre Daten zu schützen 
            und die DSGVO-Konformität (Datenschutz-Grundverordnung der EU) sicherzustellen. Auf dieser 
            Seite erfahren Sie mehr über die implementierten Sicherheitsmaßnahmen.
          </p>
          
          <Accordion type="single" collapsible className="w-full">
            {/* SSL/TLS-Verschlüsselung */}
            <AccordionItem value="ssl">
              <AccordionTrigger className="py-4">
                <div className="flex items-center gap-2">
                  <Globe className="text-[#76a730] h-5 w-5 shrink-0" />
                  <span>SSL/TLS-Verschlüsselung</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 px-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Sichere Datenübertragung</h4>
                  <p>
                    Alle Daten, die zwischen Ihrem Browser und unseren Servern übertragen werden, 
                    sind durch moderne TLS-Verschlüsselung (Transport Layer Security) geschützt. 
                    Dies wird durch ein SSL-Zertifikat gewährleistet.
                  </p>
                  
                  <h4 className="font-medium mt-4">Implementierte Maßnahmen:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>TLS 1.2/1.3 mit sicheren Cipher-Suites</li>
                    <li>HSTS (HTTP Strict Transport Security) für verbesserten Schutz</li>
                    <li>Automatische Weiterleitung von HTTP zu HTTPS</li>
                    <li>Regelmäßige Überprüfung der SSL-Konfiguration</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            {/* Passwortschutz */}
            <AccordionItem value="passwords">
              <AccordionTrigger className="py-4">
                <div className="flex items-center gap-2">
                  <KeyRound className="text-[#76a730] h-5 w-5 shrink-0" />
                  <span>Passwortschutz</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 px-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Sichere Passwortspeicherung</h4>
                  <p>
                    Passwörter werden niemals im Klartext gespeichert. Stattdessen verwenden wir 
                    BCrypt, einen modernen kryptografischen Algorithmus, um Passwörter sicher zu hashen.
                  </p>
                  
                  <h4 className="font-medium mt-4">Implementierte Maßnahmen:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>BCrypt-Hashing mit Salting und hohem Kostenfaktor (12)</li>
                    <li>Automatische Ablehnung schwacher Passwörter</li>
                    <li>Passwort-Stärkevalidierung bei der Registrierung</li>
                    <li>Sichere Passwort-Zurücksetzungsmechanismen</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            {/* Datenverschlüsselung */}
            <AccordionItem value="encryption">
              <AccordionTrigger className="py-4">
                <div className="flex items-center gap-2">
                  <LockKeyhole className="text-[#76a730] h-5 w-5 shrink-0" />
                  <span>Datenverschlüsselung</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 px-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Verschlüsselung sensibler Daten</h4>
                  <p>
                    Sensible Daten werden in der Datenbank mittels AES-256-GCM, einem modernen 
                    und sicheren Verschlüsselungsalgorithmus, verschlüsselt. Dieser Algorithmus 
                    bietet nicht nur Vertraulichkeit, sondern auch Authentizität und Integrität.
                  </p>
                  
                  <h4 className="font-medium mt-4">Implementierte Maßnahmen:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>AES-256-GCM-Verschlüsselung für sensible Daten</li>
                    <li>Sichere Schlüsselverwaltung mit regelmäßiger Schlüsselrotation</li>
                    <li>Separate Speicherung von Verschlüsselungsparametern</li>
                    <li>Automatische Entschlüsselung nur bei berechtigtem Zugriff</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            {/* Brute-Force-Schutz */}
            <AccordionItem value="rate-limiting">
              <AccordionTrigger className="py-4">
                <div className="flex items-center gap-2">
                  <Shield className="text-[#76a730] h-5 w-5 shrink-0" />
                  <span>Brute-Force-Schutz</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 px-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Schutz vor Brute-Force-Angriffen</h4>
                  <p>
                    Wir implementieren fortschrittliche Rate-Limiting-Mechanismen, um Brute-Force-Angriffe 
                    zu verhindern. Bei zu vielen fehlgeschlagenen Versuchen wird der Zugriff vorübergehend 
                    gesperrt, um die Sicherheit Ihres Kontos zu gewährleisten.
                  </p>
                  
                  <h4 className="font-medium mt-4">Implementierte Maßnahmen:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Zeitlich begrenzte Sperrung nach fehlgeschlagenen Login-Versuchen</li>
                    <li>IP-basierte und kontobezogene Ratenbegrenzung</li>
                    <li>Automatische Protokollierung verdächtiger Aktivitäten</li>
                    <li>Progressive Erhöhung der Wartezeit bei wiederholten Fehlversuchen</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            {/* 2-Faktor-Authentifizierung */}
            <AccordionItem value="2fa">
              <AccordionTrigger className="py-4">
                <div className="flex items-center gap-2">
                  <Smartphone className="text-[#76a730] h-5 w-5 shrink-0" />
                  <span>2-Faktor-Authentifizierung (2FA)</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 px-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Zusätzliche Sicherheitsebene</h4>
                  <p>
                    Für besonders sensible Konten bieten wir die Möglichkeit, eine 2-Faktor-Authentifizierung 
                    zu aktivieren. Diese erhöht die Sicherheit Ihres Kontos erheblich, indem sie neben dem Passwort 
                    eine zweite Bestätigung erfordert.
                  </p>
                  
                  <h4 className="font-medium mt-4">Implementierte Maßnahmen:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>TOTP-basierte Authentifizierung (Time-based One-Time Password)</li>
                    <li>Kompatibel mit Standard-Authenticator-Apps (Google Authenticator, Microsoft Authenticator, etc.)</li>
                    <li>Backup-Codes für Notfallzugriff, falls das Authentifizierungsgerät verloren geht</li>
                    <li>Sichere QR-Code-Übermittlung bei der Einrichtung</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            {/* API-Sicherheit */}
            <AccordionItem value="api-security">
              <AccordionTrigger className="py-4">
                <div className="flex items-center gap-2">
                  <UserCheck className="text-[#76a730] h-5 w-5 shrink-0" />
                  <span>API-Sicherheit und Token-Management</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 px-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Sichere API-Zugriffe</h4>
                  <p>
                    Für die Kommunikation zwischen Client und Server verwenden wir JWT (JSON Web Tokens), 
                    die eine sichere Authentifizierung ohne ständige Passworteingabe ermöglichen. Diese 
                    Tokens sind kurzlebig und können bei Bedarf widerrufen werden.
                  </p>
                  
                  <h4 className="font-medium mt-4">Implementierte Maßnahmen:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>JWT mit kurzer Gültigkeitsdauer und automatischer Erneuerung</li>
                    <li>Token-Blacklisting für sofortige Widerrufbarkeit</li>
                    <li>Sichere Übertragung von Tokens über HTTPS</li>
                    <li>Detaillierte Berechtigungsprüfung bei API-Zugriffen</li>
                    <li>Keine Speicherung sensibler Daten in Tokens</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            {/* DSGVO-Konformität */}
            <AccordionItem value="gdpr">
              <AccordionTrigger className="py-4">
                <div className="flex items-center gap-2">
                  <FileText className="text-[#76a730] h-5 w-5 shrink-0" />
                  <span>DSGVO-Konformität</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 px-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Einhaltung der Datenschutz-Grundverordnung</h4>
                  <p>
                    Die Bau-Structura App ist vollständig konform mit der Datenschutz-Grundverordnung (DSGVO) 
                    der Europäischen Union. Wir respektieren Ihre Datenschutzrechte und geben Ihnen volle 
                    Kontrolle über Ihre personenbezogenen Daten.
                  </p>
                  
                  <h4 className="font-medium mt-4">Implementierte Maßnahmen:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Transparente Datenschutzerklärung</li>
                    <li>Ausdrückliche Einwilligung zur Datenverarbeitung</li>
                    <li>Möglichkeit zur Einsicht, Korrektur und Löschung Ihrer Daten</li>
                    <li>Implementierung des "Rechts auf Vergessenwerden"</li>
                    <li>Datenschutz durch Technikgestaltung und datenschutzfreundliche Voreinstellungen</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            {/* Cookie-Management */}
            <AccordionItem value="cookies">
              <AccordionTrigger className="py-4">
                <div className="flex items-center gap-2">
                  <Cookie className="text-[#76a730] h-5 w-5 shrink-0" />
                  <span>Cookie-Management</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 px-4">
                <div className="space-y-3">
                  <h4 className="font-medium">DSGVO-konforme Cookie-Verwaltung</h4>
                  <p>
                    Wir verwenden ein transparentes Cookie-Management-System, das Ihnen die 
                    volle Kontrolle über die verwendeten Cookies gibt. Nur technisch notwendige 
                    Cookies werden ohne Ihre Zustimmung gesetzt.
                  </p>
                  
                  <h4 className="font-medium mt-4">Cookie-Kategorien:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong>Essenziell:</strong> Notwendig für die Grundfunktionen der Website (immer aktiv)</li>
                    <li><strong>Funktionell:</strong> Ermöglichen erweiterte Funktionen wie Spracheinstellungen</li>
                    <li><strong>Analytisch:</strong> Helfen uns, die Nutzung der Website zu verstehen</li>
                    <li><strong>Marketing:</strong> Werden für Werbezwecke verwendet (nur mit expliziter Zustimmung)</li>
                  </ul>
                  
                  <button className="mt-2 px-3 py-1.5 bg-[#76a730] text-white text-sm rounded hover:bg-[#658f28]">
                    Cookie-Einstellungen anpassen
                  </button>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            {/* Benutzerrechte */}
            <AccordionItem value="rights">
              <AccordionTrigger className="py-4">
                <div className="flex items-center gap-2">
                  <Users className="text-[#76a730] h-5 w-5 shrink-0" />
                  <span>Ihre Rechte als Benutzer</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 px-4">
                <div className="space-y-3">
                  <h4 className="font-medium">DSGVO-Betroffenenrechte</h4>
                  <p>
                    Als Benutzer der Bau-Structura App haben Sie umfassende Rechte bezüglich 
                    Ihrer personenbezogenen Daten. Wir stellen Werkzeuge bereit, um diese 
                    Rechte einfach und effektiv wahrzunehmen.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="bg-gray-50 p-3 rounded-md flex flex-col items-center text-center">
                      <Search className="text-[#76a730] h-8 w-8 mb-2" />
                      <h5 className="font-medium mb-1">Auskunftsrecht</h5>
                      <p className="text-xs text-gray-600">Einsicht in alle Ihre gespeicherten Daten</p>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-md flex flex-col items-center text-center">
                      <Trash2 className="text-[#76a730] h-8 w-8 mb-2" />
                      <h5 className="font-medium mb-1">Recht auf Löschung</h5>
                      <p className="text-xs text-gray-600">Löschung Ihrer persönlichen Daten</p>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-md flex flex-col items-center text-center">
                      <Download className="text-[#76a730] h-8 w-8 mb-2" />
                      <h5 className="font-medium mb-1">Datenportabilität</h5>
                      <p className="text-xs text-gray-600">Export Ihrer Daten in einem maschinenlesbaren Format</p>
                    </div>
                  </div>
                  
                  <p className="text-sm mt-4">
                    Um eines dieser Rechte auszuüben, kontaktieren Sie uns bitte über das 
                    Profil-Menü unter "Datenschutzeinstellungen" oder schreiben Sie an 
                    datenschutz@bau-structura.de.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            {/* Datenspeicherung */}
            <AccordionItem value="storage">
              <AccordionTrigger className="py-4">
                <div className="flex items-center gap-2">
                  <Database className="text-[#76a730] h-5 w-5 shrink-0" />
                  <span>Datenspeicherung</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 px-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Sichere Datenspeicherung</h4>
                  <p>
                    Ihre Daten werden auf sicheren Servern in der Europäischen Union gespeichert, 
                    die den strengen DSGVO-Anforderungen entsprechen. Wir verwenden moderne 
                    Datenbanktechnologien mit mehrschichtigen Sicherheitsmaßnahmen.
                  </p>
                  
                  <h4 className="font-medium mt-4">Implementierte Maßnahmen:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Regelmäßige Backups zur Verhinderung von Datenverlust</li>
                    <li>Zugriffskontrollen und Berechtigungssystem</li>
                    <li>Datenbankverschlüsselung für sensible Informationen</li>
                    <li>Physische Sicherheitsmaßnahmen in den Rechenzentren</li>
                    <li>Automatische Löschung nicht mehr benötigter Daten</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="bg-[#F8F9FA] border-b">
          <div className="flex items-center gap-2">
            <FileText className="text-[#76a730] h-6 w-6" />
            <CardTitle>Zertifizierung und Compliance</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-green-100 p-2 rounded-md">
                <ShieldCheck className="text-green-600 h-5 w-5" />
              </div>
              <div>
                <h4 className="font-medium mb-1">DSGVO-Konformität</h4>
                <p className="text-sm text-gray-600">
                  Die Bau-Structura App erfüllt vollständig die Anforderungen der Datenschutz-Grundverordnung (DSGVO) 
                  der Europäischen Union.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-md">
                <LockKeyhole className="text-blue-600 h-5 w-5" />
              </div>
              <div>
                <h4 className="font-medium mb-1">SSL/TLS Verschlüsselung</h4>
                <p className="text-sm text-gray-600">
                  Alle Datenübertragungen sind durch moderne TLS-Verschlüsselung geschützt, die regelmäßig 
                  auf dem neuesten Stand der Technik gehalten wird.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-purple-100 p-2 rounded-md">
                <Database className="text-purple-600 h-5 w-5" />
              </div>
              <div>
                <h4 className="font-medium mb-1">Datenresidenz in der EU</h4>
                <p className="text-sm text-gray-600">
                  Sämtliche Daten werden ausschließlich auf Servern innerhalb der Europäischen Union gespeichert 
                  und verarbeitet.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-orange-100 p-2 rounded-md">
                <Shield className="text-orange-600 h-5 w-5" />
              </div>
              <div>
                <h4 className="font-medium mb-1">Brute-Force-Schutz</h4>
                <p className="text-sm text-gray-600">
                  Fortschrittliche Rate-Limiting-Mechanismen schützen Ihr Konto vor unbefugten Zugriffsversuchen
                  und blockieren verdächtige Aktivitäten automatisch.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-teal-100 p-2 rounded-md">
                <Smartphone className="text-teal-600 h-5 w-5" />
              </div>
              <div>
                <h4 className="font-medium mb-1">2-Faktor-Authentifizierung</h4>
                <p className="text-sm text-gray-600">
                  Optionale Zwei-Faktor-Authentifizierung erhöht die Sicherheit Ihres Kontos durch eine 
                  zweite Verifizierungsebene neben dem Passwort.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}