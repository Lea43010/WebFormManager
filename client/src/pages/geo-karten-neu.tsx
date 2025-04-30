import React, { useState } from 'react';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Map, Building, MapIcon, Route } from 'lucide-react';
import { Link } from 'wouter';
import BayernMaps from '@/components/maps/bayern-maps';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function GeoKartenPage() {
  const [activeTab, setActiveTab] = useState("mapbox");

  return (
    <DashboardLayout title="Geo-Karten">
      <div className="container mx-auto py-6 px-4 md:px-6">
        <div className="flex flex-col gap-8">
          {/* Kopfzeile mit Navigation */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink>
                        <Link to="/">Dashboard</Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Geo-Karten</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
                <h1 className="text-3xl font-bold tracking-tight mt-2">Geo-Karten</h1>
                <p className="text-muted-foreground mt-1">
                  Geografische Karten und Standortinformationen für Bauprojekte
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Zurück
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/geo-map">
                    <MapPin className="mr-2 h-4 w-4" />
                    Straßenplanung öffnen
                  </Link>
                </Button>
              </div>
            </div>
            <Separator className="my-6" />
          </div>

          {/* Karten-Inhalte mit Tabs */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <Tabs defaultValue="mapbox" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="mapbox">Materialkosten & Marker</TabsTrigger>
                  <TabsTrigger value="bayern">Bayern-Karten</TabsTrigger>
                </TabsList>
                
                <TabsContent value="mapbox" className="mt-4">
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            Straßenplanung <Badge variant="outline">Standard</Badge>
                          </CardTitle>
                          <CardDescription>
                            Setzen Sie Marker für Ihre Projekte und berechnen Sie Materialkosten
                          </CardDescription>
                        </div>
                        <Button size="sm" asChild>
                          <Link to="/geo-map">
                            <Route className="mr-2 h-4 w-4" />
                            Zur erweiterten Ansicht
                          </Link>
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="aspect-video bg-muted flex items-center justify-center rounded-md border">
                        <div className="text-center p-6">
                          <Map className="h-12 w-12 mx-auto text-muted-foreground/60" />
                          <h3 className="mt-3 text-lg font-medium">Erweiterte Straßenplanung</h3>
                          <p className="mt-2 text-sm text-muted-foreground">
                            Die komplette Straßenplanung mit Marker-Setzung, Materialkosten-Berechnung und 
                            detaillierter Bauplanung ist in der erweiterten Ansicht verfügbar.
                          </p>
                          <Button className="mt-4" asChild>
                            <Link to="/geo-map">
                              Straßenplanung öffnen
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="bayern" className="mt-4">
                  <BayernMaps />
                </TabsContent>
              </Tabs>
            </div>
            
            <div className="space-y-6">
              <div className="bg-card rounded-lg border shadow-sm p-4">
                <h3 className="font-medium text-lg mb-2">Geo-Informationen</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Verschiedene Kartenquellen zur Unterstützung Ihrer Bauplanung in Bayern
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 cursor-pointer" onClick={() => setActiveTab("bayern")}>
                    <MapPin className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">BayernAtlas</p>
                      <p className="text-sm text-muted-foreground">Offizielle Karten des Freistaats Bayern</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 cursor-pointer" onClick={() => setActiveTab("bayern")}>
                    <Building className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">DenkmalAtlas</p>
                      <p className="text-sm text-muted-foreground">Denkmalgeschützte Objekte in Bayern</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 cursor-pointer" onClick={() => setActiveTab("mapbox")}>
                    <Route className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Straßenplanung</p>
                      <p className="text-sm text-muted-foreground">Straßenplanung und Materialkosten</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-lg border shadow-sm p-4">
                <h3 className="font-medium text-lg mb-2">Hilfe & Ressourcen</h3>
                <div className="space-y-4">
                  <a 
                    href="https://geoportal.bayern.de/bayernatlas/hilfe.html" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Map className="h-4 w-4" />
                    BayernAtlas Dokumentation
                  </a>
                  <a
                    href="https://www.ldbv.bayern.de/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Map className="h-4 w-4" />
                    Landesamt für Digitalisierung, Breitband und Vermessung
                  </a>
                  <Link to="/geo-map" className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <Route className="h-4 w-4" />
                    Straßenbau-Dokumentation
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}