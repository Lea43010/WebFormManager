import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Milestone, MilestoneDetail, insertMilestoneSchema, insertMilestoneDetailSchema } from '@shared/schema';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Calendar, Edit, Trash, Save, X, FileText } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface MilestoneSectionProps {
  projectId: number;
}

// Hilfsfunktion für Kalenderwochenfarben - angepasst an die Typen aus dem Bedarf/Kapazitäten-Tab
const getMilestoneColor = (type: string | null) => {
  switch (type) {
    case 'Tiefbau':
      return 'bg-blue-100 border-blue-500 text-blue-700';
    case 'HSA Tiefbau':
      return 'bg-green-100 border-green-500 text-green-700';
    case 'NVT Montage':
      return 'bg-amber-100 border-amber-500 text-amber-700';
    case 'Endmontage NE3':
      return 'bg-purple-100 border-purple-500 text-purple-700';
    case 'Bauleiter':
      return 'bg-yellow-100 border-yellow-500 text-yellow-700';
    default:
      return 'bg-gray-100 border-gray-500 text-gray-700';
  }
};

// Hilfsfunktion für Namen von Kalenderwochen
const getWeekName = (weekNumber: number) => {
  return `KW ${weekNumber}`;
};

// Hilfsfunktion zur Erzeugung von Array mit Kalenderwochen
const createWeeksArray = (year: number) => {
  // Ein Jahr hat 52 oder 53 Kalenderwochen
  const weeksInYear = getWeeksInYear(year);
  return Array.from({ length: weeksInYear }, (_, i) => i + 1);
};

// Berechnet die Anzahl der Kalenderwochen in einem Jahr (52 oder 53)
const getWeeksInYear = (year: number) => {
  const lastDay = new Date(year, 11, 31);
  const lastDayOfYear = lastDay.getDay();
  // Wenn der letzte Tag des Jahres ein Donnerstag ist (4) oder wenn es ein Schaltjahr
  // ist und der letzte Tag ein Mittwoch (3), dann hat das Jahr 53 Wochen
  if (lastDayOfYear === 4 || (lastDayOfYear === 3 && isLeapYear(year))) {
    return 53;
  }
  return 52;
};

// Überprüft, ob ein Jahr ein Schaltjahr ist
const isLeapYear = (year: number) => {
  return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
};

// Aktuelle Kalenderwoche berechnen
const getCurrentWeek = () => {
  const now = new Date();
  const onejan = new Date(now.getFullYear(), 0, 1);
  const weekNumber = Math.ceil((((now.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
  return weekNumber;
};

// Aktuelles Jahr
const getCurrentYear = () => {
  return new Date().getFullYear();
};

// Erzeugt verfügbare Kalenderwochennummern
const weekOptions = Array.from({ length: 53 }, (_, i) => i + 1);

// Erzeugt verfügbare Jahre (aktuelles Jahr +/- 5 Jahre)
const yearOptions = () => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
};

// Typenoptionen für Meilensteine - übernommen aus dem Bedarf/Kapazitäten-Tab
const milestoneTypes = [
  'Tiefbau',
  'HSA Tiefbau', 
  'NVT Montage', 
  'Endmontage NE3', 
  'Bauleiter', 
  'Sonstiges'
];

// Bauphasen-Optionen für Meilensteine
const bauphasenOptions = [
  'Baustart Tiefbau FÖB',
  'Baustart Tiefbau EWB',
  'Tiefbau EWB',
  'Tiefbau FÖB',
  'Montage NE3 EWB',
  'Montage NE3 FÖB',
  'Endmontage NE4 EWB',
  'Endmontage NE4 FÖB',
  'Sonstiges'
];

export function MilestoneSection({ projectId }: MilestoneSectionProps) {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>("week-view");
  
  // Formular für neuen Meilenstein
  const milestoneForm = useForm<z.infer<typeof insertMilestoneSchema>>({
    resolver: zodResolver(insertMilestoneSchema),
    defaultValues: {
      projectId,
      name: '',
      startKW: getCurrentWeek(),
      endKW: getCurrentWeek() + 1,
      jahr: getCurrentYear(),
      color: '#4F46E5',
      type: 'Tiefbau',
      ewbFoeb: 'keine',
      bauphase: 'Sonstiges',
      sollMenge: undefined
    }
  });
  
  // Formular für neues Meilenstein-Detail
  const detailForm = useForm<z.infer<typeof insertMilestoneDetailSchema>>({
    resolver: zodResolver(insertMilestoneDetailSchema),
    defaultValues: {
      milestoneId: 0,
      kalenderwoche: getCurrentWeek(),
      jahr: getCurrentYear(),
      text: '',
      supplementaryInfo: '',
      ewbFoeb: 'keine',
      sollMenge: undefined
    }
  });
  
  // Abfrage der Meilensteine für das Projekt
  const { data: milestones, isLoading: isLoadingMilestones } = useQuery<Milestone[]>({
    queryKey: [`/api/projects/${projectId}/milestones`], 
    enabled: !!projectId
  });
  
  // Bei Auswahl eines Meilensteins die Meilenstein-Details abfragen
  const { data: milestoneDetails, isLoading: isLoadingDetails } = useQuery<MilestoneDetail[]>({
    queryKey: [`/api/milestones/${selectedMilestoneId}/details`],
    enabled: !!selectedMilestoneId
  });
  
  // Meilenstein erstellen
  const createMilestoneMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertMilestoneSchema>) => {
      const response = await apiRequest(
        'POST',
        `/api/projects/${projectId}/milestones`,
        data
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Meilenstein erstellt',
        description: 'Der Meilenstein wurde erfolgreich erstellt.',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/milestones`] });
      setIsAddDialogOpen(false);
      milestoneForm.reset({
        projectId,
        name: '',
        startKW: getCurrentWeek(),
        endKW: getCurrentWeek() + 1,
        jahr: getCurrentYear(),
        color: '#4F46E5',
        type: 'Tiefbau',
        ewbFoeb: 'keine',
        bauphase: 'Sonstiges',
        sollMenge: undefined
      });
    },
    onError: (error) => {
      toast({
        title: 'Fehler',
        description: `Fehler beim Erstellen des Meilensteins: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  // Meilenstein löschen
  const deleteMilestoneMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(
        'DELETE',
        `/api/projects/${projectId}/milestones/${id}`
      );
    },
    onSuccess: () => {
      toast({
        title: 'Meilenstein gelöscht',
        description: 'Der Meilenstein wurde erfolgreich gelöscht.',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/milestones`] });
      if (selectedMilestoneId) {
        setSelectedMilestoneId(null);
      }
    },
    onError: (error) => {
      toast({
        title: 'Fehler',
        description: `Fehler beim Löschen des Meilensteins: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  // Meilenstein-Detail erstellen
  const createDetailMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertMilestoneDetailSchema>) => {
      const response = await apiRequest(
        'POST',
        `/api/milestones/${data.milestoneId}/details`,
        data
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Detail hinzugefügt',
        description: 'Das Meilenstein-Detail wurde erfolgreich hinzugefügt.',
      });
      if (selectedMilestoneId) {
        queryClient.invalidateQueries({ queryKey: [`/api/milestones/${selectedMilestoneId}/details`] });
      }
      setIsDetailDialogOpen(false);
      detailForm.reset({
        milestoneId: selectedMilestoneId || 0,
        kalenderwoche: getCurrentWeek(),
        jahr: getCurrentYear(),
        text: '',
        supplementaryInfo: '',
        ewbFoeb: 'keine',
        sollMenge: undefined
      });
    },
    onError: (error) => {
      toast({
        title: 'Fehler',
        description: `Fehler beim Hinzufügen des Details: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  // Meilenstein-Detail löschen
  const deleteDetailMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(
        'DELETE',
        `/api/milestones/${selectedMilestoneId}/details/${id}`
      );
    },
    onSuccess: () => {
      toast({
        title: 'Detail gelöscht',
        description: 'Das Meilenstein-Detail wurde erfolgreich gelöscht.',
      });
      if (selectedMilestoneId) {
        queryClient.invalidateQueries({ queryKey: [`/api/milestones/${selectedMilestoneId}/details`] });
      }
    },
    onError: (error) => {
      toast({
        title: 'Fehler',
        description: `Fehler beim Löschen des Details: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  // Meilenstein-Formular absenden
  const onMilestoneSubmit = (data: z.infer<typeof insertMilestoneSchema>) => {
    createMilestoneMutation.mutate(data);
  };
  
  // Meilenstein-Detail-Formular absenden
  const onDetailSubmit = (data: z.infer<typeof insertMilestoneDetailSchema>) => {
    createDetailMutation.mutate(data);
  };
  
  // Bei Auswahl eines Meilensteins das Detail-Formular aktualisieren
  useEffect(() => {
    if (selectedMilestoneId) {
      detailForm.setValue('milestoneId', selectedMilestoneId);
    }
  }, [selectedMilestoneId, detailForm]);
  
  // Excel-Export-Funktion
  const exportToExcel = () => {
    if (!milestones || milestones.length === 0) {
      toast({
        title: 'Keine Daten',
        description: 'Es sind keine Meilensteine zum Exportieren vorhanden.',
        variant: 'destructive',
      });
      return;
    }
    
    // Daten für Excel vorbereiten
    const weeksArray = createWeeksArray(selectedYear);
    
    // Kopfzeile mit Kalenderwochen erstellen
    const headers = ['ID', 'Meilenstein', 'Typ', 'Bauphase', ...weeksArray.map(week => `KW ${week}`)];
    
    // Daten für jede Zeile vorbereiten
    const rows = milestones.map(milestone => {
      const row: (string | number)[] = [
        milestone.id,
        milestone.name,
        milestone.type || 'Sonstige',
        milestone.bauphase || 'Sonstiges',
      ];
      
      // Für jede Kalenderwoche prüfen, ob der Meilenstein aktiv ist
      weeksArray.forEach(week => {
        if (milestone.jahr === selectedYear && 
            week >= milestone.startKW && 
            week <= milestone.endKW) {
          row.push('X');
        } else {
          row.push('');
        }
      });
      
      return row;
    });
    
    // Worksheet erstellen
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    
    // Workbook erstellen und Worksheet hinzufügen
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Meilensteine');
    
    // Datei herunterladen
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, `Meilensteine_Projekt_${projectId}_${selectedYear}.xlsx`);
    
    toast({
      title: 'Excel-Export',
      description: 'Die Meilensteine wurden erfolgreich als Excel-Datei exportiert.',
    });
  };
  
  // PDF-Export-Funktion
  const exportToPDF = () => {
    if (!milestones || milestones.length === 0) {
      toast({
        title: 'Keine Daten',
        description: 'Es sind keine Meilensteine zum Exportieren vorhanden.',
        variant: 'destructive',
      });
      return;
    }
    
    // Neues PDF-Dokument im Querformat erstellen
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    // Titel
    doc.setFontSize(16);
    doc.text(`Meilensteine - Projekt #${projectId} - Jahr ${selectedYear}`, 14, 15);
    
    // Daten für Tabelle vorbereiten
    const weeksArray = createWeeksArray(selectedYear);
    
    // Kopfzeile mit Kalenderwochen
    const headers = ['ID', 'Meilenstein', 'Typ', 'Bauphase', ...weeksArray.map(week => `KW ${week}`)];
    
    // Daten für jede Zeile
    const rows = milestones.map(milestone => {
      const row: (string | number)[] = [
        milestone.id,
        milestone.name,
        milestone.type || 'Sonstige',
        milestone.bauphase || 'Sonstiges',
      ];
      
      // Für jede Kalenderwoche prüfen, ob der Meilenstein aktiv ist
      weeksArray.forEach(week => {
        if (milestone.jahr === selectedYear && 
            week >= milestone.startKW && 
            week <= milestone.endKW) {
          row.push('X');
        } else {
          row.push('');
        }
      });
      
      return row;
    });
    
    // Tabelle hinzufügen
    // @ts-ignore - TypeScript kennt die autoTable-Methode nicht, obwohl sie durch das Import verfügbar ist
    doc.autoTable({
      head: [headers],
      body: rows,
      startY: 25,
      theme: 'grid',
      styles: {
        fontSize: 7,
        cellPadding: 1
      },
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: 255,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 10 }, // ID
        1: { cellWidth: 30 }, // Name
        2: { cellWidth: 20 }, // Typ
        3: { cellWidth: 20 }, // Bauphase
      }
    });
    
    // Datei herunterladen
    doc.save(`Meilensteine_Projekt_${projectId}_${selectedYear}.pdf`);
    
    toast({
      title: 'PDF-Export',
      description: 'Die Meilensteine wurden erfolgreich als PDF-Datei exportiert.',
    });
  };
  
  // Rendern der Kalenderwochenansicht
  const renderWeekView = () => {
    if (!milestones || milestones.length === 0) {
      return (
        <div className="text-center p-8 border rounded-md">
          <p className="text-muted-foreground">Keine Meilensteine vorhanden. Fügen Sie neue Meilensteine hinzu.</p>
        </div>
      );
    }
    
    const weeks = createWeeksArray(selectedYear);
    
    return (
      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Kalenderwochen-Header */}
          <div className="flex border-b">
            <div className="w-60 p-2 font-medium border-r">Meilenstein</div>
            {weeks.map(week => (
              <div 
                key={week} 
                className={`w-10 p-1 text-center text-xs font-medium ${
                  week === getCurrentWeek() && selectedYear === getCurrentYear() 
                    ? 'bg-blue-100' 
                    : ''
                }`}
              >
                {week}
              </div>
            ))}
          </div>
          
          {/* Meilensteine mit Zeiträumen */}
          {milestones.map(milestone => (
            <div 
              key={milestone.id} 
              className="flex border-b hover:bg-gray-50 cursor-pointer"
              onClick={() => {
                setSelectedMilestoneId(milestone.id);
                setActiveTab("detail-view");
              }}
            >
              <div className={`w-60 p-2 border-r flex items-center ${
                selectedMilestoneId === milestone.id ? 'bg-blue-50' : ''
              }`}>
                <div 
                  className="w-4 h-4 rounded-full mr-2" 
                  style={{ backgroundColor: milestone.color || '#CBD5E1' }}
                />
                <div>
                  <div className="font-medium">{milestone.ewbFoeb || 'keine'}</div>
                  <div className="text-xs text-gray-500">{milestone.type || 'Sonstiges'}</div>
                </div>
              </div>
              
              {weeks.map(week => {
                const isInRange = milestone.jahr === selectedYear &&
                                  week >= milestone.startKW && 
                                  week <= milestone.endKW;
                const isStart = week === milestone.startKW;
                const isEnd = week === milestone.endKW;
                const hasDetail = milestoneDetails?.some(
                  detail => detail.milestoneId === milestone.id && 
                            detail.kalenderwoche === week &&
                            detail.jahr === selectedYear
                );
                
                return (
                  <div 
                    key={`${milestone.id}-${week}`} 
                    className={`w-10 p-1 text-center border-r-0 ${
                      isInRange 
                        ? getMilestoneColor(milestone.type || 'Sonstiges')
                        : ''
                    } ${
                      isStart ? 'rounded-l-md border-l' : ''
                    } ${
                      isEnd ? 'rounded-r-md border-r' : ''
                    } ${
                      isInRange && !isStart && !isEnd ? 'border-t border-b' : ''
                    }`}
                  >
                    {isInRange && week === Math.floor((milestone.startKW + milestone.endKW) / 2) && (
                      <div className="text-xs font-medium text-black overflow-hidden whitespace-nowrap" 
                           title={`${milestone.name} - Typ: ${milestone.type || 'Sonstiges'} - Bauphase: ${milestone.bauphase || 'Sonstiges'} - EWB/FÖB: ${milestone.ewbFoeb || 'keine'}`}>
                        {milestone.name}
                      </div>
                    )}
                    {hasDetail && (
                      <div className="w-3 h-3 rounded-full bg-white mx-auto mt-1" title="Details vorhanden" />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="week-view">Kalenderwochenansicht</TabsTrigger>
            <TabsTrigger value="list-view">Listenansicht</TabsTrigger>
            {selectedMilestoneId && (
              <TabsTrigger value="detail-view">Detailansicht</TabsTrigger>
            )}
          </TabsList>
          
          <div className="flex items-center gap-2">
            <Select 
              value={selectedYear.toString()} 
              onValueChange={(value) => setSelectedYear(parseInt(value))}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Jahr auswählen" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions().map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={exportToExcel}>
              <FileText className="h-4 w-4 mr-2" />
              Excel
            </Button>
            
            <Button variant="outline" onClick={exportToPDF}>
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Meilenstein hinzufügen
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Neuen Meilenstein hinzufügen</DialogTitle>
                </DialogHeader>
                
                <Form {...milestoneForm}>
                  <form onSubmit={milestoneForm.handleSubmit(onMilestoneSubmit)} className="space-y-4">
                    <FormField
                      control={milestoneForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Meilensteinname</FormLabel>
                          <FormControl>
                            <Input placeholder="z.B. Bauphase 1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={milestoneForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Meilenstein</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Meilenstein auswählen" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {milestoneTypes.map(type => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={milestoneForm.control}
                        name="startKW"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start (KW)</FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(parseInt(value))}
                              defaultValue={field.value.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="KW auswählen" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {weekOptions.map(week => (
                                  <SelectItem key={week} value={week.toString()}>
                                    KW {week}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={milestoneForm.control}
                        name="endKW"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ende (KW)</FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(parseInt(value))}
                              defaultValue={field.value.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="KW auswählen" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {weekOptions.map(week => (
                                  <SelectItem key={week} value={week.toString()}>
                                    KW {week}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={milestoneForm.control}
                      name="jahr"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Jahr</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            defaultValue={field.value.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Jahr auswählen" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {yearOptions().map(year => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={milestoneForm.control}
                      name="color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Farbe</FormLabel>
                          <FormControl>
                            <Input 
                              type="color" 
                              value={field.value || '#4F46E5'} 
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                              disabled={field.disabled}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={milestoneForm.control}
                      name="ewbFoeb"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>EWB/FÖB</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="EWB/FÖB auswählen" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="keine">keine</SelectItem>
                              <SelectItem value="EWB">EWB</SelectItem>
                              <SelectItem value="FÖB">FÖB</SelectItem>
                              <SelectItem value="EWB,FÖB">EWB,FÖB</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={milestoneForm.control}
                      name="bauphase"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bauphase</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Bauphase auswählen" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {bauphasenOptions.map(option => (
                                <SelectItem key={option} value={option}>{option}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={milestoneForm.control}
                      name="sollMenge"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Soll-Menge</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="0.01"
                              placeholder="Soll-Menge eingeben" 
                              value={field.value?.toString() || ''} 
                              onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.value)}
                              onBlur={field.onBlur}
                              name={field.name}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Abbrechen
                      </Button>
                      <Button type="submit" disabled={createMilestoneMutation.isPending}>
                        {createMilestoneMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Meilenstein erstellen
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <TabsContent value="week-view" className="space-y-4">
          {isLoadingMilestones ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            renderWeekView()
          )}
        </TabsContent>
        
        <TabsContent value="list-view" className="space-y-4">
          {isLoadingMilestones ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Meilenstein</TableHead>
                  <TableHead>Bauphase</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>Ende</TableHead>
                  <TableHead>Jahr</TableHead>
                  <TableHead>EWB/FÖB</TableHead>
                  <TableHead>Soll-Menge</TableHead>
                  <TableHead>Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {milestones && milestones.length > 0 ? (
                  milestones.map(milestone => (
                    <TableRow 
                      key={milestone.id}
                      className={selectedMilestoneId === milestone.id ? 'bg-blue-50' : ''}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: milestone.color || '#CBD5E1' }}
                          />
                          {milestone.name}
                        </div>
                      </TableCell>
                      <TableCell>{milestone.type || "-"}</TableCell>
                      <TableCell>{milestone.bauphase || "Sonstiges"}</TableCell>
                      <TableCell>KW {milestone.startKW}</TableCell>
                      <TableCell>KW {milestone.endKW}</TableCell>
                      <TableCell>{milestone.jahr}</TableCell>
                      <TableCell>{milestone.ewbFoeb || "keine"}</TableCell>
                      <TableCell>{milestone.sollMenge !== null && milestone.sollMenge !== undefined ? 
                        (typeof milestone.sollMenge === 'number' ? 
                          (milestone.sollMenge as number).toFixed(2) : 
                          milestone.sollMenge) : "-"}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                setSelectedMilestoneId(milestone.id);
                setActiveTab("detail-view");
              }}
                            title="Details anzeigen"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              if (confirm('Sind Sie sicher, dass Sie diesen Meilenstein löschen möchten?')) {
                                deleteMilestoneMutation.mutate(milestone.id);
                              }
                            }}
                            title="Meilenstein löschen"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center">
                      Keine Meilensteine vorhanden
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </TabsContent>
        
        <TabsContent value="detail-view" className="space-y-4">
          {selectedMilestoneId && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>
                    {milestones?.find(m => m.id === selectedMilestoneId)?.name || 'Meilenstein'}
                  </CardTitle>
                  <CardDescription>
                    {milestones?.find(m => m.id === selectedMilestoneId)?.type || 'Kein Meilenstein'}
                    {' - '}
                    Bauphase: {milestones?.find(m => m.id === selectedMilestoneId)?.bauphase || 'Sonstiges'}
                    {' - '}
                    KW {milestones?.find(m => m.id === selectedMilestoneId)?.startKW} bis KW {milestones?.find(m => m.id === selectedMilestoneId)?.endKW}, {milestones?.find(m => m.id === selectedMilestoneId)?.jahr}
                    {' - '}
                    EWB/FÖB: {milestones?.find(m => m.id === selectedMilestoneId)?.ewbFoeb || 'keine'}
                    {milestones?.find(m => m.id === selectedMilestoneId)?.sollMenge !== null && 
                     milestones?.find(m => m.id === selectedMilestoneId)?.sollMenge !== undefined ? 
                     ` - Soll-Menge: ${milestones?.find(m => m.id === selectedMilestoneId)?.sollMenge}` : ''}
                  </CardDescription>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    onClick={() => {
                      if (selectedMilestoneId && confirm('Sind Sie sicher, dass Sie diesen Meilenstein löschen möchten?')) {
                        deleteMilestoneMutation.mutate(selectedMilestoneId);
                        setActiveTab("week-view");
                      }
                    }}
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Meilenstein löschen
                  </Button>
                  
                  <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Detail hinzufügen
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Meilenstein-Detail hinzufügen</DialogTitle>
                      </DialogHeader>
                      
                      <Form {...detailForm}>
                        <form onSubmit={detailForm.handleSubmit(onDetailSubmit)} className="space-y-4">
                          <input 
                            type="hidden" 
                            {...detailForm.register('milestoneId')} 
                            value={selectedMilestoneId}
                          />
                          
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={detailForm.control}
                              name="kalenderwoche"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Kalenderwoche</FormLabel>
                                  <Select
                                    onValueChange={(value) => field.onChange(parseInt(value))}
                                    defaultValue={field.value.toString()}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="KW auswählen" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {weekOptions.map(week => (
                                        <SelectItem key={week} value={week.toString()}>
                                          KW {week}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={detailForm.control}
                              name="jahr"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Jahr</FormLabel>
                                  <Select
                                    onValueChange={(value) => field.onChange(parseInt(value))}
                                    defaultValue={field.value.toString()}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Jahr auswählen" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {yearOptions().map(year => (
                                        <SelectItem key={year} value={year.toString()}>
                                          {year}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={detailForm.control}
                            name="text"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Beschreibung</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Kurze Beschreibung" 
                                    value={field.value || ''} 
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    name={field.name}
                                    ref={field.ref}
                                    disabled={field.disabled}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={detailForm.control}
                            name="supplementaryInfo"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Zusätzliche Informationen</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Weitere Details" 
                                    value={field.value || ''} 
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    name={field.name}
                                    ref={field.ref}
                                    disabled={field.disabled}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={detailForm.control}
                            name="ewbFoeb"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>EWB/FÖB</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Bitte auswählen" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="keine">Keine</SelectItem>
                                    <SelectItem value="EWB">EWB</SelectItem>
                                    <SelectItem value="FÖB">FÖB</SelectItem>
                                    <SelectItem value="EWB,FÖB">EWB,FÖB</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={detailForm.control}
                            name="sollMenge"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Soll-Menge</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number"
                                    step="0.01"
                                    placeholder="Soll-Menge eingeben" 
                                    value={field.value?.toString() || ''} 
                                    onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.value)}
                                    onBlur={field.onBlur}
                                    name={field.name}
                                    ref={field.ref}
                                    disabled={field.disabled}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                              Abbrechen
                            </Button>
                            <Button type="submit" disabled={createDetailMutation.isPending}>
                              {createDetailMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Detail hinzufügen
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              
              <CardContent>
                {isLoadingDetails ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : milestoneDetails && milestoneDetails.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>KW</TableHead>
                        <TableHead>Jahr</TableHead>
                        <TableHead>Beschreibung</TableHead>
                        <TableHead>Zusatzinformationen</TableHead>
                        <TableHead>EWB/FÖB</TableHead>
                        <TableHead>Soll-Menge</TableHead>
                        <TableHead>Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {milestoneDetails.map(detail => (
                        <TableRow key={detail.id}>
                          <TableCell>KW {detail.kalenderwoche}</TableCell>
                          <TableCell>{detail.jahr}</TableCell>
                          <TableCell>{detail.text}</TableCell>
                          <TableCell>{detail.supplementaryInfo}</TableCell>
                          <TableCell>{detail.ewbFoeb || 'keine'}</TableCell>
                          <TableCell>{detail.sollMenge !== null && detail.sollMenge !== undefined ? detail.sollMenge : '-'}</TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                if (confirm('Sind Sie sicher, dass Sie dieses Detail löschen möchten?')) {
                                  deleteDetailMutation.mutate(detail.id);
                                }
                              }}
                              title="Detail löschen"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center p-4 border rounded-md">
                    <p className="text-muted-foreground">Keine Details für diesen Meilenstein vorhanden.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}