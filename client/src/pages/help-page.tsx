import React from 'react';
import { 
  HelpCircle, 
  FileText, 
  Download, 
  ExternalLink, 
  Mail, 
  Phone, 
  Book,
  FileQuestion
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function HelpPage() {
  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex items-center mb-8">
        <HelpCircle className="h-8 w-8 mr-3 text-primary" />
        <h1 className="text-3xl font-bold">Hilfe & Information</h1>
      </div>
      
      <Tabs defaultValue="documentation">
        <TabsList className="mb-6">
          <TabsTrigger value="documentation" className="flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Dokumentation
          </TabsTrigger>
          <TabsTrigger value="faq" className="flex items-center">
            <FileQuestion className="h-4 w-4 mr-2" />
            Häufige Fragen
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center">
            <Mail className="h-4 w-4 mr-2" />
            Kontakt & Support
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="documentation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dokumentationscenter</CardTitle>
              <CardDescription>
                Hier finden Sie umfassende Anleitungen und Dokumentationen zu allen Funktionen.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <DocumentationCard 
                title="Benutzerhandbuch" 
                description="Vollständiges Handbuch zur Nutzung der Anwendung"
                icon={<Book className="h-10 w-10 text-primary" />}
                filePath="/docs/benutzerhandbuch.pdf"
                comingSoon
              />
              
              <DocumentationCard 
                title="Administration" 
                description="Administrationshandbuch für Systemadministratoren"
                icon={<HelpCircle className="h-10 w-10 text-primary" />}
                filePath="/docs/administrationshandbuch.pdf"
                comingSoon
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Video-Tutorials</CardTitle>
              <CardDescription>
                Lernvideos zu wichtigen Funktionen der Anwendung
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 border rounded-lg bg-muted/50">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Video-Tutorials in Entwicklung</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                  Video-Tutorials werden derzeit produziert und stehen in Kürze zur Verfügung.
                </p>
                <Button variant="outline" disabled>
                  Demnächst verfügbar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="faq" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Häufig gestellte Fragen</CardTitle>
              <CardDescription>
                Antworten auf die am häufigsten gestellten Fragen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="faq-1">
                  <AccordionTrigger>
                    Wie kann ich ein neues Projekt anlegen?
                  </AccordionTrigger>
                  <AccordionContent>
                    Um ein neues Projekt anzulegen, navigieren Sie zum Dashboard und klicken Sie auf den Button "Neues Projekt". Füllen Sie alle erforderlichen Felder aus und klicken Sie auf "Speichern". Das Projekt wird dann in Ihrer Projektliste erscheinen.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="faq-2">
                  <AccordionTrigger>
                    Wo finde ich Informationen zur Datenqualitätsprüfung?
                  </AccordionTrigger>
                  <AccordionContent>
                    Detaillierte Informationen zum Datenqualitätsmodul finden Sie im Bereich "Hilfe & Info" unter dem Abschnitt "Datenqualität". Dort stehen Ihnen umfassende Dokumentationen zur Verfügung, die erklären, wie Sie Datenqualitätsprüfungen durchführen, Berichte interpretieren und die Qualität Ihrer Daten verbessern können.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="faq-3">
                  <AccordionTrigger>
                    Wie kann ich andere Benutzer einladen?
                  </AccordionTrigger>
                  <AccordionContent>
                    Als Administrator können Sie neue Benutzer im Administrationsbereich unter "Benutzerverwaltung" hinzufügen. Geben Sie die E-Mail-Adresse ein, wählen Sie eine Rolle und klicken Sie auf "Benutzer einladen". Der neue Benutzer erhält dann eine E-Mail mit Anweisungen zur Registrierung.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="faq-4">
                  <AccordionTrigger>
                    Wie kann ich meine Dateien exportieren?
                  </AccordionTrigger>
                  <AccordionContent>
                    Sie können Ihre Daten in verschiedenen Formaten exportieren. Navigieren Sie zur gewünschten Ansicht, klicken Sie auf das Menü (drei Punkte) und wählen Sie "Exportieren". Wählen Sie das gewünschte Format (PDF, Excel, CSV) und klicken Sie auf "Exportieren".
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="faq-5">
                  <AccordionTrigger>
                    Was tun bei einem vergessenen Passwort?
                  </AccordionTrigger>
                  <AccordionContent>
                    Klicken Sie auf der Login-Seite auf "Passwort vergessen". Geben Sie Ihre E-Mail-Adresse ein und klicken Sie auf "Zurücksetzen". Sie erhalten eine E-Mail mit einem Link zum Zurücksetzen Ihres Passworts.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Kontakt & Support</CardTitle>
              <CardDescription>
                Benötigen Sie Hilfe? Kontaktieren Sie unser Support-Team.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 border rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <Mail className="h-6 w-6 text-primary mr-3" />
                    <h3 className="text-lg font-medium">E-Mail Support</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Unser Support-Team ist per E-Mail erreichbar und antwortet in der Regel innerhalb von 24 Stunden.
                  </p>
                  <Button className="w-full" variant="outline">
                    <Mail className="h-4 w-4 mr-2" /> support@bau-structura.de
                  </Button>
                </div>
                
                <div className="flex-1 border rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <Phone className="h-6 w-6 text-primary mr-3" />
                    <h3 className="text-lg font-medium">Telefonischer Support</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Für dringende Anfragen steht unser telefonischer Support werktags von 9:00 bis 17:00 Uhr zur Verfügung.
                  </p>
                  <Button className="w-full" variant="outline">
                    <Phone className="h-4 w-4 mr-2" /> +49 (0) 123 456789
                  </Button>
                </div>
              </div>
              
              <Separator />
              
              <div className="border rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <ExternalLink className="h-6 w-6 text-primary mr-3" />
                  <h3 className="text-lg font-medium">Online-Ressourcen</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="justify-start">
                    <ExternalLink className="h-4 w-4 mr-2" /> Wissensdatenbank
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <ExternalLink className="h-4 w-4 mr-2" /> Community-Forum
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <ExternalLink className="h-4 w-4 mr-2" /> Blog & Updates
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <ExternalLink className="h-4 w-4 mr-2" /> Schulungsvideos
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Dokumentationskarte-Komponente
function DocumentationCard({
  title,
  description,
  icon,
  filePath,
  comingSoon = false
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  filePath: string;
  comingSoon?: boolean;
}) {
  // Verbesserte Version mit Download-Option und direktem Anzeigen im Browser
  const handleViewDocument = () => {
    // PDF-Dokumentation direkt über das asset einbinden
    // Bei PDF-Dokumenten fügen wir #toolbar=0 hinzu, um die Toolbar zu deaktivieren
    if (filePath.endsWith('.pdf')) {
      const pdfUrl = `/public/docs/${filePath.split('/').pop()}`;
      window.open(pdfUrl, '_blank');
    } else {
      window.open(filePath, '_blank');
    }
  };
  
  const handleDownloadDocument = () => {
    // Lädt das Dokument als Datei herunter
    const link = document.createElement('a');
    const docPath = `/public/docs/${filePath.split('/').pop()}`;
    link.href = docPath;
    link.setAttribute('download', filePath.split('/').pop() || 'document.pdf');
    link.setAttribute('type', 'application/pdf');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="ml-4">{icon}</div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        {comingSoon ? (
          <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-2">
            Diese Dokumentation wird in Kürze verfügbar sein.
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Vollständige PDF-Dokumentation mit Erklärungen und Beispielen.
          </p>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        {comingSoon ? (
          <Button 
            variant="outline" 
            className="w-full" 
            disabled
          >
            <FileText className="h-4 w-4 mr-2" />
            Bald verfügbar
          </Button>
        ) : (
          <>
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={handleViewDocument}
            >
              <FileText className="h-4 w-4 mr-2" />
              Ansehen
            </Button>
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={handleDownloadDocument}
            >
              <Download className="h-4 w-4 mr-2" />
              Herunterladen
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}