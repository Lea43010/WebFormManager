/**
 * Hook für einfache Navigation
 * 
 * Dieser Hook bietet eine vereinfachte Schnittstelle für die Navigation im Stil von
 * React Router für Wouter. Dies kann die Migration zwischen verschiedenen
 * Routing-Bibliotheken erleichtern und den Code konsistenter machen.
 */

import { useLocation } from 'wouter';

/**
 * Hook, der eine Navigationsfunktion zurückgibt, ähnlich zu React Router's useNavigate.
 * 
 * @returns Navigationsfunktion, die einen Pfad entgegennimmt
 * 
 * @example
 * // In einer Komponente
 * const navigate = useNavigate();
 * 
 * // Später in einem Event-Handler
 * const handleClick = () => {
 *   navigate('/dashboard');
 * };
 */
export function useNavigate() {
  const [_, navigate] = useLocation();
  return navigate;
}

/**
 * Hook, der erweiterte Navigationsfunktionen bietet.
 * 
 * @returns Objekt mit Navigationsfunktionen
 * 
 * @example
 * // In einer Komponente
 * const { navigate, goBack, goHome, refresh } = useNavigation();
 * 
 * // Später in Event-Handlern
 * const handleSave = () => {
 *   // Nach dem Speichern zurück zur vorherigen Seite
 *   goBack();
 * };
 * 
 * const handleCancel = () => {
 *   // Bei Abbruch zur Startseite
 *   goHome();
 * };
 */
export function useNavigation() {
  const navigate = useNavigate();
  
  return {
    /**
     * Zur angegebenen Pfad navigieren
     * @param path Ziel-Pfad
     */
    navigate,
    
    /**
     * Zur vorherigen Seite im Browser-Verlauf zurückgehen
     */
    goBack: () => window.history.back(),
    
    /**
     * Zur Startseite navigieren
     */
    goHome: () => navigate('/'),
    
    /**
     * Aktuelle Seite neu laden
     */
    refresh: () => window.location.reload(),
    
    /**
     * Externe URL öffnen (in neuem Tab oder aktuellem Fenster)
     * @param url Ziel-URL
     * @param newTab Wenn true, wird die URL in einem neuen Tab geöffnet
     */
    openExternal: (url: string, newTab: boolean = true) => {
      if (newTab) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = url;
      }
    }
  };
}