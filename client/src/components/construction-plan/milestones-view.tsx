import { Project } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  CircleAlert,
  CircleDashed 
} from "lucide-react";

interface MilestonesViewProps {
  project: Project | null;
  date: Date | undefined;
  viewMode: "day" | "week" | "month" | "year";
}

// Dummy-Daten für Meilensteine
const milestones = [
  {
    id: 1,
    name: "Montagearbeiten NE3 Start",
    date: "01.09.2025",
    status: "planned",
    type: "FÖB",
    description: "Beginn der Endmontage der Netzebene 3",
    responsibleTeam: "Team D",
    dependencies: ["Abschluss NVT Montage"],
  },
  {
    id: 2,
    name: "Tiefbau HAS Abschluss",
    date: "15.07.2025",
    status: "planned",
    type: "FÖB",
    description: "Fertigstellung aller Hausanschluss-Tiefbauarbeiten",
    responsibleTeam: "Team B",
    dependencies: ["Abschluss Erdarbeiten"],
  },
  {
    id: 3,
    name: "NVT Montage Beginn",
    date: "16.07.2025",
    status: "planned",
    type: "EWB",
    description: "Start der Installation von Netzverteilern",
    responsibleTeam: "Team C",
    dependencies: ["Tiefbau HAS Abschluss"],
  },
  {
    id: 4,
    name: "Erdarbeiten Start",
    date: "01.05.2025",
    status: "in-progress",
    type: "FÖB",
    description: "Beginn der grundlegenden Tiefbauarbeiten",
    responsibleTeam: "Team A",
    dependencies: [],
  },
  {
    id: 5,
    name: "Projektabschluss",
    date: "30.09.2025",
    status: "planned",
    type: "EWB",
    description: "Fertigstellung aller Projektarbeiten",
    responsibleTeam: "Alle",
    dependencies: ["Montagearbeiten NE3 Abschluss"],
  },
];

export default function MilestonesView({
  project,
  date,
  viewMode,
}: MilestonesViewProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "in-progress":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "delayed":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "at-risk":
        return <CircleAlert className="h-5 w-5 text-amber-500" />;
      case "planned":
      default:
        return <CircleDashed className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTypeBadge = (type: string) => {
    return <Badge variant={type === "FÖB" ? "outline" : "secondary"}>{type}</Badge>;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Meilensteine</CardTitle>
        <CardDescription>
          Wichtige Etappen und Ereignisse im Projektverlauf
        </CardDescription>
      </CardHeader>
      <CardContent>
        {project ? (
          <div className="relative space-y-4">
            {/* Zeitlinie */}
            <div className="absolute top-0 bottom-0 left-[15px] w-[2px] bg-muted z-0"></div>

            {/* Meilensteine */}
            {milestones
              .sort((a, b) => {
                // Sortiere nach Datum
                return new Date(a.date.split('.').reverse().join('-')).getTime() - 
                       new Date(b.date.split('.').reverse().join('-')).getTime();
              })
              .map((milestone, index) => (
                <div key={milestone.id} className="relative pl-8 pb-6 z-10">
                  <div className="absolute left-0 top-0 bg-background border rounded-full p-1">
                    {getStatusIcon(milestone.status)}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-medium">{milestone.name}</h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">{milestone.date}</span>
                        {getTypeBadge(milestone.type)}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {milestone.description}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Verantwortlich:</span>{" "}
                        {milestone.responsibleTeam}
                      </div>
                      {milestone.dependencies.length > 0 && (
                        <div>
                          <span className="text-muted-foreground">Abhängigkeiten:</span>{" "}
                          {milestone.dependencies.join(", ")}
                        </div>
                      )}
                    </div>
                  </div>
                  {index < milestones.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
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