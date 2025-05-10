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
  Users,
  Mail,
  UserCog,
  Shield
} from 'lucide-react';

// UI-Komponenten
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
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

  // Hilfsfunktion zum Formatieren des Datums
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Nicht gesetzt';
    
    try {
      const date = new Date(dateString);
      if (!isValid(date)) return 'Ungültiges Datum';
      return format(date, 'dd.MM.yyyy', { locale: de });
    } catch (e) {
      console.error("Fehler beim Formatieren des Datums:", e);
      return 'Formatierungsfehler';
    }
  };

  // Verlängere die Testphase um 30 Tage
  const extendTrial = (userId: number) => {
    const now = new Date();
    const newEndDate = addDays(now, 30);
    
    updateTrialMutation.mutate({
      userId,
      trialEndDate: newEndDate.toISOString(),
      subscriptionStatus: 'trial'
    });
    
    toast({
      title: "Testphase verlängert",
      description: `Die Testphase wurde um 30 Tage verlängert (bis ${format(newEndDate, 'dd.MM.yyyy', { locale: de })}).`,
    });
  };
  
  // Beende die Testphase
  const endTrial = (userId: number) => {
    updateTrialMutation.mutate({
      userId,
      subscriptionStatus: 'inactive'
    });
    
    toast({
      title: "Testphase beendet",
      description: "Die Testphase wurde vorzeitig beendet.",
    });
  };
  
  // Abfragen, ob ein Benutzer gelöscht werden soll
  const confirmDeleteUser = (userData: User) => {
    setUserToDelete(userData);
  };

  // Benutzer tatsächlich löschen
  const performDeleteUser = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold tracking-tight">Benutzerverwaltung</h2>
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
        <div>
          <h3 className="text-lg font-medium mb-4">Liste aller Benutzer im System ({users?.length || 0} Benutzer)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users && users.map((userData) => (
              <Card key={userData.id} className="overflow-hidden hover:shadow-md transition-shadow border">
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {userData.role === 'administrator' && <Shield className="h-5 w-5 text-red-500" />}
                      {userData.role === 'manager' && <UserCog className="h-5 w-5 text-blue-500" />}
                      {userData.role === 'benutzer' && <Smile className="h-5 w-5 text-green-500" />}
                      <span>{userData.name || userData.username}</span>
                    </CardTitle>
                    <Badge className={`
                      ${userData.role === 'administrator' ? 'bg-red-100 text-red-800 hover:bg-red-100' : ''}
                      ${userData.role === 'manager' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' : ''}
                      ${userData.role === 'benutzer' ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}
                    `}>
                      {userData.role}
                    </Badge>
                  </div>
                  <CardDescription className="flex flex-col space-y-1 mt-1">
                    <span className="flex items-center text-sm">
                      <span className="font-medium mr-2">ID:</span> {userData.id}
                    </span>
                    <span className="flex items-center text-sm truncate">
                      <span className="font-medium mr-2">Benutzername:</span> {userData.username}
                    </span>
                    {userData.email && (
                      <span className="flex items-center text-sm truncate">
                        <span className="font-medium mr-2">E-Mail:</span> {userData.email}
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-xs">Registriert am:</span>
                      <div>{formatDate(userData.registrationDate)}</div>
                    </div>
                    <div>
                      <span className="font-medium text-xs">Testphase bis:</span>
                      <div>
                        {userData.trialEndDate 
                          ? formatDate(userData.trialEndDate)
                          : 'Nicht gesetzt'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">DSGVO-Zustimmung:</span>
                    <Badge className={`${userData.gdprConsent ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-red-100 text-red-800 hover:bg-red-100'}`}>
                      {userData.gdprConsent ? 'Erteilt' : 'Nicht erteilt'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">Abonnement-Status:</span>
                    <Badge className={`
                      ${userData.subscriptionStatus === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}
                      ${userData.subscriptionStatus === 'trial' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' : ''}
                      ${userData.subscriptionStatus === 'inactive' ? 'bg-gray-100 text-gray-800 hover:bg-gray-100' : ''}
                      ${userData.subscriptionStatus === 'pending' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' : ''}
                      ${!userData.subscriptionStatus ? 'bg-gray-100 text-gray-800 hover:bg-gray-100' : ''}
                    `}>
                      {userData.subscriptionStatus || 'Nicht gesetzt'}
                    </Badge>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0 flex justify-between">
                  {user.role === 'administrator' && (
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => extendTrial(userData.id)}
                        className="text-xs h-8"
                      >
                        <CalendarPlus className="h-3.5 w-3.5 mr-1" />
                        +30 Tage
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            className="text-xs h-8"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            Löschen
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Benutzer löschen</AlertDialogTitle>
                            <AlertDialogDescription>
                              Sind Sie sicher, dass Sie den Benutzer "{userData.name || userData.username}" löschen möchten?
                              Dies kann nicht rückgängig gemacht werden.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          {deleteError && (
                            <div className="text-sm text-red-500 mt-2">
                              {deleteError}
                            </div>
                          )}
                          <AlertDialogFooter>
                            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => confirmDeleteUser(userData)}
                              disabled={deleteUserMutation.isPending}
                            >
                              {deleteUserMutation.isPending && userToDelete?.id === userData.id && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Löschen
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}