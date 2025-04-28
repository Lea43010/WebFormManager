import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle, Clock, RefreshCw, Send } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

type TrialStatus = {
  id: number;
  username: string;
  email: string | null;
  registrationDate: string | null;
  trialEndDate: string | null;
  status: string;
  daysRemaining: number | null;
  subscriptionStatus: string;
};

type TrialStatusResponse = {
  success: boolean;
  data: TrialStatus[];
};

// Formatiert das Datum in deutschem Format
const formatGermanDate = (dateString: string | null): string => {
  if (!dateString) return 'Nicht gesetzt';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

// Bestimmt eine geeignete Farbe für den Status-Badge basierend auf dem Status
const getStatusColor = (status: string, daysRemaining: number | null): string => {
  if (status === 'aktiv') {
    if (daysRemaining !== null && daysRemaining <= 3) {
      return 'orange'; // Läuft bald aus
    }
    return 'green'; // Aktiv
  } else if (status === 'abgelaufen') {
    return 'destructive'; // Abgelaufen
  }
  return 'secondary'; // Unbekannt oder anderer Status
};

// Gibt eine benutzerfreundliche Beschreibung des Testphasenstatus zurück
const getStatusDescription = (status: string, daysRemaining: number | null): string => {
  if (status === 'aktiv') {
    if (daysRemaining === 1) {
      return `Aktiv (endet morgen)`;
    } else if (daysRemaining !== null) {
      return `Aktiv (noch ${daysRemaining} Tage)`;
    }
    return 'Aktiv';
  } else if (status === 'abgelaufen') {
    if (daysRemaining !== null && daysRemaining < 0) {
      const absDays = Math.abs(daysRemaining);
      return `Abgelaufen seit ${absDays} ${absDays === 1 ? 'Tag' : 'Tagen'}`;
    }
    return 'Abgelaufen';
  }
  return 'Status unbekannt';
};

const TrialManagement: React.FC = () => {
  const { toast } = useToast();
  const [daysBeforeExpiry, setDaysBeforeExpiry] = useState<string>("3");
  const [daysAfterExpiry, setDaysAfterExpiry] = useState<string>("1");
  
  // Laden der Testphasen-Status-Daten
  const { data: trialStatusData, isLoading, refetch } = useQuery<TrialStatusResponse>({
    queryKey: ['/api/admin/trial/status'],
    refetchOnWindowFocus: false,
  });
  
  // Mutation für das Senden von Benachrichtigungen für auslaufende Testphasen
  const sendEndingNotificationsMutation = useMutation({
    mutationFn: async (days: number) => {
      const response = await apiRequest(
        'POST', 
        '/api/admin/trial/send-ending-notifications', 
        { daysBeforeExpiry: days }
      );
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Benachrichtigungen gesendet",
        description: data.message,
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: `Fehler beim Senden der Benachrichtigungen: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Mutation für das Senden von Benachrichtigungen für abgelaufene Testphasen
  const sendEndedNotificationsMutation = useMutation({
    mutationFn: async (days: number) => {
      const response = await apiRequest(
        'POST', 
        '/api/admin/trial/send-ended-notifications', 
        { daysAfterExpiry: days }
      );
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Benachrichtigungen gesendet",
        description: data.message,
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: `Fehler beim Senden der Benachrichtigungen: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Handler für das Senden von Benachrichtigungen für auslaufende Testphasen
  const handleSendEndingNotifications = () => {
    const days = parseInt(daysBeforeExpiry, 10);
    if (isNaN(days) || days < 0) {
      toast({
        title: "Ungültige Eingabe",
        description: "Bitte geben Sie eine gültige Anzahl von Tagen ein (0 oder positiv).",
        variant: "destructive",
      });
      return;
    }
    
    sendEndingNotificationsMutation.mutate(days);
  };
  
  // Handler für das Senden von Benachrichtigungen für abgelaufene Testphasen
  const handleSendEndedNotifications = () => {
    const days = parseInt(daysAfterExpiry, 10);
    if (isNaN(days) || days < 0) {
      toast({
        title: "Ungültige Eingabe",
        description: "Bitte geben Sie eine gültige Anzahl von Tagen ein (0 oder positiv).",
        variant: "destructive",
      });
      return;
    }
    
    sendEndedNotificationsMutation.mutate(days);
  };
  
  // Berechnet Statistiken zu den Testphasen
  const calculateStats = () => {
    if (!trialStatusData?.data) return { active: 0, expiring: 0, expired: 0, unknown: 0, total: 0 };
    
    const stats = {
      active: 0,
      expiring: 0, // Läuft innerhalb der nächsten 3 Tage ab
      expired: 0,
      unknown: 0,
      total: trialStatusData.data.length
    };
    
    trialStatusData.data.forEach(item => {
      if (item.status === 'aktiv') {
        if (item.daysRemaining !== null && item.daysRemaining <= 3) {
          stats.expiring++;
        } else {
          stats.active++;
        }
      } else if (item.status === 'abgelaufen') {
        stats.expired++;
      } else {
        stats.unknown++;
      }
    });
    
    return stats;
  };
  
  const stats = calculateStats();
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Testphasen-Management</CardTitle>
        <CardDescription>Verwalten und überwachen Sie die Testphasen der Benutzer</CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="status">
          <TabsList className="mb-4">
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="notifications">Benachrichtigungen</TabsTrigger>
          </TabsList>
          
          <TabsContent value="status">
            <div className="grid gap-4">
              {/* Statistiken */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <Card className="p-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground mb-2">Aktiv</CardTitle>
                  <div className="text-2xl font-bold flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                    {stats.active}
                  </div>
                </Card>
                
                <Card className="p-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground mb-2">Läuft bald ab</CardTitle>
                  <div className="text-2xl font-bold flex items-center">
                    <Clock className="mr-2 h-5 w-5 text-orange-500" />
                    {stats.expiring}
                  </div>
                </Card>
                
                <Card className="p-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground mb-2">Abgelaufen</CardTitle>
                  <div className="text-2xl font-bold flex items-center">
                    <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
                    {stats.expired}
                  </div>
                </Card>
                
                <Card className="p-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground mb-2">Gesamt</CardTitle>
                  <div className="text-2xl font-bold">
                    {stats.total}
                  </div>
                </Card>
              </div>
              
              {/* Status-Aktualisierung */}
              <div className="flex justify-end mb-4">
                <Button 
                  variant="outline" 
                  onClick={() => refetch()} 
                  disabled={isLoading}
                  className="flex items-center"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Status aktualisieren
                </Button>
              </div>
              
              {/* Status-Liste */}
              {isLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Lade Daten...</p>
                </div>
              ) : trialStatusData?.data?.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Keine Daten</AlertTitle>
                  <AlertDescription>
                    Es wurden keine Benutzer mit Testphasen-Informationen gefunden.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Benutzer</th>
                        <th className="text-left p-2">E-Mail</th>
                        <th className="text-left p-2">Registrierung</th>
                        <th className="text-left p-2">Testphase endet</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Abo-Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trialStatusData?.data?.map(item => (
                        <tr key={item.id} className="border-b hover:bg-gray-50">
                          <td className="p-2">{item.username}</td>
                          <td className="p-2">{item.email || 'Keine'}</td>
                          <td className="p-2">{formatGermanDate(item.registrationDate)}</td>
                          <td className="p-2">{formatGermanDate(item.trialEndDate)}</td>
                          <td className="p-2">
                            <Badge variant={getStatusColor(item.status, item.daysRemaining) as any}>
                              {getStatusDescription(item.status, item.daysRemaining)}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <Badge variant={item.subscriptionStatus === 'aktiv' ? 'default' : 'secondary'}>
                              {item.subscriptionStatus === 'aktiv' ? 'Aktiv' : item.subscriptionStatus}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="notifications">
            <div className="grid gap-6">
              <Card className="p-4">
                <CardTitle className="text-lg mb-3">
                  Benachrichtigungen für auslaufende Testphasen
                </CardTitle>
                <CardDescription className="mb-4">
                  Senden Sie Benachrichtigungen an Benutzer, deren Testphase in Kürze abläuft.
                </CardDescription>
                
                <div className="grid gap-4">
                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <Label htmlFor="daysBeforeExpiry" className="mb-2 block">
                        Tage vor Ablauf
                      </Label>
                      <Input
                        id="daysBeforeExpiry"
                        type="number"
                        min="0"
                        value={daysBeforeExpiry}
                        onChange={(e) => setDaysBeforeExpiry(e.target.value)}
                      />
                    </div>
                    <Button 
                      onClick={handleSendEndingNotifications}
                      disabled={sendEndingNotificationsMutation.isPending}
                      className="flex items-center"
                    >
                      {sendEndingNotificationsMutation.isPending ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Wird gesendet...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Benachrichtigungen senden
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <CardTitle className="text-lg mb-3">
                  Benachrichtigungen für abgelaufene Testphasen
                </CardTitle>
                <CardDescription className="mb-4">
                  Senden Sie Benachrichtigungen an Benutzer, deren Testphase bereits abgelaufen ist.
                </CardDescription>
                
                <div className="grid gap-4">
                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <Label htmlFor="daysAfterExpiry" className="mb-2 block">
                        Tage nach Ablauf
                      </Label>
                      <Input
                        id="daysAfterExpiry"
                        type="number"
                        min="0"
                        value={daysAfterExpiry}
                        onChange={(e) => setDaysAfterExpiry(e.target.value)}
                      />
                    </div>
                    <Button 
                      onClick={handleSendEndedNotifications}
                      disabled={sendEndedNotificationsMutation.isPending}
                      className="flex items-center"
                    >
                      {sendEndedNotificationsMutation.isPending ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Wird gesendet...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Benachrichtigungen senden
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <p className="text-sm text-gray-500">
          Testphasen laufen automatisch 14 Tage nach der Registrierung ab.
        </p>
      </CardFooter>
    </Card>
  );
};

export default TrialManagement;