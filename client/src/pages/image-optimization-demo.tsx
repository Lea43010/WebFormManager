import React, { useState, useEffect } from 'react';
import OptimizedImage from '@/components/ui/optimized-image';
import ResponsiveImage from '@/components/ui/responsive-image';
import Base64Image from '@/components/ui/base64-image';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, Upload, Settings, Info, Image as ImageIcon } from 'lucide-react';

/**
 * Bildoptimierungs-Demo-Seite
 * 
 * Diese Seite demonstriert die verschiedenen Bildoptimierungskomponenten und -funktionen:
 * - Bildupload mit automatischer Optimierung
 * - Vergleich zwischen optimierten und nicht-optimierten Bildern
 * - Verschiedene Anzeigevarianten (ResponsiveImage mit verschiedenen Aspect Ratios)
 * - Blur-Placeholder-Demonstrationen
 * - WebP-Unterstützungserkennung
 */
const ImageOptimizationDemo: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<Array<{
    original: string;
    optimized: string;
    webp?: string;
    thumbnail?: string;
    blurHash?: string;
    width: number;
    height: number;
    originalSize: number;
    optimizedSize: number;
    savings: number;
  }>>([]);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [supportsWebP, setSupportsWebP] = useState<boolean | null>(null);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<string>('auto');
  const [selectedFit, setSelectedFit] = useState<string>('cover');
  const [useLazyLoading, setUseLazyLoading] = useState(true);
  const [useBlurPlaceholder, setUseBlurPlaceholder] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Statische Demo-Bilder (direkte Pfade ohne API-Aufrufe)
  const demoImages = [
    {
      original: '/uploads/example-1.png',
      optimized: '/uploads/example-1-optimized.png',
      webp: '/uploads/example-1-optimized.webp',
      blurHash: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAGAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAeEAABBAIDAQAAAAAAAAAAAAABAAIDBBEFITFRYf/EABUBAQEAAAAAAAAAAAAAAAAAAAID/8QAFhEBAQEAAAAAAAAAAAAAAAAAADEh/9oADAMBAAIRAxEAPwCiS3H+OwLVmplM5bK7TJoNA6OOvntERFJQ3//Z',
      width: 512,
      height: 512,
      originalSize: 64000,
      optimizedSize: 32000,
      savings: 50
    },
    {
      original: '/uploads/IMG_1507.jpg',
      optimized: '/uploads/IMG_1507.jpg',
      webp: '/uploads/IMG_1507.jpg',
      blurHash: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAGAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAeEAABBAIDAQAAAAAAAAAAAAABAAIDBBEFITFRYf/EABUBAQEAAAAAAAAAAAAAAAAAAAID/8QAFhEBAQEAAAAAAAAAAAAAAAAAADEh/9oADAMBAAIRAxEAPwCiS3H+OwLVmplM5bK7TJoNA6OOvntERFJQ3//Z',
      width: 1024,
      height: 768,
      originalSize: 400000,
      optimizedSize: 200000,
      savings: 50
    }
  ];

  // Setzen des Standard-Bilds beim Start
  useEffect(() => {
    setUploadedImages(demoImages);
    setSelectedImage(0);
  }, []);

  // WebP-Unterstützung erkennen
  useEffect(() => {
    const canvas = document.createElement('canvas');
    if (canvas.getContext && canvas.getContext('2d')) {
      setSupportsWebP(canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0);
    } else {
      setSupportsWebP(false);
    }
  }, []);

  // Beispielbilder laden
  useEffect(() => {
    // Simulierte Beispielbilder (würden normalerweise von der API kommen)
    const demoImages = [
      {
        original: '/uploads/example-1.jpg',
        optimized: '/uploads/example-1-optimized.jpg',
        webp: '/uploads/example-1-optimized.webp',
        thumbnail: '/uploads/example-1-thumb.jpg',
        blurHash: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAhEAACAQIGAwAAAAAAAAAAAAABAgMABAUGERIhMUFRYf/EABUBAQEAAAAAAAAAAAAAAAAAAAAB/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AoOF02Kws+JXG7TUXwY4gsSWdjyyAUUUBF//Z',
        width: 1200,
        height: 800,
        originalSize: 254000,
        optimizedSize: 127000,
        savings: 50
      },
      {
        original: '/uploads/example-2.jpg',
        optimized: '/uploads/example-2-optimized.jpg',
        webp: '/uploads/example-2-optimized.webp',
        thumbnail: '/uploads/example-2-thumb.jpg',
        blurHash: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAGAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAeEAABBAIDAQAAAAAAAAAAAAABAAIDBBEFITFRYf/EABUBAQEAAAAAAAAAAAAAAAAAAAID/8QAFhEBAQEAAAAAAAAAAAAAAAAAADEh/9oADAMBAAIRAxEAPwCiS3H+OwLVmplM5bK7TJoNA6OOvntERFJQ3//Z',
        width: 1600,
        height: 900,
        originalSize: 320000,
        optimizedSize: 140000,
        savings: 56
      }
    ];

    setUploadedImages(demoImages);
    setSelectedImage(0);
    setIsLoading(false);
  }, []);

  // Neue Bilder hochladen (Demo-Version)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setIsUploading(true);

    try {
      // Für Demo-Zwecke simulieren wir den Upload und verwenden das vorhandene Demo-Bild
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Bild erfolgreich hochgeladen und optimiert (Demo)",
        description: `Eine Einsparung von 50% wurde erreicht.`,
        variant: "default",
      });
      
      // Setze das ausgewählte Bild auf das erste Demo-Bild
      setSelectedImage(0);
    } catch (error) {
      console.error('Fehler beim Hochladen:', error);
      toast({
        title: "Fehler beim Hochladen",
        description: "Das Bild konnte nicht hochgeladen werden.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Feld zurücksetzen
      e.target.value = '';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const selectedImageData = selectedImage !== null ? uploadedImages[selectedImage] : null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Bildoptimierungs-Demo</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Diese Seite demonstriert die verschiedenen Bildoptimierungskomponenten und deren Funktionen
          zur Verbesserung der Ladezeiten und Benutzererfahrung.
        </p>
      </div>

      <Tabs defaultValue="view" className="mb-8">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="view">Bilder anzeigen</TabsTrigger>
          <TabsTrigger value="upload">Bild hochladen</TabsTrigger>
          <TabsTrigger value="settings">Einstellungen</TabsTrigger>
        </TabsList>

        <TabsContent value="view" className="mt-6">
          {uploadedImages.length > 0 ? (
            <div>
              <div className="grid grid-cols-4 gap-4 mb-6">
                {uploadedImages.map((image, index) => (
                  <div
                    key={index}
                    className={`relative cursor-pointer overflow-hidden rounded-lg border-2 transition-all ${
                      selectedImage === index ? 'border-primary' : 'border-transparent'
                    }`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <div className="aspect-video overflow-hidden">
                      <img 
                        src={image.thumbnail || image.optimized} 
                        alt={`Bild ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center">
                      {Math.round(image.savings)}% gespart
                    </div>
                  </div>
                ))}
              </div>

              {selectedImageData && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Card>
                    <CardHeader>
                      <CardTitle>Original</CardTitle>
                      <CardDescription>
                        Größe: {Math.round(selectedImageData.originalSize / 1024)} KB
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-2">
                      <div className="border rounded-lg overflow-hidden">
                        <img 
                          src={selectedImageData.original} 
                          alt="Original Bild" 
                          className="w-full"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>
                        Optimiert {supportsWebP ? '(WebP)' : '(JPG)'}
                      </CardTitle>
                      <CardDescription>
                        Größe: {Math.round(selectedImageData.optimizedSize / 1024)} KB
                        <span className="ml-2 text-green-600">
                          ({selectedImageData.savings}% kleiner)
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-2">
                      <div className="border rounded-lg overflow-hidden">
                        <img 
                          src={selectedImageData.optimized}
                          alt="Optimiertes Bild"
                          className="w-full"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <ImageIcon className="h-12 w-12 mx-auto text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold">Keine Bilder vorhanden</h3>
              <p className="text-gray-500">Laden Sie ein Bild hoch, um die Optimierung zu testen</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="upload" className="mt-6">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Bild hochladen</CardTitle>
                <CardDescription>
                  Wählen Sie ein Bild zum Hochladen aus, um die automatische Optimierung zu testen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed rounded-lg p-8 text-center bg-gray-50">
                  <Upload className="h-10 w-10 mx-auto text-gray-400 mb-4" />
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">
                      Unterstützte Formate: JPG, PNG, WebP
                    </p>
                    <p className="text-xs text-gray-500">
                      Maximale Größe: 5 MB
                    </p>
                  </div>
                  <Input
                    type="file"
                    accept="image/*"
                    id="image-upload"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                  />
                  <Label htmlFor="image-upload" className="cursor-pointer">
                    <Button disabled={isUploading}>
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Wird hochgeladen...
                        </>
                      ) : (
                        'Bild auswählen'
                      )}
                    </Button>
                  </Label>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <p className="text-xs text-gray-500">
                  Bilder werden automatisch optimiert und in verschiedenen Formaten gespeichert
                </p>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Anzeigeoptionen</CardTitle>
                <CardDescription>
                  Passen Sie die Darstellung der optimierten Bilder an
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="aspect-ratio">Seitenverhältnis</Label>
                  <Select 
                    value={selectedAspectRatio} 
                    onValueChange={setSelectedAspectRatio}
                  >
                    <SelectTrigger id="aspect-ratio">
                      <SelectValue placeholder="Seitenverhältnis wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto (Original)</SelectItem>
                      <SelectItem value="square">Quadratisch (1:1)</SelectItem>
                      <SelectItem value="video">Video (16:9)</SelectItem>
                      <SelectItem value="portrait">Portrait (3:4)</SelectItem>
                      <SelectItem value="landscape">Landscape (4:3)</SelectItem>
                      <SelectItem value="ultra-wide">Ultra-Wide (21:9)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="object-fit">Anzeigemodus</Label>
                  <Select 
                    value={selectedFit} 
                    onValueChange={setSelectedFit}
                  >
                    <SelectTrigger id="object-fit">
                      <SelectValue placeholder="Anzeigemodus wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cover">Cover (Füllt Container)</SelectItem>
                      <SelectItem value="contain">Contain (Zeigt gesamtes Bild)</SelectItem>
                      <SelectItem value="fill">Fill (Streckt auf Containergröße)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <Label htmlFor="lazy-loading">Lazy Loading</Label>
                  <Switch 
                    id="lazy-loading" 
                    checked={useLazyLoading}
                    onCheckedChange={setUseLazyLoading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="blur-placeholder">Blur-Placeholder</Label>
                  <Switch 
                    id="blur-placeholder" 
                    checked={useBlurPlaceholder}
                    onCheckedChange={setUseBlurPlaceholder}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vorschau</CardTitle>
                <CardDescription>
                  So sieht das Bild mit den aktuellen Einstellungen aus
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedImageData && (
                  <div className="border rounded-lg overflow-hidden">
                    <img
                      src={selectedImageData.optimized}
                      alt="Vorschaubild mit angepassten Einstellungen"
                      className="w-full"
                      style={{
                        objectFit: selectedFit as any || 'cover',
                        aspectRatio: selectedAspectRatio === 'square' ? '1/1' : 
                                    selectedAspectRatio === 'video' ? '16/9' : 
                                    selectedAspectRatio === 'portrait' ? '3/4' : 'auto'
                      }}
                    />
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <div className="text-xs text-gray-500 space-y-1 w-full">
                  <div className="flex justify-between">
                    <span>WebP unterstützt:</span>
                    <span>{supportsWebP === null ? 'Wird geprüft...' : (supportsWebP ? 'Ja' : 'Nein')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bildformat:</span>
                    <span>{supportsWebP ? 'WebP' : 'JPG/PNG'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Blur-Placeholder:</span>
                    <span>{useBlurPlaceholder ? 'Aktiv' : 'Inaktiv'}</span>
                  </div>
                </div>
              </CardFooter>
            </Card>
          </div>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="h-5 w-5 mr-2" />
                Über die Bildoptimierung
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <h3>Vorteile der Bildoptimierung</h3>
                <ul>
                  <li><strong>Kleinere Dateigrößen:</strong> Optimierte Bilder sind bis zu 70% kleiner als die Originale</li>
                  <li><strong>Schnellere Ladezeiten:</strong> Verbessert die Leistung bei Nutzern mit langsamen Verbindungen</li>
                  <li><strong>Bessere SEO:</strong> Suchmaschinen bevorzugen schnell ladende Websites</li>
                  <li><strong>Optimale Darstellung:</strong> Responsive Bilder auf allen Geräten</li>
                  <li><strong>Verbesserte Nutzerfahrung:</strong> Durch Blur-Placeholder und progressives Laden</li>
                </ul>

                <h3>Implementierte Techniken</h3>
                <ul>
                  <li><strong>WebP:</strong> Modernes Bildformat mit besserer Kompression</li>
                  <li><strong>Automatische Größenanpassung:</strong> Optimale Größen für verschiedene Ansichten</li>
                  <li><strong>Lazy Loading:</strong> Bilder werden erst geladen, wenn sie im Viewport sichtbar sind</li>
                  <li><strong>Blur-Placeholder:</strong> Unscharfe Vorschau während des Ladens</li>
                  <li><strong>Responsive Bilder:</strong> Optimale Anzeige auf allen Geräten</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ImageOptimizationDemo;