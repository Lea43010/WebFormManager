import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { SpeechToText } from "@/components/ui/speech-to-text";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Save, Map } from "lucide-react";

export default function GeoMapPage() {
  const [notes, setNotes] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [projectName, setProjectName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    // Hier würde normalerweise die Speicherlogik implementiert werden
    setTimeout(() => {
      setIsSaving(false);
      alert("Notizen gespeichert!");
    }, 1000);
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Geoportal BGR Zugriff</h1>
      <p className="text-gray-500 mb-6">
        Durchsuchen Sie die Bodenkarte und fügen Sie Notizen über die Spracherkennungsfunktion hinzu.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Bodenkarte Deutschland</CardTitle>
              <CardDescription>
                Geoportal der Bundesanstalt für Geowissenschaften und Rohstoffe
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative aspect-video w-full overflow-hidden border">
                <iframe 
                  src="https://geoportal.bgr.de/mapapps/resources/apps/geoportal/index.html?lang=de#/geoviewer" 
                  className="absolute top-0 left-0 w-full h-full"
                  allow="geolocation"
                  title="BGR Geoportal"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Tabs defaultValue="notizen">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="notizen">Sprachnotizen</TabsTrigger>
              <TabsTrigger value="details">Projektdetails</TabsTrigger>
            </TabsList>
            
            <TabsContent value="notizen">
              <Card>
                <CardHeader>
                  <CardTitle>Notizen hinzufügen</CardTitle>
                  <CardDescription>
                    Nutzen Sie die Spracherkennung, um Notizen zur Karte zu erfassen
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="location">Standort</Label>
                    <Input 
                      id="location" 
                      placeholder="z.B. Berlin, Köln, etc." 
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label>Sprachnotizen</Label>
                    <SpeechToText
                      onTextChange={setNotes}
                      placeholder="Sprechen Sie Ihre Notizen zu diesem Standort..."
                      initialText={notes}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="written-notes">Schriftliche Notizen</Label>
                    <Textarea
                      id="written-notes"
                      placeholder="Oder schreiben Sie Ihre Notizen hier..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleSave} 
                    className="w-full" 
                    disabled={isSaving || !notes.trim()}
                  >
                    {isSaving ? "Wird gespeichert..." : "Notizen speichern"}
                    <Save className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle>Projektinformationen</CardTitle>
                  <CardDescription>
                    Fügen Sie Details zum Projekt hinzu
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="project-name">Projektname</Label>
                    <Input 
                      id="project-name" 
                      placeholder="Name des Projekts" 
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="coordinates">Koordinaten</Label>
                    <Input 
                      id="coordinates" 
                      placeholder="z.B. 52.520008, 13.404954" 
                      disabled
                      value=""
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Koordinaten werden automatisch aus der Karte übernommen.
                    </p>
                  </div>

                  <div>
                    <Label>Bodentyp</Label>
                    <div className="text-sm p-3 border rounded-md bg-gray-50">
                      Informationen werden aus dem BGR Geoportal extrahiert.
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" disabled>
                    Mit Projekt verknüpfen
                    <Map className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}