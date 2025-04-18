import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

// UI-Komponenten
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCw, Search, X, CheckCircle, XCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Typen für Login-Logs basierend auf dem Schema
interface LoginLog {
  id: number;
  userId: number | null;
  username: string;
  eventType: 'login' | 'logout' | 'register' | 'failed_login';
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  success: boolean;
  failReason: string | null;
}

export function LoginLogsManagement() {
  const [filter, setFilter] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<string | null>(null);
  const [successFilter, setSuccessFilter] = useState<string | null>(null);

  // Daten abrufen
  const { data: logs, isLoading, refetch } = useQuery<LoginLog[]>({
    queryKey: ['/api/login-logs'],
    refetchInterval: 60000, // Alle 60 Sekunden automatisch aktualisieren
  });

  // Daten filtern
  const filteredLogs = logs?.filter((log) => {
    // Text-Filter auf Benutzername und IP-Adresse anwenden
    const textMatch = filter === '' || 
      log.username.toLowerCase().includes(filter.toLowerCase()) || 
      log.ipAddress.includes(filter);
    
    // Ereignistyp-Filter anwenden
    const eventMatch = eventTypeFilter === null || eventTypeFilter === 'all' || log.eventType === eventTypeFilter;
    
    // Erfolgs-Filter anwenden
    const successMatch = successFilter === null || successFilter === 'all' || 
      (successFilter === 'success' && log.success) || 
      (successFilter === 'fail' && !log.success);
    
    return textMatch && eventMatch && successMatch;
  });

  // Funktion zum Formatieren des Timestamps
  const formatTimestamp = (timestamp: string): string => {
    try {
      return format(new Date(timestamp), 'dd.MM.yyyy HH:mm:ss', { locale: de });
    } catch (error) {
      return timestamp;
    }
  };

  // Funktion zum Übersetzen des Ereignistyps
  const translateEventType = (eventType: string): string => {
    switch (eventType) {
      case 'login': return 'Anmeldung';
      case 'logout': return 'Abmeldung';
      case 'register': return 'Registrierung';
      case 'failed_login': return 'Fehlgeschlagene Anmeldung';
      default: return eventType;
    }
  };

  // Filter zurücksetzen
  const resetFilters = () => {
    setFilter('');
    setEventTypeFilter(null);
    setSuccessFilter(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Login-Protokoll</CardTitle>
        <CardDescription>Anmelde- und Registrierungsereignisse im System</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filter-Bereich */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="text-filter">Textfilter (Benutzername, IP-Adresse)</Label>
              <div className="relative">
                <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="text-filter"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="pl-8"
                  placeholder="Suchen..."
                />
              </div>
            </div>
            
            <div className="w-full md:w-72">
              <Label htmlFor="event-type-filter">Ereignistyp</Label>
              <Select
                value={eventTypeFilter || ""}
                onValueChange={(value) => setEventTypeFilter(value || null)}
              >
                <SelectTrigger id="event-type-filter">
                  <SelectValue placeholder="Alle Ereignistypen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Ereignistypen</SelectItem>
                  <SelectItem value="login">Anmeldung</SelectItem>
                  <SelectItem value="logout">Abmeldung</SelectItem>
                  <SelectItem value="register">Registrierung</SelectItem>
                  <SelectItem value="failed_login">Fehlgeschlagene Anmeldung</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full md:w-60">
              <Label htmlFor="success-filter">Status</Label>
              <Select
                value={successFilter || ""}
                onValueChange={(value) => setSuccessFilter(value || null)}
              >
                <SelectTrigger id="success-filter">
                  <SelectValue placeholder="Alle Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Status</SelectItem>
                  <SelectItem value="success">Erfolgreich</SelectItem>
                  <SelectItem value="fail">Fehlgeschlagen</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-between">
            <Button variant="outline" onClick={resetFilters} disabled={!filter && !eventTypeFilter && !successFilter}>
              <X className="mr-2 h-4 w-4" />
              Filter zurücksetzen
            </Button>
            
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Aktualisieren
            </Button>
          </div>
        </div>
        
        {/* Tabelle */}
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredLogs && filteredLogs.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableCaption>Liste aller Login-Ereignisse im System</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Zeitstempel</TableHead>
                  <TableHead>Benutzer</TableHead>
                  <TableHead>Ereignistyp</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>IP-Adresse</TableHead>
                  <TableHead className="hidden md:table-cell">Fehlergrund</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs">
                      {formatTimestamp(log.timestamp)}
                    </TableCell>
                    <TableCell>{log.username}</TableCell>
                    <TableCell>{translateEventType(log.eventType)}</TableCell>
                    <TableCell>
                      {log.success ? (
                        <span className="flex items-center text-green-600">
                          <CheckCircle className="mr-1 h-4 w-4" />
                          Erfolgreich
                        </span>
                      ) : (
                        <span className="flex items-center text-red-600">
                          <XCircle className="mr-1 h-4 w-4" />
                          Fehlgeschlagen
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{log.ipAddress}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {log.failReason || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Keine Login-Ereignisse gefunden.
          </div>
        )}
      </CardContent>
    </Card>
  );
}