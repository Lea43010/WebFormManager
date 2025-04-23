import { useEffect, useState } from 'react';

/**
 * Hook für responsive Designerkennung
 * Gibt zurück, ob das aktuelle Gerät ein mobiles Gerät ist (basierend auf Bildschirmbreite)
 * 
 * @returns {boolean} True, wenn die Bildschirmbreite weniger als 768px beträgt (mobiles Gerät)
 */
export function useMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    // Initialen Zustand prüfen
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initiale Prüfung
    checkIsMobile();
    
    // Event-Listener für Größenänderungen hinzufügen
    window.addEventListener('resize', checkIsMobile);
    
    // Bereinigung
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  return isMobile;
}

/**
 * Hook für erweiterte Responsive-Design-Erkennung
 * Gibt den aktuellen Bildschirmtyp basierend auf der Bildschirmbreite zurück
 * 
 * @returns {'mobile' | 'tablet' | 'desktop'} Den Typ des aktuellen Bildschirms
 */
export function useScreenSize(): 'mobile' | 'tablet' | 'desktop' {
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    // Bildschirmgröße prüfen und entsprechenden Wert setzen
    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setScreenSize('mobile');
      } else if (width < 1024) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };
    
    // Initiale Prüfung
    checkScreenSize();
    
    // Event-Listener für Größenänderungen hinzufügen
    window.addEventListener('resize', checkScreenSize);
    
    // Bereinigung
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  return screenSize;
}

/**
 * Hook für benutzerdefinierte Breakpoints
 * Gibt zurück, ob die aktuelle Bildschirmbreite unter dem angegebenen Breakpoint liegt
 * 
 * @param {number} breakpoint Der Breakpoint in Pixeln
 * @returns {boolean} True, wenn die Bildschirmbreite kleiner als der Breakpoint ist
 */
export function useBreakpoint(breakpoint: number): boolean {
  const [isBelow, setIsBelow] = useState<boolean>(false);

  useEffect(() => {
    // Prüfen, ob die Bildschirmbreite unter dem Breakpoint liegt
    const checkBreakpoint = () => {
      setIsBelow(window.innerWidth < breakpoint);
    };
    
    // Initiale Prüfung
    checkBreakpoint();
    
    // Event-Listener für Größenänderungen hinzufügen
    window.addEventListener('resize', checkBreakpoint);
    
    // Bereinigung
    return () => {
      window.removeEventListener('resize', checkBreakpoint);
    };
  }, [breakpoint]);

  return isBelow;
}

export default useMobile;