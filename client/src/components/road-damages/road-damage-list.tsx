import { useState } from "react";
import {
  BarChart3,
  FileText,
  FilterX,
  ImageIcon,
  Loader2,
  Search,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useRoadDamages } from "@/hooks/use-road-damages";
import { 
  RoadDamage, 
  RoadDamageType, 
  DamageSeverity 
} from "../../../shared/schema-road-damage";

const damageSeverityLabels = {
  leicht: "Leicht",
  mittel: "Mittel",
  schwer: "Schwer",
  kritisch: "Kritisch",
};

const damageSeverityColors = {
  leicht: "bg-green-100 text-green-800 border-green-200",
  mittel: "bg-yellow-100 text-yellow-800 border-yellow-200",
  schwer: "bg-orange-100 text-orange-800 border-orange-200",
  kritisch: "bg-red-100 text-red-800 border-red-200",
};

const damageTypeLabels = {
  riss: "Riss",
  schlagloch: "Schlagloch",
  netzriss: "Netzriss",
  verformung: "Verformung",
  ausbruch: "Ausbruch",
  abplatzung: "Abplatzung",
  kantenschaden: "Kantenschaden",
  fugenausbruch: "Fugenausbruch",
  abnutzung: "Abnutzung",
  sonstiges: "Sonstiges",
};

interface RoadDamageListProps {
  projectId: number;
}

export function RoadDamageList({ projectId }: RoadDamageListProps) {
  const [selectedDamage, setSelectedDamage] = useState<RoadDamage | null>(null);
  const [filterType, setFilterType] = useState<RoadDamageType | "">("");
  const [filterSeverity, setFilterSeverity] = useState<DamageSeverity | "">("");
  const [searchQuery, setSearchQuery] = useState("");
  
  const { 
    roadDamages, 
    roadDamageStats,
    isLoading, 
    deleteRoadDamageMutation 
  } = useRoadDamages(projectId);
  
  const { toast } = useToast();
  
  const handleDelete = async (id: number) => {
    try {
      await deleteRoadDamageMutation.mutateAsync(id);
      toast({
        title: "Straßenschaden gelöscht",
        description: "Der Straßenschaden wurde erfolgreich gelöscht.",
      });
    } catch (error) {
      console.error("Fehler beim Löschen:", error);
      toast({
        title: "Fehler beim Löschen",
        description: "Der Straßenschaden konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    }
  };
  
  const filteredDamages = roadDamages?.filter((damage) => {
    // Typ-Filter
    if (filterType && damage.damageType !== filterType) {
      return false;
    }
    
    // Schweregrad-Filter
    if (filterSeverity && damage.severity !== filterSeverity) {
      return false;
    }
    
    // Suche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        damage.description?.toLowerCase().includes(query) ||
        damage.position?.toLowerCase().includes(query) ||
        damage.recommendedAction?.toLowerCase().includes(query)
      );
    }
    
    return true;
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {roadDamageStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold">
                {roadDamageStats.totalDamages}
              </CardTitle>
              <CardDescription>Erfasste Schäden</CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold">
                {roadDamageStats.byType.schlagloch + roadDamageStats.byType.ausbruch}
              </CardTitle>
              <CardDescription>Schlaglöcher & Ausbrüche</CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold">
                {roadDamageStats.bySeverity.kritisch}
              </CardTitle>
              <CardDescription>Kritische Schäden</CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold">
                {roadDamageStats.totalEstimatedCost > 0
                  ? `${roadDamageStats.totalEstimatedCost.toLocaleString()} €`
                  : "---"}
              </CardTitle>
              <CardDescription>Geschätzte Reparaturkosten</CardDescription>
            </CardHeader>
          </Card>
        </div>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Straßenschäden</CardTitle>
          <CardDescription>
            Übersicht aller erfassten Straßenschäden für dieses Projekt
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Nach Beschreibung oder Position suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <Select
                value={filterType}
                onValueChange={(value) => setFilterType(value as RoadDamageType | "")}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Schadenstyp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Alle Typen</SelectItem>
                  {Object.keys(damageTypeLabels).map((type) => (
                    <SelectItem key={type} value={type}>
                      {damageTypeLabels[type as keyof typeof damageTypeLabels]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select
                value={filterSeverity}
                onValueChange={(value) => setFilterSeverity(value as DamageSeverity | "")}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Schweregrad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Alle Schweregrade</SelectItem>
                  {Object.keys(damageSeverityLabels).map((severity) => (
                    <SelectItem key={severity} value={severity}>
                      {damageSeverityLabels[severity as keyof typeof damageSeverityLabels]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {(filterType || filterSeverity || searchQuery) && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setFilterType("");
                    setFilterSeverity("");
                    setSearchQuery("");
                  }}
                >
                  <FilterX className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          {filteredDamages && filteredDamages.length > 0 ? (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Typ</TableHead>
                    <TableHead>Schweregrad</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Beschreibung</TableHead>
                    <TableHead>Erstellt am</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDamages.map((damage) => (
                    <TableRow key={damage.id}>
                      <TableCell>
                        {damageTypeLabels[damage.damageType as keyof typeof damageTypeLabels]}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            damageSeverityColors[
                              damage.severity as keyof typeof damageSeverityColors
                            ]
                          }
                        >
                          {
                            damageSeverityLabels[
                              damage.severity as keyof typeof damageSeverityLabels
                            ]
                          }
                        </Badge>
                      </TableCell>
                      <TableCell>{damage.position || "---"}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {damage.description}
                      </TableCell>
                      <TableCell>
                        {damage.createdAt
                          ? format(new Date(damage.createdAt), "dd.MM.yyyy", {
                              locale: de,
                            })
                          : "---"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Sheet>
                            <SheetTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setSelectedDamage(damage)}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="sm:max-w-lg">
                              {selectedDamage && (
                                <>
                                  <SheetHeader>
                                    <SheetTitle>Straßenschaden Details</SheetTitle>
                                    <SheetDescription>
                                      Detaillierte Informationen zum ausgewählten Straßenschaden
                                    </SheetDescription>
                                  </SheetHeader>
                                  <div className="py-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        <h4 className="text-sm font-medium text-muted-foreground mb-1">
                                          Schadenstyp
                                        </h4>
                                        <p>
                                          {
                                            damageTypeLabels[
                                              selectedDamage.damageType as keyof typeof damageTypeLabels
                                            ]
                                          }
                                        </p>
                                      </div>
                                      <div>
                                        <h4 className="text-sm font-medium text-muted-foreground mb-1">
                                          Schweregrad
                                        </h4>
                                        <Badge
                                          variant="outline"
                                          className={
                                            damageSeverityColors[
                                              selectedDamage.severity as keyof typeof damageSeverityColors
                                            ]
                                          }
                                        >
                                          {
                                            damageSeverityLabels[
                                              selectedDamage.severity as keyof typeof damageSeverityLabels
                                            ]
                                          }
                                        </Badge>
                                      </div>
                                    </div>
                                    
                                    {selectedDamage.imageUrl && (
                                      <div>
                                        <h4 className="text-sm font-medium text-muted-foreground mb-2">
                                          Schadensbild
                                        </h4>
                                        <div className="w-full h-48 rounded-md border flex items-center justify-center overflow-hidden">
                                          <img
                                            src={selectedDamage.imageUrl}
                                            alt="Schadensbild"
                                            className="object-cover h-full w-full"
                                          />
                                        </div>
                                      </div>
                                    )}
                                    
                                    <div>
                                      <h4 className="text-sm font-medium text-muted-foreground mb-1">
                                        Position
                                      </h4>
                                      <p>{selectedDamage.position || "Keine Angabe"}</p>
                                    </div>
                                    
                                    <div>
                                      <h4 className="text-sm font-medium text-muted-foreground mb-1">
                                        Beschreibung
                                      </h4>
                                      <p className="whitespace-pre-wrap">
                                        {selectedDamage.description}
                                      </p>
                                    </div>
                                    
                                    {selectedDamage.recommendedAction && (
                                      <div>
                                        <h4 className="text-sm font-medium text-muted-foreground mb-1">
                                          Empfohlene Maßnahme
                                        </h4>
                                        <p className="whitespace-pre-wrap">
                                          {selectedDamage.recommendedAction}
                                        </p>
                                      </div>
                                    )}
                                    
                                    {selectedDamage.audioTranscription && (
                                      <div>
                                        <h4 className="text-sm font-medium text-muted-foreground mb-1">
                                          Sprachaufnahme (Transkript)
                                        </h4>
                                        <div className="bg-gray-50 p-3 rounded border">
                                          <p className="whitespace-pre-wrap italic text-sm">
                                            "{selectedDamage.audioTranscription}"
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                    
                                    <div>
                                      <h4 className="text-sm font-medium text-muted-foreground mb-1">
                                        Erfasst am
                                      </h4>
                                      <p>
                                        {selectedDamage.createdAt
                                          ? format(
                                              new Date(selectedDamage.createdAt),
                                              "dd.MM.yyyy HH:mm",
                                              { locale: de }
                                            )
                                          : "Unbekannt"}
                                      </p>
                                    </div>
                                  </div>
                                  <SheetFooter>
                                    <SheetClose asChild>
                                      <Button type="submit">Schließen</Button>
                                    </SheetClose>
                                  </SheetFooter>
                                </>
                              )}
                            </SheetContent>
                          </Sheet>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="icon">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Straßenschaden löschen
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Sind Sie sicher, dass Sie diesen Straßenschaden löschen möchten?
                                  Diese Aktion kann nicht rückgängig gemacht werden.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(damage.id)}
                                >
                                  Löschen
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium">Keine Straßenschäden gefunden</h3>
              <p className="text-muted-foreground mt-1">
                {filterType || filterSeverity || searchQuery
                  ? "Versuchen Sie, die Filter anzupassen oder einen anderen Suchbegriff zu verwenden."
                  : "Für dieses Projekt wurden noch keine Straßenschäden erfasst."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}