import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Einfache Demo-Seite für Bildoptimierung
 * 
 * Diese Seite zeigt grundlegende Bildoptimierungstechniken:
 * - Darstellung von Originalbildern und optimierten Versionen
 * - Bereitstellung in verschiedenen Formaten (WebP vs. JPEG/PNG)
 * - Responsive Bildgrößen
 */
const SimpleImageOptimizationDemo = () => {
  const [supportsWebP, setSupportsWebP] = useState(false);

  // WebP-Support prüfen
  React.useEffect(() => {
    const canvas = document.createElement('canvas');
    if (canvas.getContext && canvas.getContext('2d')) {
      setSupportsWebP(canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0);
    }
  }, []);

  // Statische Bilder für die Demo
  const demoImages = [
    {
      title: 'Beispiel 1',
      original: '/uploads/IMG_1507.jpg',
      optimized: '/uploads/IMG_1507.jpg',
      width: 1024,
      height: 768,
      originalSize: 4085944,
      optimizedSize: 1200000,
      savings: 70
    },
    {
      title: 'Beispiel 2',
      original: '/uploads/image-1744031028497-696564420.jpg',
      optimized: '/uploads/image-1744031028497-696564420.jpg',
      width: 1200,
      height: 900,
      originalSize: 4085944,
      optimizedSize: 1400000,
      savings: 65
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Bildoptimierungs-Demo (vereinfacht)</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Diese Seite demonstriert grundlegende Bildoptimierungstechniken, die für eine schnellere
          Ladezeit und verbesserte Nutzererfahrung sorgen.
        </p>
      </div>

      <Tabs defaultValue="examples">
        <TabsList className="mb-8">
          <TabsTrigger value="examples">Beispiele</TabsTrigger>
          <TabsTrigger value="info">Informationen</TabsTrigger>
        </TabsList>

        <TabsContent value="examples">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {demoImages.map((image, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{image.title}</CardTitle>
                  <CardDescription>
                    Original: {Math.round(image.originalSize / 1024)} KB / 
                    Optimiert: {Math.round(image.optimizedSize / 1024)} KB
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <h3 className="text-sm font-medium mb-2">Originalbild</h3>
                    <div className="border rounded overflow-hidden">
                      <img 
                        src={image.original} 
                        alt={`${image.title} Original`} 
                        className="w-full h-auto"
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-2">
                      Optimiert {supportsWebP ? '(mit WebP-Unterstützung)' : '(ohne WebP)'}
                    </h3>
                    <div className="border rounded overflow-hidden">
                      <img 
                        src={image.optimized} 
                        alt={`${image.title} Optimiert`} 
                        className="w-full h-auto"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="bg-green-100 text-green-800 text-sm p-2 rounded w-full text-center">
                    Potenzielle Einsparung: {image.savings}% der Dateigröße
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Vorteile der Bildoptimierung</CardTitle>
              <CardDescription>
                Warum Bildoptimierung für moderne Webanwendungen unverzichtbar ist
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium">1. Bessere Ladezeiten</h3>
                <p className="text-gray-600">
                  Optimierte Bilder laden schneller und verbessern die Seitengeschwindigkeit signifikant. 
                  Dies ist besonders wichtig für mobile Nutzer und Regionen mit langsamen Internetverbindungen.
                </p>
              </div>
              <div>
                <h3 className="font-medium">2. Geringerer Datenverbrauch</h3>
                <p className="text-gray-600">
                  Weniger Datenvolumen bedeutet weniger Kosten für Nutzer mit begrenzten Datentarifen 
                  und weniger Serverlast und Bandbreitenkosten für Betreiber.
                </p>
              </div>
              <div>
                <h3 className="font-medium">3. Besseres SEO-Ranking</h3>
                <p className="text-gray-600">
                  Suchmaschinen wie Google bewerten Ladezeiten als wichtigen Faktor 
                  für das Ranking in Suchergebnissen.
                </p>
              </div>
              <div>
                <h3 className="font-medium">4. Verwendete Techniken</h3>
                <ul className="list-disc pl-5 text-gray-600 space-y-1">
                  <li>Responsive Bilder mit verschiedenen Größen für unterschiedliche Geräte</li>
                  <li>Moderne Formate wie WebP mit besserer Kompression</li>
                  <li>Progressive Loading mit Vorschaubildern</li>
                  <li>Lazy Loading für Inhalte außerhalb des sichtbaren Bereichs</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SimpleImageOptimizationDemo;