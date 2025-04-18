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
import { Loader2, UserPlus } from 'lucide-react';

export function UserManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState<Partial<InsertUser>>({
    username: '',
    password: '',
    name: '',
    email: '',
    role: 'benutzer'
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
        role: 'benutzer'
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {users && users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.id}</TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <span className={`
                    px-2 py-1 rounded-full text-xs
                    ${user.role === 'administrator' ? 'bg-red-100 text-red-800' : ''}
                    ${user.role === 'manager' ? 'bg-blue-100 text-blue-800' : ''}
                    ${user.role === 'benutzer' ? 'bg-green-100 text-green-800' : ''}
                  `}>
                    {user.role}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}