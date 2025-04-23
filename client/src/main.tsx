import { createRoot } from "react-dom/client";
import "./index.css";

// Einfache Test-Komponente ohne externe Abhängigkeiten
const SimpleApp = () => (
  <div className="p-8 text-center">
    <h1 className="text-2xl font-bold mb-4">Bau-Structura App - Wartungsmodus</h1>
    <p className="mb-4">Diese vereinfachte Version wurde für die Fehlerbehebung erstellt.</p>
    <p>Bitte haben Sie etwas Geduld, während wir an der Anwendung arbeiten.</p>
  </div>
);

// Direktes Rendering der einfachen Komponente ohne Provider
createRoot(document.getElementById("root")!).render(
  <SimpleApp />
);
