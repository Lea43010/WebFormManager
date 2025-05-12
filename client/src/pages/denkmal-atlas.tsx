import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

/**
 * DenkmalAtlasStaticRedirect: Diese statische Komponente enthält keinen Code,
 * der Fehler verursachen könnte, und dient nur als direkter Wegweiser.
 * 
 * Anstatt automatisch weiterzuleiten, fordert sie den Benutzer auf, 
 * auf einen Link zu klicken oder zurückzugehen.
 */
export default function DenkmalAtlasPage() {
  // Direkt beim Laden der Seite den externen Link öffnen
  useEffect(() => {
    window.open("https://geoportal.bayern.de/denkmalatlas/", "_blank");
  }, []);

  // Einfache statische Seite ohne komplexe Hooks oder Weiterleitung
  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col items-center justify-center h-[60vh] bg-white p-8 rounded-lg shadow-sm">
        <h1 className="text-2xl font-semibold mb-6">Denkmal-Atlas Bayern</h1>
        
        <p className="mb-8 text-center">
          Der Denkmal-Atlas wurde in einem neuen Tab geöffnet. 
          Falls der neue Tab nicht geöffnet wurde, klicken Sie bitte auf den untenstehenden Button.
        </p>

        <div className="flex flex-col space-y-4 w-full max-w-xs">
          <Button 
            className="w-full bg-[#76a730] hover:bg-[#658f28]"
            onClick={() => window.open("https://geoportal.bayern.de/denkmalatlas/", "_blank")}
          >
            Denkmal-Atlas öffnen
          </Button>
          
          <Link href="/tiefbau-map">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück zur Tiefbau-Karte
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}