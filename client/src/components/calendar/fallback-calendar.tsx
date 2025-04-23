import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FallbackCalendar({ projectId = 0 }) {
  const currentYear = new Date().getFullYear();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Kalenderwochen-Planer (Fallback)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center">
            <h3>Kalenderwochenübersicht {currentYear}</h3>
            <p className="text-sm text-muted-foreground">Projekt ID: {projectId}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 border rounded-md">
              <h4>Quartal 1</h4>
              <p className="text-sm">KW 1-13</p>
            </div>
            <div className="p-3 border rounded-md">
              <h4>Quartal 2</h4>
              <p className="text-sm">KW 14-26</p>
            </div>
            <div className="p-3 border rounded-md">
              <h4>Quartal 3</h4>
              <p className="text-sm">KW 27-39</p>
            </div>
            <div className="p-3 border rounded-md">
              <h4>Quartal 4</h4>
              <p className="text-sm">KW 40-52/53</p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-center text-yellow-800">
              Temporäre Ansicht während der Wartung des Kalender-Moduls
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}