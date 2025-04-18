import { Project } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface ConstructionPhaseViewProps {
  project: Project | null;
  date: Date | undefined;
  viewMode: "day" | "week" | "month" | "year";
}

// Dummy data für verschiedene Bauabschnitte
const constructionPhases = [
  {
    id: 1,
    name: "Tiefbau: Erdarbeiten",
    status: "in-progress",
    progress: 65,
    startDate: "01.05.2025",
    endDate: "15.06.2025",
    description: "Grundlegende Infrastrukturarbeiten und Erdaushub",
    team: "Team A",
    subcontractor: "Erdbau GmbH",
    kw: "KW 18-24",
  },
  {
    id: 2,
    name: "HAS Tiefbau (Hausanschluss)",
    status: "planned",
    progress: 0,
    startDate: "16.06.2025",
    endDate: "15.07.2025",
    description: "Spezifische Tiefbauarbeiten für Hausanschlüsse",
    team: "Team B",
    subcontractor: "Anschluss & Co. KG",
    kw: "KW 25-28",
  },
  {
    id: 3,
    name: "NVT Montage (Netzverteiler)",
    status: "planned",
    progress: 0,
    startDate: "16.07.2025",
    endDate: "31.08.2025",
    description: "Montagearbeiten für Netzverteiler",
    team: "Team C",
    subcontractor: "Elektro Montage GmbH",
    kw: "KW 29-35",
  },
  {
    id: 4,
    name: "Endmontage NE3",
    status: "planned",
    progress: 0,
    startDate: "01.09.2025",
    endDate: "30.09.2025",
    description: "Finale Montagearbeiten",
    team: "Team D",
    subcontractor: "Finalmontage KG",
    kw: "KW 36-39",
  },
];

export default function ConstructionPhaseView({
  project,
  date,
  viewMode,
}: ConstructionPhaseViewProps) {
  // Filter-Status für die verschiedenen Bauabschnitte
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Abgeschlossen</Badge>;
      case "in-progress":
        return <Badge className="bg-blue-500">In Bearbeitung</Badge>;
      case "planned":
        return <Badge className="bg-amber-500">Geplant</Badge>;
      case "delayed":
        return <Badge className="bg-red-500">Verzögert</Badge>;
      default:
        return <Badge className="bg-gray-500">Unbekannt</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Baumaßnahmen</CardTitle>
            <CardDescription>
              Übersicht der Bauabschnitte und Aktivitäten
            </CardDescription>
          </div>
          <div>
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Nach Status filtern</SelectLabel>
                  <SelectItem value="all">Alle Bauabschnitte</SelectItem>
                  <SelectItem value="in-progress">In Bearbeitung</SelectItem>
                  <SelectItem value="planned">Geplant</SelectItem>
                  <SelectItem value="completed">Abgeschlossen</SelectItem>
                  <SelectItem value="delayed">Verzögert</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {project ? (
          <div className="space-y-6">
            <div className="grid gap-4">
              {constructionPhases.map((phase) => (
                <div
                  key={phase.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-semibold">{phase.name}</h3>
                      {phase.kw && <span className="text-sm font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full inline-block mt-1">{phase.kw}</span>}
                    </div>
                    {getStatusBadge(phase.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {phase.description}
                  </p>
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Fortschritt</span>
                      <span>{phase.progress}%</span>
                    </div>
                    <Progress value={phase.progress} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Zeitraum</p>
                      <div className="flex items-center gap-2">
                        <p>
                          {phase.startDate} - {phase.endDate}
                        </p>
                        {phase.kw && (
                          <span className="text-xs font-medium bg-primary-50 text-primary-700 px-2 py-0.5 rounded-md">
                            {phase.kw}
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Team</p>
                      <p>{phase.team}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Subunternehmer</p>
                      <p>{phase.subcontractor}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Auftragstyp</p>
                      <p>
                        {phase.id < 3 ? "FÖB" : "EWB"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center p-8 text-muted-foreground">
            Bitte wählen Sie ein Projekt aus.
          </div>
        )}
      </CardContent>
    </Card>
  );
}