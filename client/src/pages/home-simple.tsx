import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Search, Info, User } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";

export default function HomeSimple() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [selectedEntity, setSelectedEntity] = useState("projekt");
  const [userStatus, setUserStatus] = useState<'checking' | 'authenticated' | 'unauthenticated'>('checking');

  // Überprüfen des Authentifizierungsstatus
  useEffect(() => {
    if (user) {
      setUserStatus('authenticated');
    } else {
      const checkAuth = async () => {
        try {
          const response = await fetch('/api/user');
          if (response.ok) {
            setUserStatus('authenticated');
          } else {
            setUserStatus('unauthenticated');
          }
        } catch (error) {
          setUserStatus('unauthenticated');
        }
      };
      
      checkAuth();
    }
  }, [user]);

  const handleEntityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedEntity(e.target.value);
  };

  const handleButtonClick = (path: string) => {
    if (userStatus === 'authenticated') {
      navigate(path);
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-4 text-primary">DB Manager Dashboard</h1>
        <p className="text-lg text-gray-600">Das umfassende System zur Verwaltung Ihrer Datenbank</p>
      </div>
      
      <Card id="eingabeformular" className="border-4 border-primary shadow-xl">
        <CardHeader className="bg-gradient-to-r from-primary/20 to-primary/5 py-8">
          <CardTitle className="text-3xl font-bold">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full inline-flex items-center">
                  <User className="h-5 w-5 mr-1" />
                  {user.username}
                </span>
                <span>, willkommen zurück!</span>
              </div>
            ) : (
              "Willkommen zum Datenbankmanager!"
            )}
          </CardTitle>
          <CardDescription className="text-lg mt-2">
            Ihr persönliches Dashboard zur effizienten Datenverwaltung
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <div className="bg-white p-8 rounded-lg border-2 border-primary/20 shadow-md">
            <h3 className="text-2xl font-bold mb-4 text-primary">Dateneingabe & Verwaltung</h3>
            <p className="mb-8 text-gray-600">Hier können Sie schnell auf die wichtigsten Funktionen zugreifen und neue Einträge erstellen.</p>
            
            {userStatus === 'unauthenticated' ? (
              <Alert className="mb-6 bg-blue-50 border-blue-200">
                <Info className="h-5 w-5 text-blue-500" />
                <AlertDescription>
                  Sie werden zur Anmeldeseite weitergeleitet, wenn Sie auf einen der Buttons klicken.
                </AlertDescription>
              </Alert>
            ) : userStatus === 'authenticated' && user && (
              <Alert className="mb-6 bg-green-50 border-green-200">
                <User className="h-5 w-5 text-green-500" />
                <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="font-medium">Angemeldet als {user.username}</span>
                  <span className="hidden sm:inline">•</span>
                  <span>Sie haben vollen Zugriff auf alle Funktionen.</span>
                </AlertDescription>
              </Alert>
            )}
            
            <div className="grid gap-10 sm:grid-cols-2">
              <div className="space-y-4">
                <Label htmlFor="search" className="text-xl font-medium">Suche</Label>
                <div className="relative">
                  <Search className="absolute left-4 top-4 h-6 w-6 text-primary" />
                  <Input 
                    id="search" 
                    type="search" 
                    placeholder="Suchen Sie nach Projekten, Kunden, etc." 
                    className="pl-14 h-16 text-lg rounded-lg shadow-sm"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <Label htmlFor="entity" className="text-xl font-medium">Entität auswählen</Label>
                <select
                  id="entity"
                  value={selectedEntity}
                  onChange={handleEntityChange}
                  className="w-full h-16 text-lg rounded-lg shadow-sm border border-input bg-background px-3 py-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="projekt">Projekt</option>
                  <option value="kunde">Kunde</option>
                  <option value="unternehmen">Unternehmen</option>
                  <option value="material">Material</option>
                </select>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 mt-10 justify-center">
              <Button 
                onClick={() => handleButtonClick("/projects")}
                className="w-full sm:w-auto h-16 text-lg bg-primary hover:bg-primary/90 rounded-lg shadow-md"
                size="lg"
              >
                <Plus className="mr-3 h-6 w-6" />
                Neues Projekt
              </Button>
              <Button 
                onClick={() => handleButtonClick("/customers")}
                variant="outline"
                className="w-full sm:w-auto h-16 text-lg border-2 rounded-lg shadow-md"
                size="lg"
              >
                <Plus className="mr-3 h-6 w-6" />
                Neuer Kunde
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-center border-t p-6 bg-muted/20">
          {user ? (
            <div className="flex flex-wrap gap-4 justify-center">
              <Button 
                variant="link" 
                onClick={() => navigate("/projects")} 
                className="text-base"
              >
                Zu meinen Projekten
              </Button>
              <Button 
                variant="link" 
                onClick={() => navigate("/quick-entry")} 
                className="text-base"
              >
                Schnelle Dateneingabe
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  fetch('/api/logout', { method: 'POST' })
                    .then(() => {
                      window.location.href = '/auth';
                    });
                }}
                className="text-base text-red-600 border-red-200 hover:bg-red-50"
              >
                Abmelden
              </Button>
            </div>
          ) : (
            <Button 
              variant="link" 
              onClick={() => navigate("/auth")} 
              className="text-base"
            >
              Jetzt anmelden oder registrieren
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}