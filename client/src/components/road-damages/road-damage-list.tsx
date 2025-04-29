import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Edit, Trash2, Image, MapPin, FileAudio, Filter } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { roadDamageSeverityEnum, roadDamageTypeEnum, repairStatusEnum } from "@/schema/road-damage-schema";
import { RoadDamageForm } from "./road-damage-form";

interface RoadDamageListProps {
  projectId: number;
}

export function RoadDamageList({ projectId }: RoadDamageListProps) {
  const { toast } = useToast();
  const [selectedDamage, setSelectedDamage] = useState<any>(null);
  const [viewImageDialog, setViewImageDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [filters, setFilters] = useState({
    severity: "",
    damageType: "",
    repairStatus: "",
    search: ""
  });
  const [showFilters, setShowFilters] = useState(false);

  // Daten abrufen
  const { data: roadDamages, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["/api/projects", projectId, "road-damages"],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/road-damages`);
      if (!response.ok) {
        throw new Error(`Fehler beim Abrufen der Straßenschäden: ${response.statusText}`);
      }
      return await response.json();
    }
  });

  // Schaden löschen
  const handleDelete = async (id: number) => {
    if (!confirm("Sind Sie sicher, dass Sie diesen Straßenschaden löschen möchten?")) {
      return;
    }

    try {
      const response = await fetch(`/api/road-damages/${id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error(`Fehler beim Löschen: ${response.statusText}`);
      }

      toast({
        title: "Straßenschaden gelöscht",
        description: "Der Straßenschaden wurde erfolgreich gelöscht."
      });
      
      refetch();
    } catch (error) {
      console.error("Fehler beim Löschen des Straßenschadens:", error);
      toast({
        title: "Fehler beim Löschen",
        description: "Der Straßenschaden konnte nicht gelöscht werden.",
        variant: "destructive"
      });
    }
  };

  // Bild anzeigen
  const showImage = (damage: any) => {
    setSelectedDamage(damage);
    setViewImageDialog(true);
  };

  // Bearbeiten Dialog öffnen
  const openEditDialog = (damage: any) => {
    setSelectedDamage(damage);
    setEditDialog(true);
  };

  // Filter anwenden
  const applyFilters = (damages: any[]) => {
    if (!damages) return [];
    
    return damages.filter(damage => {
      // Textsuche
      if (filters.search && !damage.title.toLowerCase().includes(filters.search.toLowerCase()) && 
          !damage.location?.toLowerCase().includes(filters.search.toLowerCase()) &&
          !damage.description?.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      
      // Schweregrad
      if (filters.severity && damage.severity !== filters.severity) {
        return false;
      }
      
      // Schadenstyp
      if (filters.damageType && damage.damageType !== filters.damageType) {
        return false;
      }
      
      // Reparaturstatus
      if (filters.repairStatus && damage.repairStatus !== filters.repairStatus) {
        return false;
      }
      
      return true;
    });
  };

  // Formatierung der Werte
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "gering": return "bg-blue-100 text-blue-800";
      case "mittel": return "bg-yellow-100 text-yellow-800";
      case "hoch": return "bg-orange-100 text-orange-800";
      case "kritisch": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "offen": return "bg-red-100 text-red-800";
      case "geplant": return "bg-blue-100 text-blue-800";
      case "in_bearbeitung": return "bg-yellow-100 text-yellow-800";
      case "abgeschlossen": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "dd.MM.yyyy", { locale: de });
    } catch (e) {
      return dateString;
    }
  };

  // Filter zurücksetzen
  const resetFilters = () => {
    setFilters({
      severity: "",
      damageType: "",
      repairStatus: "",
      search: ""
    });
  };

  const filteredDamages = applyFilters(roadDamages || []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-md text-red-800">
        <p>Fehler beim Laden der Daten: {error instanceof Error ? error.message : "Unbekannter Fehler"}</p>
        <Button onClick={() => refetch()} variant="outline" className="mt-2">
          Erneut versuchen
        </Button>
      </div>
    );
  }

  if (!roadDamages || roadDamages.length === 0) {
    return (
      <div className="p-4 border rounded-md bg-gray-50 text-center">
        <p className="mb-2">Keine Straßenschäden für dieses Projekt vorhanden.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex justify-between items-center mb-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          {showFilters ? "Filter ausblenden" : "Filter anzeigen"}
        </Button>
        <div className="text-sm text-muted-foreground">
          {filteredDamages.length} von {roadDamages.length} Einträgen
        </div>
      </div>

      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-md space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input 
                placeholder="Suche nach Titel, Standort..." 
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="w-full"
              />
            </div>
            <div>
              <Select value={filters.severity} onValueChange={(value) => setFilters({...filters, severity: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Schweregrad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Alle Schweregrade</SelectItem>
                  {roadDamageSeverityEnum.map((severity) => (
                    <SelectItem key={severity} value={severity}>
                      {severity.charAt(0).toUpperCase() + severity.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={filters.damageType} onValueChange={(value) => setFilters({...filters, damageType: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Schadenstyp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Alle Typen</SelectItem>
                  {roadDamageTypeEnum.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={filters.repairStatus} onValueChange={(value) => setFilters({...filters, repairStatus: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Alle Status</SelectItem>
                  {repairStatusEnum.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Filter zurücksetzen
            </Button>
          </div>
        </div>
      )}

      {/* Tabelle */}
      <div className="overflow-x-auto border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titel</TableHead>
              <TableHead>Standort</TableHead>
              <TableHead>Schweregrad</TableHead>
              <TableHead>Typ</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Fälligkeitsdatum</TableHead>
              <TableHead>Kosten</TableHead>
              <TableHead>Medien</TableHead>
              <TableHead>Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDamages.map((damage) => (
              <TableRow key={damage.id}>
                <TableCell className="font-medium">{damage.title}</TableCell>
                <TableCell>{damage.location || "-"}</TableCell>
                <TableCell>
                  {damage.severity ? (
                    <Badge variant="outline" className={getSeverityColor(damage.severity)}>
                      {damage.severity.charAt(0).toUpperCase() + damage.severity.slice(1)}
                    </Badge>
                  ) : "-"}
                </TableCell>
                <TableCell>{damage.damageType ? damage.damageType.charAt(0).toUpperCase() + damage.damageType.slice(1) : "-"}</TableCell>
                <TableCell>
                  {damage.repairStatus ? (
                    <Badge variant="outline" className={getStatusColor(damage.repairStatus)}>
                      {damage.repairStatus.replace('_', ' ').charAt(0).toUpperCase() + damage.repairStatus.replace('_', ' ').slice(1)}
                    </Badge>
                  ) : "-"}
                </TableCell>
                <TableCell>{damage.repairDueDate ? formatDate(damage.repairDueDate) : "-"}</TableCell>
                <TableCell>{damage.estimatedRepairCost ? formatCurrency(damage.estimatedRepairCost) : "-"}</TableCell>
                <TableCell>
                  <div className="flex space-x-1">
                    {damage.imageUrl && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => showImage(damage)}
                        className="h-8 w-8"
                      >
                        <Image className="h-4 w-4" />
                      </Button>
                    )}
                    {damage.coordinates && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                      >
                        <MapPin className="h-4 w-4" />
                      </Button>
                    )}
                    {damage.voiceNoteUrl && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => window.open(damage.voiceNoteUrl, '_blank')}
                      >
                        <FileAudio className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => openEditDialog(damage)}
                      className="h-8 w-8"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(damage.id)}
                      className="h-8 w-8 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Bild anzeigen Dialog */}
      <Dialog open={viewImageDialog} onOpenChange={setViewImageDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedDamage?.title}</DialogTitle>
          </DialogHeader>
          <div className="p-2">
            {selectedDamage?.imageUrl && (
              <img 
                src={selectedDamage.imageUrl} 
                alt={selectedDamage.title}
                className="max-h-[70vh] w-auto mx-auto border rounded-md" 
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Bearbeiten Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Straßenschaden bearbeiten</DialogTitle>
          </DialogHeader>
          {selectedDamage && (
            <RoadDamageForm 
              projectId={projectId} 
              initialData={selectedDamage}
              isEdit={true}
              onSuccess={() => {
                setEditDialog(false);
                refetch();
                toast({
                  title: "Straßenschaden aktualisiert",
                  description: "Die Änderungen wurden erfolgreich gespeichert."
                });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}