import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { InsertUser, User } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';

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
import { Loader2, UserPlus, Trash2, CheckCircle, XCircle, HelpCircle } from 'lucide-react';

export function UserManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [newUser, setNewUser] = useState<Partial<InsertUser>>({
    username: '',
    password: '',
    name: '',
    email: '',
    role: 'benutzer',
    gdprConsent: true // Automatisch gesetzt, da vom Admin erstellt
  });

  // Abfrage der Benutzerliste
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/users');
      return response.json();
    },
    // Nur für Administratoren und Manager sichtbar
    enabled: user && (user.role === 'administrator' || user.role === 'manager'),
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
      toast({
        title: "Fehler beim Löschen des Benutzers",
        description: "Der Benutzer konnte nicht gelöscht werden. Details finden Sie im Dialog.",
        variant: "destructive",
      });
      // Der detaillierte Fehler wird im Dialog angezeigt
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Benutzerverwaltung</h2>
        
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
                  onValueChange={(value) => setNewUser({ ...newUser, role: value })}
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
                <TableCell>
                  {userData.gdprConsent === true ? (
                    <div className="flex items-center text-green-600" title="DSGVO-Zustimmung erteilt">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                  ) : userData.gdprConsent === false ? (
                    <div className="flex items-center text-red-600" title="Keine DSGVO-Zustimmung">
                      <XCircle className="h-5 w-5" />
                    </div>
                  ) : (
                    <div className="flex items-center text-yellow-600" title="DSGVO-Status unbekannt">
                      <HelpCircle className="h-5 w-5" />
                    </div>
                  )}
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