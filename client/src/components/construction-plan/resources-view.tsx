import { Project } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface ResourcesViewProps {
  project: Project | null;
  date: Date | undefined;
  viewMode: "day" | "week" | "month" | "year";
}

// Dummy-Daten für Teams und Ressourcen
const teams = [
  {
    id: 1,
    name: "Team A",
    type: "Tiefbau",
    size: 6,
    availability: "verfügbar",
    specialization: "Erdarbeiten",
    equipment: ["Bagger", "Radlader", "LKW"],
    currentProject: "Stadtzentrum Nord"
  },
  {
    id: 2,
    name: "Team B",
    type: "Tiefbau",
    size: 5,
    availability: "ausgelastet",
    specialization: "Hausanschlüsse",
    equipment: ["Minibagger", "Transporter"],
    currentProject: "Westend-Erweiterung"
  },
  {
    id: 3,
    name: "Team C",
    type: "Montage",
    size: 4,
    availability: "teilweise verfügbar",
    specialization: "Netzverteiler",
    equipment: ["Montagewagen", "Spezialwerkzeug"],
    currentProject: "Gewerbegebiet Süd"
  },
  {
    id: 4,
    name: "Team D",
    type: "Montage",
    size: 3,
    availability: "verfügbar",
    specialization: "Endmontage",
    equipment: ["Montagewagen", "Messgeräte"],
    currentProject: "-"
  },
];

// Verfügbarkeit pro Kalenderwoche
const weeklyAvailability = [
  { week: "KW 18", available: 2, total: 4 },
  { week: "KW 19", available: 1, total: 4 },
  { week: "KW 20", available: 3, total: 4 },
  { week: "KW 21", available: 2, total: 4 },
  { week: "KW 22", available: 4, total: 4 },
];

export default function ResourcesView({
  project,
  date,
  viewMode,
}: ResourcesViewProps) {
  const getAvailabilityBadge = (status: string) => {
    switch (status) {
      case "verfügbar":
        return <Badge className="bg-green-500">Verfügbar</Badge>;
      case "teilweise verfügbar":
        return <Badge className="bg-amber-500">Teilweise verfügbar</Badge>;
      case "ausgelastet":
        return <Badge className="bg-red-500">Ausgelastet</Badge>;
      default:
        return <Badge className="bg-gray-500">Unbekannt</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Teams</CardTitle>
              <CardDescription>Verfügbare Teams und Personal</CardDescription>
            </div>
            <div>
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Teams</SelectItem>
                  <SelectItem value="tiefbau">Tiefbau</SelectItem>
                  <SelectItem value="montage">Montage</SelectItem>
                  <SelectItem value="available">Nur verfügbare</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Größe</TableHead>
                <TableHead>Spezialisierung</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aktuelles Projekt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell className="font-medium">{team.name}</TableCell>
                  <TableCell>{team.type}</TableCell>
                  <TableCell>{team.size} Personen</TableCell>
                  <TableCell>{team.specialization}</TableCell>
                  <TableCell>{getAvailabilityBadge(team.availability)}</TableCell>
                  <TableCell>{team.currentProject}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ressourcenverfügbarkeit</CardTitle>
          <CardDescription>
            Verfügbarkeit der Teams pro Kalenderwoche
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {weeklyAvailability.map((week, idx) => (
              <Card key={idx} className="border">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-base">{week.week}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-2xl font-bold">
                    {week.available}/{week.total}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Teams verfügbar
                  </p>
                  <div 
                    className="w-full h-2 rounded-full mt-2 bg-gray-200"
                  >
                    <div 
                      className="h-2 rounded-full bg-primary" 
                      style={{ width: `${(week.available / week.total) * 100}%` }}
                    ></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}