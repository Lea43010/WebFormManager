import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  RotateCw,
  ArrowUpDown,
  ExternalLink,
  AlertTriangle,
  Check,
  X,
  Edit,
  Trash,
  Plus,
  Eye,
  Clock,
  FileText,
  Download,
  Upload,
  Settings,
  UserPlus,
  LogIn,
  LogOut,
  Lock,
  Key,
  Shield,
  Send,
  Search
} from "lucide-react";

// Definition der Aktivitätstypen
const actionTypes = {
  CREATE: 'Erstellen',
  READ: 'Lesen',
  UPDATE: 'Aktualisieren',
  DELETE: 'Löschen',
  LOGIN: 'Anmeldung',
  LOGOUT: 'Abmeldung',
  DOWNLOAD: 'Herunterladen',
  UPLOAD: 'Hochladen',
  SETTING_CHANGE: 'Einstellungsänderung',
  USER_INVITE: 'Benutzereinladung',
  PASSWORD_RESET: 'Passwort-Reset',
  PERMISSION_CHANGE: 'Berechtigungsänderung',
  EXPORT: 'Exportieren',
  IMPORT: 'Importieren',
  SEND_EMAIL: 'E-Mail senden',
  OTHER: 'Sonstige'
};

const actionToIcon = {
  CREATE: <Plus className="h-4 w-4" />,
  READ: <Eye className="h-4 w-4" />,
  UPDATE: <Edit className="h-4 w-4" />,
  DELETE: <Trash className="h-4 w-4" />,
  LOGIN: <LogIn className="h-4 w-4" />,
  LOGOUT: <LogOut className="h-4 w-4" />,
  DOWNLOAD: <Download className="h-4 w-4" />,
  UPLOAD: <Upload className="h-4 w-4" />,
  SETTING_CHANGE: <Settings className="h-4 w-4" />,
  USER_INVITE: <UserPlus className="h-4 w-4" />,
  PASSWORD_RESET: <Key className="h-4 w-4" />,
  PERMISSION_CHANGE: <Lock className="h-4 w-4" />,
  EXPORT: <Download className="h-4 w-4" />,
  IMPORT: <Upload className="h-4 w-4" />,
  SEND_EMAIL: <Send className="h-4 w-4" />,
  OTHER: <FileText className="h-4 w-4" />
};

const actionToBadgeColor = {
  CREATE: "bg-green-100 text-green-800 hover:bg-green-200",
  READ: "bg-blue-100 text-blue-800 hover:bg-blue-200",
  UPDATE: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
  DELETE: "bg-red-100 text-red-800 hover:bg-red-200",
  LOGIN: "bg-purple-100 text-purple-800 hover:bg-purple-200",
  LOGOUT: "bg-purple-100 text-purple-800 hover:bg-purple-200",
  DOWNLOAD: "bg-cyan-100 text-cyan-800 hover:bg-cyan-200",
  UPLOAD: "bg-teal-100 text-teal-800 hover:bg-teal-200",
  SETTING_CHANGE: "bg-gray-100 text-gray-800 hover:bg-gray-200",
  USER_INVITE: "bg-indigo-100 text-indigo-800 hover:bg-indigo-200",
  PASSWORD_RESET: "bg-pink-100 text-pink-800 hover:bg-pink-200",
  PERMISSION_CHANGE: "bg-amber-100 text-amber-800 hover:bg-amber-200",
  EXPORT: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200",
  IMPORT: "bg-lime-100 text-lime-800 hover:bg-lime-200",
  SEND_EMAIL: "bg-sky-100 text-sky-800 hover:bg-sky-200",
  OTHER: "bg-gray-100 text-gray-800 hover:bg-gray-200"
};

// Komponente zur Anzeige und Verwaltung von Aktivitätsprotokollen
export function ActivityLogs() {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  
  // Abfrage der Aktivitätslogs vom Server
  const {
    data = {},
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: [
      '/api/activity-logs',
      currentPage,
      pageSize,
      searchTerm,
      actionTypeFilter,
      entityTypeFilter,
      startDate,
      endDate
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      // API erwartet limit und offset statt page und pageSize
      const offset = (currentPage - 1) * pageSize;
      params.append('limit', pageSize.toString());
      params.append('offset', offset.toString());
      
      // Spezifische Filter entsprechend den Backend-Endpunkten
      if (searchTerm) params.append('search', searchTerm);
      if (actionTypeFilter) params.append('actionType', actionTypeFilter);
      if (entityTypeFilter) params.append('entityType', entityTypeFilter);
      if (startDate) params.append('dateFrom', startDate.toISOString());
      if (endDate) params.append('dateTo', endDate.toISOString());
      
      // Pfad entsprechend der Backend-Route anpassen
      const response = await fetch(`/api/admin/activity-logs?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Aktivitätsprotokolle');
      }
      return response.json();
    }
  });
  
  // Zurücksetzen auf Seite 1, wenn sich Filter ändern
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, actionTypeFilter, entityTypeFilter, startDate, endDate, pageSize]);

  // Fehlerbehandlung
  useEffect(() => {
    if (isError && error) {
      toast({
        title: "Fehler",
        description: `Fehler beim Laden der Aktivitätsprotokolle: ${error.message}`,
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  // Anzahl der Einträge pro Seite ändern
  const handlePageSizeChange = (value: string) => {
    setPageSize(parseInt(value));
  };

  // Renderoptionen für die Aktionstypen im Filter
  const renderActionTypeOptions = () => {
    return Object.entries(actionTypes).map(([key, value]) => (
      <SelectItem key={key} value={key}>
        <div className="flex items-center gap-2">
          {actionToIcon[key as keyof typeof actionToIcon]}
          <span>{value}</span>
        </div>
      </SelectItem>
    ));
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Aktivitätsprotokolle</CardTitle>
          <CardDescription>
            Übersicht aller Systemaktivitäten und Benutzeraktionen
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-10">
          <div className="flex flex-col items-center">
            <RotateCw className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Aktivitätsprotokolle werden geladen...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Daten aus der Abfrageantwort extrahieren
  const logs = data?.logs || [];
  const totalItems = data?.pagination?.total || 0;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  
  // Wir laden die Entitätstypen separat vom Filter-Endpunkt, 
  // verwenden hier aber vereinfacht die vorhandenen Daten
  const entityTypes: string[] = [];
  
  // Einzigartige Entitätstypen aus vorhandenen Logs extrahieren
  logs.forEach((log: any) => {
    if (log.entity_type && !entityTypes.includes(log.entity_type)) {
      entityTypes.push(log.entity_type);
    }
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Aktivitätsprotokolle</CardTitle>
            <CardDescription>
              Übersicht aller Systemaktivitäten und Benutzeraktionen
            </CardDescription>
          </div>
          <Button onClick={() => refetch()} className="flex items-center gap-2" variant="outline">
            <RotateCw className="h-4 w-4" />
            Aktualisieren
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filterbereich */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="flex flex-col space-y-1.5">
            <label htmlFor="search" className="text-sm font-medium">Suche</label>
            <div className="flex">
              <Input
                id="search"
                placeholder="Suche nach Beschreibung..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
              <Button variant="ghost" className="px-2 ml-1" onClick={() => setSearchTerm('')}>
                {searchTerm ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col space-y-1.5">
            <label htmlFor="action-type" className="text-sm font-medium">Aktionstyp</label>
            <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
              <SelectTrigger id="action-type">
                <SelectValue placeholder="Alle Aktionen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Alle Aktionen</SelectItem>
                {renderActionTypeOptions()}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col space-y-1.5">
            <label htmlFor="entity-type" className="text-sm font-medium">Entitätstyp</label>
            <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
              <SelectTrigger id="entity-type">
                <SelectValue placeholder="Alle Entitäten" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Alle Entitäten</SelectItem>
                {entityTypes.map((type: string) => (
                  <SelectItem key={type} value={type || '_leer'}>
                    {type ? (type.charAt(0).toUpperCase() + type.slice(1)) : 'Unbekannt'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col space-y-1.5">
            <label htmlFor="page-size" className="text-sm font-medium">Einträge pro Seite</label>
            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger id="page-size">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Datumsfilter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="flex flex-col space-y-1.5">
            <label htmlFor="start-date" className="text-sm font-medium">Startdatum</label>
            <DatePicker 
              date={startDate} 
              setDate={(date: Date | null) => setStartDate(date)}
              placeholder="Startdatum wählen" 
            />
          </div>
          
          <div className="flex flex-col space-y-1.5">
            <label htmlFor="end-date" className="text-sm font-medium">Enddatum</label>
            <DatePicker 
              date={endDate} 
              setDate={(date: Date | null) => setEndDate(date)}
              placeholder="Enddatum wählen" 
            />
          </div>
        </div>
        
        {/* Zusammenfassung der Ergebnisse */}
        <div className="mb-4 text-sm text-muted-foreground">
          {totalItems === 0 ? (
            <p>Keine Aktivitätsprotokolle gefunden</p>
          ) : (
            <p>
              {totalItems} {totalItems === 1 ? 'Eintrag' : 'Einträge'} gefunden
              {(searchTerm || actionTypeFilter || entityTypeFilter || startDate || endDate) && ' (gefiltert)'}
            </p>
          )}
        </div>
        
        {/* Datentabelle */}
        {logs.length > 0 ? (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Zeitpunkt</TableHead>
                  <TableHead>Aktion</TableHead>
                  <TableHead>Benutzer</TableHead>
                  <TableHead>Entitätstyp</TableHead>
                  <TableHead className="hidden md:table-cell">Beschreibung</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs whitespace-nowrap">
                      {format(new Date(log.created_at), 'dd.MM.yyyy HH:mm:ss', { locale: de })}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={actionToBadgeColor[log.action_type as keyof typeof actionToBadgeColor]}
                        variant="outline"
                      >
                        <span className="flex items-center gap-1">
                          {actionToIcon[log.action_type as keyof typeof actionToIcon]}
                          {actionTypes[log.action_type as keyof typeof actionTypes] || log.action_type}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {log.username || `Benutzer ID: ${log.user_id}`}
                    </TableCell>
                    <TableCell className="capitalize">
                      {log.entity_type}
                    </TableCell>
                    <TableCell className="hidden md:table-cell max-w-xs truncate">
                      {log.details ? (typeof log.details === 'string' ? log.details : JSON.stringify(log.details)) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertTriangle className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Keine Aktivitätsprotokolle gefunden</h3>
            <p className="text-muted-foreground mt-2">
              Passen Sie Ihre Filterkriterien an oder versuchen Sie es später erneut.
            </p>
          </div>
        )}
        
        {/* Paginierung */}
        <div className="mt-4 flex items-center justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </CardContent>
    </Card>
  );
}