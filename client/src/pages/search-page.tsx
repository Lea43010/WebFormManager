/**
 * Suchseite
 * 
 * Diese Seite integriert die universelle Suchkomponente und bietet einen
 * zentralen Ort für die Suche nach allen Arten von Entitäten im System.
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import UniversalSearchSimple from "@/components/universal-search-simple";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Database, Layers, Info } from "lucide-react";
import { useLocation } from "wouter";

const SearchPage: React.FC = () => {
  const [location] = useLocation();
  const [initialSearchQuery, setInitialSearchQuery] = useState<string>("");

  useEffect(() => {
    // URL-Parameter auslesen
    const searchParams = new URLSearchParams(window.location.search);
    const queryParam = searchParams.get('q');
    if (queryParam) {
      setInitialSearchQuery(queryParam);
    }
  }, [location]);

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col gap-8">
        {/* Header-Sektion */}
        <div className="text-center mb-2">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Universelle Suche</h1>
          <p className="text-gray-600 mt-2">
            Durchsuchen Sie Projekte, Dokumente, Benutzer und mehr mit einer einzigen Suchanfrage
          </p>
        </div>
        
        {/* Suchkomponente */}
        <div className="mb-8">
          <UniversalSearchSimple initialQuery={initialSearchQuery} />
        </div>
        
        {/* Hilfe-Karten */}
        <ScrollArea className="h-72">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Search className="h-5 w-5 text-[#76a730]" />
                  Suchtipps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li><strong>Genaue Begriffe:</strong> Verwenden Sie spezifische Begriffe für genauere Ergebnisse</li>
                  <li><strong>Projektname:</strong> Suchen Sie direkt nach dem Namen eines Projekts</li>
                  <li><strong>Filtern:</strong> Nutzen Sie die Tabs, um nach bestimmten Entitätstypen zu filtern</li>
                  <li><strong>Dokumente:</strong> Suchen Sie nach Dateinamen oder Beschreibungen</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Database className="h-5 w-5 text-[#76a730]" />
                  Durchsuchbare Inhalte
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li><strong>Projekte:</strong> Namen, Beschreibungen, Adressen</li>
                  <li><strong>Dokumente:</strong> Dateinamen, Beschreibungen, Tags</li>
                  <li><strong>Bautagebücher:</strong> Aktivitäten, Bemerkungen</li>
                  <li><strong>Oberflächenanalysen:</strong> Standorte, Bewertungen</li>
                  <li><strong>Unternehmen:</strong> Namen, Kontaktdaten</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Info className="h-5 w-5 text-[#76a730]" />
                  Über die Suche
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Die universelle Suche verwendet eine leistungsstarke Volltextsuche, die alle relevanten Inhalte in der gesamten Anwendung durchsucht. Die Ergebnisse werden nach Relevanz sortiert und können durch die Tabs gefiltert werden.
                </p>
                <p className="text-sm mt-3">
                  Klicken Sie auf ein Suchergebnis, um direkt zur entsprechenden Detailseite zu navigieren.
                </p>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default SearchPage;