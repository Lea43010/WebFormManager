import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, BarChart4, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Attachment } from "@shared/schema";
// Direkter Fetch-Aufruf für API-Endpunkte, die JSON zurückgeben
const jsonFetch = async (url: string, options?: RequestInit) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
};

import { apiRequest } from "@/lib/queryClient";

type BelastungsklasseDetails = {
  name: string;
  description: string;
  aufbaudicke: string;
  details: string;
};

type AnalysisResult = {
  belastungsklasse: string;
  asphalttyp: string;
  confidence: number;
  analyseDetails: string;
  belastungsklasseDetails: BelastungsklasseDetails;
  asphaltTypDetails: string;
  visualizationUrl: string;
  imageBase64?: string; // Neu: Base64-kodiertes Bild
};

interface AsphaltAnalysisProps {
  attachment: Attachment;
}

export default function AsphaltAnalysis({ attachment }: AsphaltAnalysisProps) {
  const { toast } = useToast();
  const [showResult, setShowResult] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  
  const analysisMutation = useMutation({
    mutationFn: async (attachmentId: number) => {
      return await jsonFetch(`/api/analyze-asphalt/${attachmentId}`, {
        method: 'POST'
      }) as AnalysisResult;
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
      setShowResult(true);
      toast({
        title: "Analyse abgeschlossen",
        description: "Die Asphaltanalyse wurde erfolgreich durchgeführt.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler bei der Analyse",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Nur für Bilder anzeigen
  if (attachment.fileType !== 'image') {
    return null;
  }
  
  const handleAnalyzeClick = () => {
    analysisMutation.mutate(attachment.id);
  };
  
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 70) return "bg-green-500";
    if (confidence >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };
  
  return (
    <>
      <Button 
        onClick={handleAnalyzeClick}
        disabled={analysisMutation.isPending}
        variant="outline"
        size="sm"
        className="px-2 py-1 h-8 text-xs"
      >
        {analysisMutation.isPending ? (
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
        ) : (
          <BarChart4 className="mr-1 h-3 w-3" />
        )}
        Analyse
      </Button>
      
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>RStO Asphaltanalyse</DialogTitle>
            <DialogDescription>
              Ergebnisse der KI-gestützten Asphaltanalyse nach RStO
            </DialogDescription>
          </DialogHeader>
          
          {analysisResult && (
            <Tabs defaultValue="uebersicht">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="uebersicht">Übersicht</TabsTrigger>
                <TabsTrigger value="belastungsklasse">Belastungsklasse</TabsTrigger>
                <TabsTrigger value="visualisierung">Straßenaufbau</TabsTrigger>
              </TabsList>
              
              <TabsContent value="uebersicht" className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center justify-between">
                          Bild
                          <Badge variant="outline" className="ml-2">
                            {attachment.fileName}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <img 
                          src={analysisResult.imageBase64 ? `data:image/jpeg;base64,${analysisResult.imageBase64}` : `/uploads/${attachment.fileName}?t=${Date.now()}`} 
                          alt="Asphaltprobe" 
                          className="w-full h-auto rounded-md object-contain max-h-64"
                          onError={(e) => {
                            console.error("Bildfehler:", e);
                            // Verwende einen Fallback, wenn das Bild nicht geladen werden kann
                            (e.target as HTMLImageElement).src = "/static/image-placeholder.png";
                          }}
                        />
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="space-y-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Analyseergebnisse</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">Belastungsklasse:</span>
                            <Badge>{analysisResult.belastungsklasse}</Badge>
                          </div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">Asphalttyp:</span>
                            <Badge variant="outline">{analysisResult.asphalttyp}</Badge>
                          </div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">
                              Konfidenz:
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-4 w-4 inline-block ml-1 text-gray-500" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="w-64">
                                      Die Konfidenz gibt an, wie sicher die KI mit ihrer Einschätzung ist.
                                      &gt;70% = hohe Konfidenz, 50-70% = mittlere Konfidenz, &lt;50% = geringe Konfidenz
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </span>
                            <span className="text-sm font-medium">{analysisResult.confidence}%</span>
                          </div>
                          <Progress 
                            value={analysisResult.confidence} 
                            className={`h-2 mt-2 ${getConfidenceColor(analysisResult.confidence)}`}
                          />
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium mb-1">Analysedetails:</h4>
                          <p className="text-sm text-gray-600 border rounded-md p-3 bg-gray-50">
                            {analysisResult.analyseDetails}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="belastungsklasse" className="pt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>RStO-Belastungsklasse {analysisResult.belastungsklasse}</CardTitle>
                    <CardDescription>
                      {analysisResult.belastungsklasseDetails.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border rounded-md p-4">
                        <h3 className="font-medium mb-2">Technische Details</h3>
                        <ul className="space-y-2">
                          <li className="flex justify-between">
                            <span className="text-gray-600">Belastungsklasse:</span>
                            <span className="font-medium">{analysisResult.belastungsklasseDetails.name}</span>
                          </li>
                          <li className="flex justify-between">
                            <span className="text-gray-600">Gesamtaufbaudicke:</span>
                            <span className="font-medium">{analysisResult.belastungsklasseDetails.aufbaudicke}</span>
                          </li>
                          <li className="flex justify-between">
                            <span className="text-gray-600">Typische Anwendung:</span>
                            <span className="font-medium">{analysisResult.belastungsklasseDetails.details}</span>
                          </li>
                        </ul>
                      </div>
                      
                      <div className="border rounded-md p-4">
                        <h3 className="font-medium mb-2">Asphaltinformationen</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Identifizierter Typ:</span>
                            <span className="font-medium">{analysisResult.asphalttyp}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Beschreibung:</span>
                            <p className="mt-1 text-sm">{analysisResult.asphaltTypDetails}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-4">
                      <h3 className="font-medium mb-2">Belastungsinformationen</h3>
                      <p className="text-sm">{analysisResult.belastungsklasseDetails.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="visualisierung" className="pt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Straßenaufbau für RStO-Belastungsklasse {analysisResult.belastungsklasse}</CardTitle>
                    <CardDescription>
                      Schematische Darstellung des Straßenaufbaus nach RStO 12
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analysisResult.visualizationUrl ? (
                      <div className="flex justify-center">
                        <img 
                          src={analysisResult.visualizationUrl} 
                          alt={`Straßenaufbau für RStO ${analysisResult.belastungsklasse}`}
                          className="max-w-full h-auto rounded-md shadow-md"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col justify-center items-center h-64 border rounded-md bg-gray-50 p-4">
                        <p className="text-gray-600 font-medium mb-2">Keine Visualisierung verfügbar</p>
                        <p className="text-gray-500 text-sm text-center">
                          Die Visualisierung konnte aufgrund von API-Kontingentlimits nicht erstellt werden. 
                          Die Analysedetails zur Belastungsklasse und zum Asphalttyp sind aber weiterhin gültig.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}