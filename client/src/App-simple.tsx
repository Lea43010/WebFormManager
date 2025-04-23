import { Toaster } from "@/components/ui/toaster";
import { Route, Switch } from "wouter";

// Eine sehr einfache Komponente
const SimplePage = () => (
  <div className="p-8 text-center">
    <h1 className="text-2xl font-bold mb-4">Bau-Structura App - Wartungsmodus</h1>
    <p className="mb-4">Diese vereinfachte Version wurde für Wartungszwecke erstellt.</p>
    <p>Bitte haben Sie etwas Geduld, während wir an der Anwendung arbeiten.</p>
  </div>
);

function Router() {
  return (
    <Switch>
      <Route path="/" component={SimplePage} />
      <Route path="/:rest*" component={SimplePage} />
    </Switch>
  );
}

function App() {
  return (
    <>
      <Router />
      <Toaster />
    </>
  );
}

export default App;