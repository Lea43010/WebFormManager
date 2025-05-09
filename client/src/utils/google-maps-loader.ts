/**
 * Zentraler Google Maps API Loader für die gesamte Anwendung
 * Vermeidet mehrfaches Laden der Google Maps API
 */

declare global {
  interface Window {
    google?: any;
    [key: string]: any; // Erlaubt dynamische Properties für Callback-Funktionen
  }
}

interface GoogleMapsLoaderOptions {
  apiKey: string;
  libraries?: string[];
  callback?: () => void;
}

// Globale Variable zur Verfolgung, ob die API bereits geladen wird oder geladen wurde
let isLoading = false;
let isLoaded = false;

// Globale Warteschlange von Callbacks, die aufgerufen werden, wenn die API geladen ist
const callbackQueue: Array<() => void> = [];

/**
 * Lädt die Google Maps API mit den angegebenen Optionen
 * Stellt sicher, dass die API nur einmal geladen wird, auch wenn die Funktion mehrmals aufgerufen wird
 */
export function loadGoogleMapsApi({
  apiKey,
  libraries = ['places', 'geometry'],
  callback
}: GoogleMapsLoaderOptions): Promise<void> {
  // Callback zur Warteschlange hinzufügen, wenn vorhanden
  if (callback) {
    callbackQueue.push(callback);
  }
  
  // Wenn die API bereits geladen ist, sofort auflösen
  if (isLoaded && window.google && window.google.maps) {
    console.log('Google Maps API bereits geladen, Callbacks ausführen');
    setTimeout(() => {
      callbackQueue.forEach(cb => cb());
      callbackQueue.length = 0;
    }, 0);
    return Promise.resolve();
  }
  
  // Wenn die API gerade geladen wird, warte auf ihre Fertigstellung
  if (isLoading) {
    console.log('Google Maps API wird bereits geladen');
    return new Promise((resolve) => {
      callbackQueue.push(() => resolve());
    });
  }
  
  // Markiere als lade
  isLoading = true;
  
  return new Promise((resolve, reject) => {
    console.log('Starte Laden der Google Maps API');
    
    // Globale Callback-Funktion, die vom Google Maps API Script aufgerufen wird
    const callbackName = `gmapsCallback_${Math.random().toString(36).substring(2, 9)}`;
    
    // Callback-Funktion im globalen Bereich definieren
    window[callbackName] = function() {
      console.log('Google Maps API erfolgreich geladen');
      isLoaded = true;
      isLoading = false;
      
      // Alle Callbacks in der Warteschlange ausführen
      callbackQueue.forEach(cb => cb());
      callbackQueue.length = 0;
      
      // Callback-Funktion aufräumen
      delete window[callbackName];
      
      resolve();
    };
    
    // Script-Element erstellen
    const script = document.createElement('script');
    const librariesParam = libraries.join(',');
    
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${librariesParam}&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    
    // Fehlerbehandlung
    script.onerror = () => {
      console.error('Fehler beim Laden der Google Maps API');
      isLoading = false;
      
      // Callback-Funktion aufräumen
      delete window[callbackName];
      
      reject(new Error('Google Maps konnte nicht geladen werden'));
    };
    
    // Script an die Seite anhängen
    document.head.appendChild(script);
  });
}

/**
 * Überprüft, ob die Google Maps API bereits geladen ist
 */
export function isGoogleMapsLoaded(): boolean {
  return isLoaded && !!window.google?.maps;
}