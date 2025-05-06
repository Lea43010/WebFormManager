import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { InsertUser, User } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';
import { addDays, format, isValid } from 'date-fns';
import { de } from 'date-fns/locale';
import { 
  Ban,
  CalendarPlus,
  CheckCircle, 
  HelpCircle, 
  Loader2, 
  RefreshCw, 
  Smile,
  Trash2, 
  UserPlus, 
  XCircle 
} from 'lucide-react';

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function UserManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  // Korrekte Typisierung für den Benutzerstatus mit Pflichtfeldern
  const [newUser, setNewUser] = useState<{
    username: string;
    password: string;
    name: string | null;
    email: string | null;
    role: 'administrator' | 'manager' | 'benutzer';
    gdprConsent: boolean;
    // Optional können weitere Felder aus InsertUser hier definiert werden
    trialEndDate?: Date;
    subscriptionStatus?: string;
  }>({
    username: '',
    password: '',
    name: '',
    email: '',
    role: 'benutzer',
    gdprConsent: true // Automatisch gesetzt, da vom Admin erstellt
  });

  // Abfrage der Benutzerliste mit korrekter Typisierung
  const { data: users, isLoading, refetch } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/users');
      const data = await response.json();
      
      // Logging für Debugging der Daten
      if (data && Array.isArray(data)) {
        console.log("Backend-Antwort Users:", data);
        
        if (data.length > 0) {
          console.log("Beispiel Benutzer:", data[0]);
          
          if (data[0].registrationDate) {
            console.log("Registrierungsdatum-Typ:", typeof data[0].registrationDate);
            console.log("Registrierungsdatum-Wert:", data[0].registrationDate);
          }
          
          if (data[0].trialEndDate) {
            console.log("Testphase-Enddatum-Typ:", typeof data[0].trialEndDate);
            console.log("Testphase-Enddatum-Wert:", data[0].trialEndDate);
          }
        }
      }
      
      return data;
    },
    // Nur für Administratoren und Manager sichtbar - explizite Typüberprüfung
    enabled: !!user && (['administrator', 'manager'].includes(user.role || '')),
    // Stets aktuelle Daten abrufen, um Caching-Probleme zu vermeiden
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Mutation zum Erstellen eines neuen Benutzers
  const createUserMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      const response = await apiRequest('POST', '/api/admin/users', userData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setIsDialogOpen(false);
      toast({
        title: "Benutzer erstellt",
        description: "Der Benutzer wurde erfolgreich angelegt.",
      });
      // Zurücksetzen des Formulars
      setNewUser({
        username: '',
        password: '',
        name: '',
        email: '',
        role: 'benutzer',
        gdprConsent: true
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler beim Erstellen des Benutzers",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // State für detaillierte Fehlermeldungen
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  // Mutation zum Aktualisieren des DSGVO-Status eines Benutzers
  const updateGdprStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: number, status: boolean }) => {
      const response = await apiRequest('PATCH', `/api/admin/users/${userId}`, {
        gdpr_consent: status
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error) => {
      toast({
        title: "Fehler beim Aktualisieren des DSGVO-Status",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Mutation zum Aktualisieren der Testphase eines Benutzers
  const updateTrialMutation = useMutation({
    mutationFn: async ({ 
      userId, 
      trialEndDate,
      subscriptionStatus 
    }: { 
      userId: number, 
      trialEndDate?: string, 
      subscriptionStatus?: string 
    }) => {
      const response = await apiRequest('PATCH', `/api/admin/users/${userId}`, {
        trial_end_date: trialEndDate,
        subscription_status: subscriptionStatus
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error) => {
      toast({
        title: "Fehler beim Aktualisieren der Testphase",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Mutation zum Löschen eines Benutzers (nur für Administratoren)
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      try {
        const response = await apiRequest('DELETE', `/api/admin/users/${userId}`);
        return response.json();
      } catch (error) {
        // Speichere die Fehlermeldung im State
        if (error instanceof Error) {
          setDeleteError(error.message);
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setUserToDelete(null);
      setDeleteError(null); // Zurücksetzen des Fehlers
      toast({
        title: "Benutzer gelöscht",
        description: "Der Benutzer wurde erfolgreich gelöscht.",
      });
    },
    onError: (error) => {
      // Extrahiere die Projektinformationen aus der Fehlermeldung, falls vorhanden
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Verschiedene Typen von Fehlermeldungen analysieren
      let alertTitle = "Fehler beim Löschen des Benutzers";
      let alertDescription = "Der Benutzer konnte nicht gelöscht werden.";
      
      if (errorMessage.includes("Projekte:")) {
        // Fehler wegen verknüpfter Projekte
        alertDescription = errorMessage;
      } else if (errorMessage.includes("Bautagebücher")) {
        // Fehler wegen verknüpfter Bautagebücher
        alertDescription = errorMessage;
      }
      
      // Toast-Meldung mit angepasster Beschreibung
      toast({
        title: alertTitle,
        description: "Benutzer hat abhängige Daten und kann nicht gelöscht werden.",
        variant: "destructive",
      });
      
      // Detaillierte Fehlermeldung im Dialog anzeigen
      setDeleteError(alertDescription);
    }
  });

  // Berechtigungsprüfung
  if (!user || (user.role !== 'administrator' && user.role !== 'manager')) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Keine Berechtigung</CardTitle>
          <CardDescription>
            Sie haben keine Berechtigung, diese Seite zu sehen.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Handler für das Erstellen eines neuen Benutzers
  const handleCreateUser = () => {
    if (!newUser.username || !newUser.password) {
      toast({
        title: "Fehlende Daten",
        description: "Benutzername und Passwort sind erforderlich.",
        variant: "destructive",
      });
      return;
    }

    createUserMutation.mutate({
      ...newUser as InsertUser,
      createdBy: user.id
    });
  };

  // Manuelles Neuladen der Benutzerliste
  const handleRefresh = () => {
    refetch();
    toast({
      title: "Benutzerliste aktualisiert",
      description: "Die Benutzerliste wurde neu geladen.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-bold tracking-tight">Benutzerverwaltung</h2>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleRefresh} 
            title="Benutzerliste aktualisieren"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Neuen Benutzer anlegen
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Neuen Benutzer anlegen</DialogTitle>
              <DialogDescription>
                Erstellen Sie einen neuen Benutzer und weisen Sie ihm eine Rolle zu.
                Die DSGVO-Zustimmung wird automatisch erteilt, da der Benutzer von einem Administrator erstellt wird.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="username" className="text-right">
                  Benutzername
                </Label>
                <Input
                  id="username"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  Passwort
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={newUser.name || ''}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  E-Mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email || ''}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Rolle
                </Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value: 'administrator' | 'manager' | 'benutzer') => setNewUser({ ...newUser, role: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Rolle auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Administratoren können alles erstellen */}
                    {user.role === 'administrator' && (
                      <>
                        <SelectItem value="administrator">Administrator</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="benutzer">Benutzer</SelectItem>
                      </>
                    )}
                    {/* Manager können nur Benutzer erstellen */}
                    {user.role === 'manager' && (
                      <SelectItem value="benutzer">Benutzer</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="submit" 
                onClick={handleCreateUser}
                disabled={createUserMutation.isPending}
              >
                {createUserMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Benutzer erstellen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Table>
          <TableCaption>Liste aller Benutzer im System</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Benutzername</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>E-Mail</TableHead>
              <TableHead>Rolle</TableHead>
              <TableHead>Registriert am</TableHead>
              <TableHead>Testphase bis</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>DSGVO</TableHead>
              {user.role === 'administrator' && <TableHead className="text-right">Aktionen</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {users && users.map((userData) => (
              <TableRow key={userData.id}>
                <TableCell className="font-medium">{userData.id}</TableCell>
                <TableCell>{userData.username}</TableCell>
                <TableCell>{userData.name}</TableCell>
                <TableCell>{userData.email}</TableCell>
                <TableCell>
                  <span className={`
                    px-2 py-1 rounded-full text-xs
                    ${userData.role === 'administrator' ? 'bg-red-100 text-red-800' : ''}
                    ${userData.role === 'manager' ? 'bg-blue-100 text-blue-800' : ''}
                    ${userData.role === 'benutzer' ? 'bg-green-100 text-green-800' : ''}
                  `}>
                    {userData.role}
                  </span>
                </TableCell>
                
                {/* Registrierungsdatum */}
                <TableCell>
                  {userData.registrationDate ? (
                    (() => {
                      try {
                        // Debug-Ausgabe für Problemanalyse
                        console.log(`Parsen von registrationDate für User ${userData.id}:`, userData.registrationDate);
                        console.log(`Typ: ${typeof userData.registrationDate}`);
                        
                        let dateValue = null;
                        
                        // Versuche verschiedene Datums-Parsing-Methoden
                        if (typeof userData.registrationDate === 'string') {
                          // ISO String Format (wie '2024-05-06')
                          const date1 = new Date(userData.registrationDate);
                          if (isValid(date1)) {
                            dateValue = date1;
                            console.log("Methode 1 erfolgreich:", dateValue);
                          }
                          
                          // PostgreSQL Datum mit Zeitzone (wie '2024-05-06T00:00:00.000Z')
                          if (!dateValue) {
                            const date2 = new Date(userData.registrationDate + 'T00:00:00.000Z');
                            if (isValid(date2)) {
                              dateValue = date2;
                              console.log("Methode 2 erfolgreich:", dateValue);
                            }
                          }
                          
                          // Versuche string in Teile zu zerlegen (yyyy-mm-dd)
                          if (!dateValue && userData.registrationDate.includes('-')) {
                            const parts = userData.registrationDate.split('-');
                            if (parts.length === 3) {
                              const date3 = new Date(
                                parseInt(parts[0]), 
                                parseInt(parts[1]) - 1, // Monate sind 0-basiert
                                parseInt(parts[2])
                              );
                              if (isValid(date3)) {
                                dateValue = date3;
                                console.log("Methode 3 erfolgreich:", dateValue);
                              }
                            }
                          }
                        } else if (typeof userData.registrationDate === 'object' && userData.registrationDate !== null) {
                          // Bereits ein Datum-Objekt
                          dateValue = new Date(userData.registrationDate);
                          console.log("Objekt Methode erfolgreich:", dateValue);
                        }
                        
                        if (!dateValue) {
                          console.error("Keine Parsing-Methode erfolgreich für:", userData.registrationDate);
                          return userData.registrationDate?.toString() || 'Ungültiges Format';
                        }
                        
                        return format(dateValue, 'dd.MM.yyyy', { locale: de });
                      } catch (e) {
                        console.error("Fehler beim Parsen des Registrierungsdatums:", e);
                        // Fallback: Direkte Anzeige des Rohwerts
                        return String(userData.registrationDate);
                      }
                    })()
                  ) : (
                    'Nicht gesetzt'
                  )}
                </TableCell>
                
                {/* Testphase-Enddatum */}
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" className="p-0 h-auto text-left">
                        {userData.trialEndDate ? (
                          (() => {
                            try {
                              // Debug-Ausgabe für Problemanalyse
                              console.log(`Parsen von trialEndDate für User ${userData.id}:`, userData.trialEndDate);
                              console.log(`Typ: ${typeof userData.trialEndDate}`);
                              
                              let dateValue = null;
                              
                              // Versuche verschiedene Datums-Parsing-Methoden
                              if (typeof userData.trialEndDate === 'string') {
                                // ISO String Format (wie '2024-05-06')
                                const date1 = new Date(userData.trialEndDate);
                                if (isValid(date1)) {
                                  dateValue = date1;
                                  console.log("Methode 1 erfolgreich:", dateValue);
                                }
                                
                                // PostgreSQL Datum mit Zeitzone (wie '2024-05-06T00:00:00.000Z')
                                if (!dateValue) {
                                  const date2 = new Date(userData.trialEndDate + 'T00:00:00.000Z');
                                  if (isValid(date2)) {
                                    dateValue = date2;
                                    console.log("Methode 2 erfolgreich:", dateValue);
                                  }
                                }
                                
                                // Versuche string in Teile zu zerlegen (yyyy-mm-dd)
                                if (!dateValue && userData.trialEndDate.includes('-')) {
                                  const parts = userData.trialEndDate.split('-');
                                  if (parts.length === 3) {
                                    const date3 = new Date(
                                      parseInt(parts[0]), 
                                      parseInt(parts[1]) - 1, // Monate sind 0-basiert
                                      parseInt(parts[2])
                                    );
                                    if (isValid(date3)) {
                                      dateValue = date3;
                                      console.log("Methode 3 erfolgreich:", dateValue);
                                    }
                                  }
                                }
                              } else if (typeof userData.trialEndDate === 'object' && userData.trialEndDate !== null) {
                                // Bereits ein Datum-Objekt
                                dateValue = new Date(userData.trialEndDate);
                                console.log("Objekt Methode erfolgreich:", dateValue);
                              }
                              
                              if (!dateValue) {
                                console.error("Keine Parsing-Methode erfolgreich für:", userData.trialEndDate);
                                return userData.trialEndDate?.toString() || 'Ungültiges Format';
                              }
                              
                              const today = new Date();
                              const isExpired = dateValue < today;
                              
                              return (
                                <span className={`font-mono ${isExpired ? 'text-red-600' : 'text-green-600'}`}>
                                  {format(dateValue, 'dd.MM.yyyy', { locale: de })}
                                  {isExpired && 
                                    <span className="ml-2 text-xs bg-red-100 px-1 py-0.5 rounded text-red-800">
                                      Abgelaufen
                                    </span>
                                  }
                                </span>
                              );
                            } catch (e) {
                              console.error("Fehler beim Parsen des Testphasen-Enddatums:", e);
                              // Fallback: Direkte Anzeige des Rohwerts
                              return String(userData.trialEndDate);
                            }
                          })()
                        ) : (
                          'Nicht gesetzt'
                        )}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Testphase für {userData.username}</DialogTitle>
                        <DialogDescription>
                          Hier können Sie die Testphase dieses Benutzers verwalten.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4 py-4">
                        <div className="p-4 border rounded-md">
                          <div className="font-medium">Aktueller Status:</div>
                          <div className="mt-2">
                            <div className="flex items-center">
                              <span className={`
                                px-2 py-1 rounded-full text-xs mr-2
                                ${userData.subscriptionStatus === 'active' ? 'bg-green-100 text-green-800' : ''}
                                ${userData.subscriptionStatus === 'trial' ? 'bg-blue-100 text-blue-800' : ''}
                                ${userData.subscriptionStatus === 'expired' ? 'bg-red-100 text-red-800' : ''}
                                ${!userData.subscriptionStatus ? 'bg-gray-100 text-gray-800' : ''}
                              `}>
                                {userData.subscriptionStatus === 'active' ? 'Aktiv' : 
                                 userData.subscriptionStatus === 'trial' ? 'Testphase' : 
                                 userData.subscriptionStatus === 'expired' ? 'Abgelaufen' : 
                                 'Unbekannt'}
                              </span>
                            </div>
                            
                            <div className="mt-2">
                              <strong>Testphase bis:</strong> {
                                userData.trialEndDate ? (
                                  (() => {
                                    try {
                                      // Debug-Ausgabe für Problemanalyse (Dialog)
                                      console.log(`Dialog: Parsen von trialEndDate für User ${userData.id}:`, userData.trialEndDate);
                                      
                                      let dateValue = null;
                                      
                                      // Versuche verschiedene Datums-Parsing-Methoden
                                      if (typeof userData.trialEndDate === 'string') {
                                        // ISO String Format (wie '2024-05-06')
                                        const date1 = new Date(userData.trialEndDate);
                                        if (isValid(date1)) {
                                          dateValue = date1;
                                        }
                                        
                                        // PostgreSQL Datum mit Zeitzone (wie '2024-05-06T00:00:00.000Z')
                                        if (!dateValue) {
                                          const date2 = new Date(userData.trialEndDate + 'T00:00:00.000Z');
                                          if (isValid(date2)) {
                                            dateValue = date2;
                                          }
                                        }
                                        
                                        // Versuche string in Teile zu zerlegen (yyyy-mm-dd)
                                        if (!dateValue && userData.trialEndDate.includes('-')) {
                                          const parts = userData.trialEndDate.split('-');
                                          if (parts.length === 3) {
                                            const date3 = new Date(
                                              parseInt(parts[0]), 
                                              parseInt(parts[1]) - 1, // Monate sind 0-basiert
                                              parseInt(parts[2])
                                            );
                                            if (isValid(date3)) {
                                              dateValue = date3;
                                            }
                                          }
                                        }
                                      } else if (typeof userData.trialEndDate === 'object' && userData.trialEndDate !== null) {
                                        // Bereits ein Datum-Objekt
                                        dateValue = new Date(userData.trialEndDate);
                                      }
                                        
                                      if (!dateValue) return 'Ungültiges Format';
                                      
                                      const today = new Date();
                                      const isExpired = dateValue < today;
                                      const daysRemaining = isExpired ? 0 : Math.ceil((dateValue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                        
                                      return (
                                        <span className={isExpired ? 'text-red-600' : 'text-green-600'}>
                                          {format(dateValue, 'dd.MM.yyyy', { locale: de })}
                                          {isExpired ? 
                                            <span className="ml-2 text-xs bg-red-100 px-1 py-0.5 rounded text-red-800">
                                              Abgelaufen
                                            </span> :
                                            <span className="ml-2 text-xs bg-green-100 px-1 py-0.5 rounded text-green-800">
                                              {daysRemaining} {daysRemaining === 1 ? 'Tag' : 'Tage'} verbleibend
                                            </span>
                                          }
                                        </span>
                                      );
                                    } catch (e) {
                                      return 'Fehler beim Parsen des Datums';
                                    }
                                  })()
                                ) : 'Nicht gesetzt'
                              }
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="font-medium mb-2">Testphase verwalten:</div>
                          <div className="space-y-4">
                            <div className="grid gap-4">
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor={`trialEndDate-${userData.id}`} className="text-right">
                                  Enddatum
                                </Label>
                                <Input
                                  id={`trialEndDate-${userData.id}`}
                                  type="date"
                                  defaultValue={
                                    userData.trialEndDate && isValid(new Date(userData.trialEndDate)) ? 
                                      format(new Date(userData.trialEndDate), 'yyyy-MM-dd') : 
                                      format(addDays(new Date(), 30), 'yyyy-MM-dd')
                                  }
                                  className="col-span-3"
                                  placeholder="YYYY-MM-DD"
                                />
                              </div>
                              
                              <div className="flex flex-col space-y-2 mt-4">
                                <Button
                                  variant="outline"
                                  className="justify-start"
                                  onClick={() => {
                                    const trialEndDate = (document.getElementById(`trialEndDate-${userData.id}`) as HTMLInputElement).value;
                                    updateTrialMutation.mutate({
                                      userId: userData.id,
                                      trialEndDate,
                                      subscriptionStatus: 'trial'
                                    });
                                    toast({
                                      title: "Testphase aktualisiert",
                                      description: `Testphase für ${userData.username} verlängert.`,
                                    });
                                  }}
                                  disabled={updateTrialMutation.isPending}
                                >
                                  {updateTrialMutation.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <CalendarPlus className="h-4 w-4 text-blue-600 mr-2" />
                                  )}
                                  Testphase verlängern
                                </Button>
                                
                                <Button
                                  variant="outline"
                                  className="justify-start"
                                  onClick={() => {
                                    updateTrialMutation.mutate({
                                      userId: userData.id,
                                      subscriptionStatus: 'active'
                                    });
                                    toast({
                                      title: "Abonnement aktiviert",
                                      description: `Vollzugriff für ${userData.username} aktiviert.`,
                                    });
                                  }}
                                  disabled={updateTrialMutation.isPending}
                                >
                                  {updateTrialMutation.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <Smile className="h-4 w-4 text-green-600 mr-2" />
                                  )}
                                  Vollzugriff aktivieren
                                </Button>
                                
                                <Button
                                  variant="outline"
                                  className="justify-start"
                                  onClick={() => {
                                    updateTrialMutation.mutate({
                                      userId: userData.id,
                                      subscriptionStatus: 'expired'
                                    });
                                    toast({
                                      title: "Zugriff beendet",
                                      description: `Zugriff für ${userData.username} beendet.`,
                                      variant: "destructive"
                                    });
                                  }}
                                  disabled={updateTrialMutation.isPending}
                                >
                                  {updateTrialMutation.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <Ban className="h-4 w-4 text-red-600 mr-2" />
                                  )}
                                  Zugriff beenden
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <DialogFooter>
                        <Button variant="secondary">Schließen</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </TableCell>
                
                {/* Subscription Status */}
                <TableCell>
                  <span className={`
                    px-2 py-1 rounded-full text-xs
                    ${userData.subscriptionStatus === 'active' ? 'bg-green-100 text-green-800' : ''}
                    ${userData.subscriptionStatus === 'trial' ? 'bg-blue-100 text-blue-800' : ''}
                    ${userData.subscriptionStatus === 'expired' ? 'bg-red-100 text-red-800' : ''}
                    ${!userData.subscriptionStatus ? 'bg-gray-100 text-gray-800' : ''}
                  `}>
                    {userData.subscriptionStatus === 'active' ? 'Aktiv' : 
                     userData.subscriptionStatus === 'trial' ? 'Testphase' : 
                     userData.subscriptionStatus === 'expired' ? 'Abgelaufen' : 
                     'Nicht gesetzt'}
                  </span>
                </TableCell>
                
                {/* DSGVO Status */}
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className={`
                          py-0.5 h-auto text-left px-2 rounded-full text-xs
                          ${userData.gdprConsent ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                        `}
                      >
                        {userData.gdprConsent ? (
                          <span className="flex items-center">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Zugestimmt
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <XCircle className="h-3 w-3 mr-1" />
                            Nicht zugestimmt
                          </span>
                        )}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>DSGVO-Status für {userData.username}</DialogTitle>
                        <DialogDescription>
                          Hier können Sie den DSGVO-Zustimmungsstatus dieses Benutzers einsehen und ändern.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4 py-4">
                        <div className="p-4 border rounded-md">
                          <div className="font-medium">Aktueller Status:</div>
                          <div className="mt-2">
                            <span
                              className={`
                                px-2 py-1 rounded-full text-xs
                                ${userData.gdprConsent ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                              `}
                            >
                              {userData.gdprConsent ? (
                                <span className="flex items-center">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Hat der DSGVO zugestimmt
                                </span>
                              ) : (
                                <span className="flex items-center">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Hat der DSGVO nicht zugestimmt
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <div className="font-medium mb-2">Status ändern:</div>
                          <div className="flex flex-col space-y-2">
                            <Button
                              variant="outline"
                              className="justify-start"
                              onClick={() => {
                                updateGdprStatusMutation.mutate({
                                  userId: userData.id,
                                  status: true
                                });
                                toast({
                                  title: "DSGVO-Status geändert",
                                  description: `DSGVO-Zustimmung für ${userData.username} erteilt.`,
                                });
                              }}
                              disabled={updateGdprStatusMutation.isPending}
                            >
                              {updateGdprStatusMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                              )}
                              Zustimmung erteilen
                            </Button>
                            
                            <Button
                              variant="outline"
                              className="justify-start"
                              onClick={() => {
                                updateGdprStatusMutation.mutate({
                                  userId: userData.id,
                                  status: false
                                });
                                toast({
                                  title: "DSGVO-Status geändert",
                                  description: `DSGVO-Zustimmung für ${userData.username} zurückgezogen.`,
                                  variant: "destructive"
                                });
                              }}
                              disabled={updateGdprStatusMutation.isPending}
                            >
                              <XCircle className="h-4 w-4 text-red-600 mr-2" />
                              Zustimmung zurückziehen
                            </Button>
                          </div>
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          <p>Hinweis: Durch Änderung des DSGVO-Status wird dokumentiert, dass Sie als Administrator die 
                          Zustimmungseinstellung im Namen des Benutzers durchgeführt haben.</p>
                        </div>
                      </div>
                      
                      <DialogFooter>
                        <Button variant="secondary">Schließen</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </TableCell>
                {user.role === 'administrator' && (
                  <TableCell className="text-right">
                    {/* Löschknopf nur für Administratoren und nicht für den eigenen Benutzer */}
                    {userData.id !== user.id ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Benutzer löschen</AlertDialogTitle>
                            <AlertDialogDescription>
                              Sind Sie sicher, dass Sie den Benutzer "{userData.username}" löschen möchten?
                              <br /><br />
                              Dies kann nicht rückgängig gemacht werden. Der Benutzer kann nur gelöscht werden, 
                              wenn er keine Projekte mehr besitzt.
                              
                              {/* Fehlermeldung anzeigen, wenn vorhanden */}
                              {deleteError && (
                                <div className="mt-4 p-4 border border-red-300 bg-red-50 rounded-md text-red-800">
                                  <h4 className="font-semibold mb-2">Fehler beim Löschen:</h4>
                                  <p className="text-sm whitespace-pre-wrap">{deleteError}</p>
                                  
                                  {/* Zusätzliche Erklärung basierend auf dem Fehlertyp */}
                                  {deleteError.includes("Projekte:") && (
                                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-xs">
                                      <strong>Tipp:</strong> Die verknüpften Projekte müssen zuerst gelöscht oder einem anderen Benutzer zugewiesen werden.
                                    </div>
                                  )}
                                  
                                  {deleteError.includes("Bautagebücher") && (
                                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-xs">
                                      <strong>Tipp:</strong> Die Bautagebücher müssen zuerst einem anderen Benutzer zugewiesen werden.
                                    </div>
                                  )}
                                </div>
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setDeleteError(null)}>Schließen</AlertDialogCancel>
                            {!deleteError && (
                              <AlertDialogAction
                                onClick={() => deleteUserMutation.mutate(userData.id)}
                                className="bg-red-500 hover:bg-red-700"
                                disabled={deleteUserMutation.isPending}
                              >
                                {deleteUserMutation.isPending && (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Löschen
                              </AlertDialogAction>
                            )}
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <div className="text-xs italic text-muted-foreground">
                        Aktiv
                      </div>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}