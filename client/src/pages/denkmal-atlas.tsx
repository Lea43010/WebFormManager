import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

/**
 * DenkmalAtlasPage: Diese Seite leitet automatisch zum externen Denkmal-Atlas Bayern weiter.
 * 
 * Statt eine eigene Seite mit Buttons zu haben, wird der Benutzer direkt zur externen
 * Denkmal-Atlas-Seite weitergeleitet. Die Weiterleitung erfolgt automatisch beim Laden der Seite.
 */
export default function DenkmalAtlasPage() {
  const { toast } = useToast();
  const denkmalAtlasUrl = "https://geoportal.bayern.de/denkmalatlas/";

  useEffect(() => {
    // Zeige Toast-Nachricht vor der Weiterleitung
    toast({
      title: "Sie werden zum Denkmal-Atlas weitergeleitet",
      description: "Der externe Dienst wird in einem neuen Browserfenster geöffnet.",
    });

    // Öffne externen Link in einem neuen Tab/Fenster
    window.open(denkmalAtlasUrl, "_blank");
    
    // Gehe zurück zur vorherigen Seite
    setTimeout(() => {
      window.history.back();
    }, 500);
  }, [toast]);

  // Diese Seite wird eigentlich nie angezeigt (wegen der Weiterleitung)
  return null;
}