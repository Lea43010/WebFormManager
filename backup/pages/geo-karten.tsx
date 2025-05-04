import React from 'react';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Map, Building, MapIcon } from 'lucide-react';
import { Link } from 'wouter';
import BayernMaps from '@/components/maps/bayern-maps';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

export default function GeoKartenPage() {
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
                      <BreadcrumbLink useDivInsteadOfAnchor asChild>
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
              </div>
            </div>
            <Separator className="my-6" />
          </div>

          {/* Karten-Inhalte */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <BayernMaps />
            </div>
            <div className="space-y-6">
              <div className="bg-card rounded-lg border shadow-sm p-4">
                <h3 className="font-medium text-lg mb-2">Geo-Informationen</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Verschiedene Kartenquellen zur Unterstützung Ihrer Bauplanung in Bayern
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">BayernAtlas</p>
                      <p className="text-sm text-muted-foreground">Offizielle Karten des Freistaats Bayern</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Building className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">DenkmalAtlas</p>
                      <p className="text-sm text-muted-foreground">Denkmalgeschützte Objekte in Bayern</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapIcon className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Projektstandorte</p>
                      <p className="text-sm text-muted-foreground">Standorte Ihrer aktuellen Bauprojekte</p>
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}