/**
 * Cookie-Manager für DSGVO-konforme Cookie-Verwaltung
 * 
 * Dieser Dienst stellt Funktionen zur Verfügung, um Cookies DSGVO-konform zu verwalten,
 * einschließlich Einwilligungsverwaltung, Cookie-Kategorien und Lebensdauer.
 */

import { Request, Response, NextFunction } from 'express';

// Cookie-Kategorien gemäß DSGVO
export enum CookieCategory {
  ESSENTIAL = 'essential',    // Notwendige Cookies (immer erlaubt)
  FUNCTIONAL = 'functional',  // Funktionelle Cookies (z.B. Spracheinstellungen)
  ANALYTICS = 'analytics',    // Analytische Cookies (z.B. Google Analytics)
  MARKETING = 'marketing'     // Marketing-Cookies (z.B. Werbung)
}

// Cookie-Einstellungen
interface CookieSettings {
  name: string;
  category: CookieCategory;
  maxAge: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
}

// Einwilligungsstatus des Benutzers
interface ConsentStatus {
  essential: boolean;   // Immer true
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  lastUpdated: Date;
}

// Name des Einwilligungs-Cookies
const CONSENT_COOKIE_NAME = 'bau_structura_cookie_consent';

// Standard-Cookie-Einstellungen
const defaultSettings: Record<CookieCategory, Partial<CookieSettings>> = {
  [CookieCategory.ESSENTIAL]: {
    maxAge: 365 * 24 * 60 * 60 * 1000, // 1 Jahr
    httpOnly: true,
    secure: true,
    sameSite: 'strict'
  },
  [CookieCategory.FUNCTIONAL]: {
    maxAge: 180 * 24 * 60 * 60 * 1000, // 180 Tage
    httpOnly: true,
    secure: true,
    sameSite: 'lax'
  },
  [CookieCategory.ANALYTICS]: {
    maxAge: 30 * 24 * 60 * 60 * 1000,  // 30 Tage
    httpOnly: false,
    secure: true,
    sameSite: 'lax'
  },
  [CookieCategory.MARKETING]: {
    maxAge: 30 * 24 * 60 * 60 * 1000,  // 30 Tage
    httpOnly: false,
    secure: true,
    sameSite: 'lax'
  }
};

/**
 * Middleware zur Überprüfung des Cookie-Einwilligungsstatus
 * Diese Middleware sollte für alle Routen verwendet werden, die nicht-essenzielle Cookies setzen
 */
export function checkCookieConsent(category: CookieCategory) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Essenzielle Cookies sind immer erlaubt
    if (category === CookieCategory.ESSENTIAL) {
      return next();
    }
    
    // Einwilligungsstatus abrufen
    const consentCookie = req.cookies[CONSENT_COOKIE_NAME];
    if (!consentCookie) {
      // Keine Einwilligung vorhanden, nur essenzielle Cookies erlauben
      if (category !== CookieCategory.ESSENTIAL) {
        return res.status(403).json({ 
          message: 'Für diese Funktion ist eine Cookie-Einwilligung erforderlich',
          requiredCategory: category
        });
      }
    }
    
    try {
      // Einwilligungsstatus parsen
      const consent: ConsentStatus = JSON.parse(consentCookie);
      
      // Prüfen, ob die Kategorie erlaubt ist
      if (!consent[category]) {
        return res.status(403).json({ 
          message: 'Für diese Funktion ist eine Cookie-Einwilligung erforderlich',
          requiredCategory: category
        });
      }
      
      // Kategorie ist erlaubt
      next();
    } catch (error) {
      console.error('[Cookie-Manager] Fehler beim Parsen des Einwilligungsstatus:', error);
      // Im Fehlerfall nur essenzielle Cookies erlauben
      if (category !== CookieCategory.ESSENTIAL) {
        return res.status(403).json({ 
          message: 'Fehler bei der Cookie-Einwilligung. Bitte aktualisieren Sie Ihre Einstellungen.',
          requiredCategory: category
        });
      }
      next();
    }
  };
}

/**
 * Setzt ein Cookie mit den entsprechenden Einstellungen
 */
export function setCookie(
  res: Response, 
  name: string, 
  value: string, 
  category: CookieCategory,
  options: Partial<CookieSettings> = {}
) {
  // Standardeinstellungen für die Kategorie laden
  const categoryDefaults = defaultSettings[category];
  
  // Cookie-Einstellungen kombinieren
  const settings: CookieSettings = {
    name,
    category,
    ...categoryDefaults,
    ...options
  } as CookieSettings;
  
  // Cookie setzen
  res.cookie(name, value, {
    maxAge: settings.maxAge,
    httpOnly: settings.httpOnly,
    secure: settings.secure,
    sameSite: settings.sameSite
  });
}

/**
 * Aktualisiert den Einwilligungsstatus des Benutzers
 */
export function updateCookieConsent(
  res: Response, 
  consent: Partial<ConsentStatus>
) {
  // Vorhandenen Einwilligungsstatus mit neuen Werten aktualisieren
  const updatedConsent: ConsentStatus = {
    essential: true, // Immer erlaubt
    functional: consent.functional || false,
    analytics: consent.analytics || false,
    marketing: consent.marketing || false,
    lastUpdated: new Date()
  };
  
  // Einwilligungsstatus als Cookie speichern
  setCookie(
    res, 
    CONSENT_COOKIE_NAME, 
    JSON.stringify(updatedConsent), 
    CookieCategory.ESSENTIAL
  );
  
  return updatedConsent;
}

/**
 * Löscht alle Cookies in einer bestimmten Kategorie
 */
export function clearCookiesByCategory(
  req: Request, 
  res: Response, 
  category: CookieCategory
) {
  // Alle Cookies durchlaufen
  const cookies = req.cookies;
  Object.keys(cookies).forEach(cookieName => {
    // TODO: Hier müsste eine Zuordnung von Cookie-Namen zu Kategorien existieren
    // Für diesen Beispielcode löschen wir einfach alle nicht-essenziellen Cookies
    if (category !== CookieCategory.ESSENTIAL && cookieName !== CONSENT_COOKIE_NAME) {
      res.clearCookie(cookieName);
    }
  });
}

/**
 * Generiert HTML-Code für ein DSGVO-konformes Cookie-Banner
 */
export function generateCookieBannerHtml(consentStatus?: ConsentStatus): string {
  const consent: ConsentStatus = consentStatus || {
    essential: true,
    functional: false,
    analytics: false,
    marketing: false,
    lastUpdated: new Date()
  };
  
  return `
  <div id="cookie-banner" class="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-lg z-50">
    <div class="container mx-auto">
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between">
        <div class="mb-4 md:mb-0 md:mr-4">
          <h3 class="text-lg font-bold mb-2">Datenschutzeinstellungen</h3>
          <p class="text-sm">
            Diese Website verwendet Cookies, um Ihre Erfahrung zu verbessern. Bitte wählen Sie, 
            welche Cookie-Kategorien Sie akzeptieren möchten.
          </p>
        </div>
        <div class="flex flex-col space-y-2">
          <div class="flex items-center">
            <input type="checkbox" id="cookie-essential" checked disabled />
            <label for="cookie-essential" class="ml-2 text-sm">
              Essenzielle Cookies (erforderlich)
            </label>
          </div>
          <div class="flex items-center">
            <input type="checkbox" id="cookie-functional" ${consent.functional ? 'checked' : ''} />
            <label for="cookie-functional" class="ml-2 text-sm">
              Funktionelle Cookies (z.B. Spracheinstellungen)
            </label>
          </div>
          <div class="flex items-center">
            <input type="checkbox" id="cookie-analytics" ${consent.analytics ? 'checked' : ''} />
            <label for="cookie-analytics" class="ml-2 text-sm">
              Analytische Cookies (z.B. Nutzungsstatistiken)
            </label>
          </div>
          <div class="flex items-center">
            <input type="checkbox" id="cookie-marketing" ${consent.marketing ? 'checked' : ''} />
            <label for="cookie-marketing" class="ml-2 text-sm">
              Marketing-Cookies (z.B. personalisierte Werbung)
            </label>
          </div>
        </div>
        <div class="mt-4 md:mt-0 flex space-x-2">
          <button id="accept-all-cookies" class="px-4 py-2 bg-[#76a730] text-white rounded">
            Alle akzeptieren
          </button>
          <button id="save-cookie-preferences" class="px-4 py-2 bg-gray-200 rounded">
            Auswahl speichern
          </button>
          <button id="decline-all-cookies" class="px-4 py-2 bg-gray-300 rounded">
            Nur erforderliche
          </button>
        </div>
      </div>
      <div class="mt-2 text-xs text-gray-500">
        <a href="/datenschutz" class="underline">Datenschutzerklärung</a> |
        <a href="/impressum" class="underline">Impressum</a>
      </div>
    </div>
  </div>
  `;
}