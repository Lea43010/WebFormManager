import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";
import { InfoIcon, Building2, Home, Wrench, PaintBucket, Paintbrush, Hammer, Cog, Flame, Radio, CircuitBoard, Wifi, Ruler, Construction, TentTree, LeafyGreen, Shovel, FileText, ExternalLink, BookText, FileCheck, FileBadge, Database, Calculator } from "lucide-react";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

interface CostGroupsProps {
  projectId: number;
}

// Links zu Leistungsverzeichnissen und Ressourcen
const LV_RESOURCES = [
  {
    id: 1,
    title: "STLB-Bau Dynamische BauDaten",
    description: "Standardleistungsbuch für das Bauwesen mit standardisierten Leistungstexten",
    icon: <BookText className="h-5 w-5" />,
    url: "https://www.gaeb.de/produkte/stlb-bau/"
  },
  {
    id: 2,
    title: "GAEB Datenaustausch",
    description: "Gemeinsamer Ausschuss Elektronik im Bauwesen - Standards für elektronischen Datenaustausch",
    icon: <Database className="h-5 w-5" />,
    url: "https://www.gaeb.de/produkte/gaeb-datenaustausch/"
  },
  {
    id: 3,
    title: "Vergabe- und Vertragsordnung für Bauleistungen (VOB)",
    description: "Regelwerk für die Vergabe und Abwicklung von Bauleistungen",
    icon: <FileCheck className="h-5 w-5" />,
    url: "https://www.vob-online.de/"
  },
  {
    id: 4,
    title: "Sirados Baudaten",
    description: "Umfangreiche Sammlung von Leistungsbeschreibungen und Kalkulationshilfen",
    icon: <FileBadge className="h-5 w-5" />,
    url: "https://www.sirados.de/"
  },
  {
    id: 5,
    title: "BKI Baukosteninformationszentrum",
    description: "Standardisierte Kostenkennwerte für verschiedene Bauleistungen",
    icon: <FileText className="h-5 w-5" />,
    url: "https://www.bki.de/"
  },
  {
    id: 6,
    title: "Bundesverband Bausoftware (BVBS)",
    description: "Informationen zum standardisierten Austausch von Baudaten",
    icon: <Cog className="h-5 w-5" />,
    url: "https://www.bvbs.de/"
  },
  {
    id: 7,
    title: "DBD-Kostenplaner",
    description: "Datenbank für Baupreise und Ausschreibungstexte",
    icon: <Calculator className="h-5 w-5" />,
    url: "https://www.dbd.de/"
  }
];

// Gewerke für Bauvorhaben
const TRADES = [
  { 
    id: 1,
    name: "Planung und Bauleitung",
    icon: <Construction className="h-5 w-5" />,
    tasks: [
      "Architektenleistung",
      "Statische Planung",
      "Haustechnikplanung",
      "Vermessung",
      "Bauantrag",
      "Bauleitung",
      "Bodengutachten"
    ]
  },
  { 
    id: 2,
    name: "Erdarbeiten und Grundbau",
    icon: <Shovel className="h-5 w-5" />,
    tasks: [
      "Abrissarbeiten",
      "Baugrubenaushub",
      "Erdtransport",
      "Bodenplatte",
      "Drainage und Entwässerung",
      "Abdichtung Keller",
      "Hinterfüllung"
    ]
  },
  { 
    id: 3,
    name: "Rohbau",
    icon: <Building2 className="h-5 w-5" />,
    tasks: [
      "Mauerwerk",
      "Betonarbeiten",
      "Fertigteile",
      "Schornstein",
      "Dachstuhl",
      "Rinne und Fallrohr",
      "Dacheindeckung"
    ]
  },
  { 
    id: 4,
    name: "Innenausbau",
    icon: <Home className="h-5 w-5" />,
    tasks: [
      "Fenster und Außentüren",
      "Innentüren",
      "Estrich",
      "Trockenbau",
      "Fliesenarbeiten",
      "Bodenbeläge",
      "Malerarbeiten",
      "Treppenhaus"
    ]
  },
  { 
    id: 5,
    name: "Sanitär-, Heizungs- und Klimatechnik",
    icon: <Flame className="h-5 w-5" />,
    tasks: [
      "Sanitärinstallation",
      "Heizungsinstallation",
      "Badezimmereinrichtung",
      "Wärmeerzeugung",
      "Solarthermie",
      "Lüftungsanlage",
      "Klimaanlage"
    ]
  },
  { 
    id: 6,
    name: "Elektroinstallation",
    icon: <CircuitBoard className="h-5 w-5" />,
    tasks: [
      "Elektroinstallation",
      "Beleuchtungsinstallation",
      "Photovoltaikanlage",
      "Smarthome-Technik",
      "Netzwerk und Internet",
      "Telefonanlage",
      "Alarmanlage"
    ]
  },
  { 
    id: 7,
    name: "Fassadenarbeiten",
    icon: <Paintbrush className="h-5 w-5" />,
    tasks: [
      "Wärmedämmung",
      "Fassadenverkleidung",
      "Putzarbeiten",
      "Fassadenanstrich",
      "Balkone und Terrassen",
      "Außenfensterbänke"
    ]
  },
  { 
    id: 8,
    name: "Außenanlagen",
    icon: <LeafyGreen className="h-5 w-5" />,
    tasks: [
      "Pflasterarbeiten",
      "Gartengestaltung",
      "Zaunbau",
      "Carport/Garage",
      "Müllplatz",
      "Entwässerung Grundstück",
      "Erschließung" 
    ]
  }
];

// Kostengruppen nach DIN 276
const COST_GROUPS = [
  { 
    id: 100, 
    name: "Grundstück",
    description: "Kosten im Zusammenhang mit dem Grundstück",
    subgroups: [
      { id: 110, name: "Grundstückswert" },
      { id: 120, name: "Grundstücksnebenkosten" },
      { id: 130, name: "Freimachen" },
    ]
  },
  { 
    id: 200, 
    name: "Vorbereitende Maßnahmen",
    description: "Kosten für die Vorbereitung des Baugrundstücks",
    subgroups: [
      { id: 210, name: "Herrichten" },
      { id: 220, name: "Öffentliche Erschließung" },
      { id: 230, name: "Nichtöffentliche Erschließung" },
      { id: 240, name: "Ausgleichsabgaben" },
      { id: 250, name: "Übergangsmaßnahmen" },
    ]
  },
  { 
    id: 300, 
    name: "Bauwerk - Baukonstruktionen",
    description: "Kosten für alle baulichen Anlagen und Baukonstruktionen",
    subgroups: [
      { id: 310, name: "Baugrube" },
      { id: 320, name: "Gründung, Unterbau" },
      { id: 330, name: "Außenwände" },
      { id: 340, name: "Innenwände" },
      { id: 350, name: "Decken" },
      { id: 360, name: "Dächer" },
      { id: 370, name: "Baukonstruktive Einbauten" },
      { id: 390, name: "Sonstige Maßnahmen für Baukonstruktionen" },
    ]
  },
  { 
    id: 400, 
    name: "Bauwerk - Technische Anlagen",
    description: "Kosten für technische Anlagen und Einrichtungen",
    subgroups: [
      { id: 410, name: "Abwasser-, Wasser-, Gasanlagen" },
      { id: 420, name: "Wärmeversorgungsanlagen" },
      { id: 430, name: "Lufttechnische Anlagen" },
      { id: 440, name: "Starkstromanlagen" },
      { id: 450, name: "Fernmelde- und informationstechnische Anlagen" },
      { id: 460, name: "Förderanlagen" },
      { id: 470, name: "Nutzungsspezifische Anlagen" },
      { id: 480, name: "Gebäudeautomation" },
      { id: 490, name: "Sonstige Maßnahmen für technische Anlagen" },
    ]
  },
  { 
    id: 500, 
    name: "Außenanlagen und Freiflächen",
    description: "Kosten für die Gestaltung der Außenanlagen",
    subgroups: [
      { id: 510, name: "Geländeflächen" },
      { id: 520, name: "Befestigte Flächen" },
      { id: 530, name: "Baukonstruktionen in Außenanlagen" },
      { id: 540, name: "Technische Anlagen in Außenanlagen" },
      { id: 550, name: "Einbauten in Außenanlagen" },
      { id: 560, name: "Wasserflächen" },
      { id: 570, name: "Pflanz- und Saatflächen" },
      { id: 590, name: "Sonstige Außenanlagen" },
    ]
  },
  { 
    id: 600, 
    name: "Ausstattung und Kunstwerke",
    description: "Kosten für bewegliche Einrichtungen und Kunstwerke",
    subgroups: [
      { id: 610, name: "Ausstattung" },
      { id: 620, name: "Kunstwerke" },
    ]
  },
  { 
    id: 700, 
    name: "Baunebenkosten",
    description: "Kosten für Planung, Vergabe und Projektleitung",
    subgroups: [
      { id: 710, name: "Bauherrenaufgaben" },
      { id: 720, name: "Vorbereitung der Objektplanung" },
      { id: 730, name: "Architekten- und Ingenieurleistungen" },
      { id: 740, name: "Gutachten und Beratung" },
      { id: 750, name: "Kunst" },
      { id: 760, name: "Finanzierung" },
      { id: 770, name: "Allgemeine Baunebenkosten" },
      { id: 790, name: "Sonstige Baunebenkosten" },
    ]
  },
  { 
    id: 800, 
    name: "Finanzierung",
    description: "Kosten für die Finanzierung des Vorhabens",
    subgroups: [
      { id: 810, name: "Finanzierungsmittel" },
      { id: 820, name: "Finanzierungskosten" },
    ]
  },
];

export function CostGroups({ projectId }: CostGroupsProps) {
  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader className="bg-[#5c9935] text-white">
          <CardTitle className="text-xl">Kostengruppen nach DIN 276</CardTitle>
          <CardDescription className="text-white/90">
            Standardisierte Kostenstruktur für Hochbauprojekte
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="overview" className="w-full">
            <div className="px-6 pt-4 pb-2 border-b">
              <TabsList>
                <TabsTrigger value="overview">Übersicht</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="trades">Gewerke</TabsTrigger>
                <TabsTrigger value="resources">Leistungsverzeichnisse</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="overview" className="p-0">
              <div className="divide-y divide-gray-200">
                {COST_GROUPS.map((group, index) => (
                  <div 
                    key={group.id}
                    className={`flex items-center px-6 py-4 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                  >
                    <span className="font-medium text-lg w-20">{group.id}</span>
                    <div className="flex-1">
                      <div className="font-semibold">{group.name}</div>
                      <div className="text-sm text-muted-foreground">{group.description}</div>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoIcon className="h-5 w-5 text-muted-foreground hover:text-primary cursor-pointer" />
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-md">
                          <p className="font-medium">KG {group.id} - {group.name}</p>
                          <p className="text-sm">{group.description}</p>
                          <div className="text-xs mt-1">
                            {group.subgroups.length > 0 && (
                              <>
                                <p className="font-medium mt-1">Untergruppen:</p>
                                <ul className="list-disc list-inside ml-1 mt-1 space-y-0.5">
                                  {group.subgroups.map(subgroup => (
                                    <li key={subgroup.id}>{subgroup.id}: {subgroup.name}</li>
                                  ))}
                                </ul>
                              </>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="details" className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">KG-Nr.</TableHead>
                    <TableHead>Bezeichnung</TableHead>
                    <TableHead>Beschreibung</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {COST_GROUPS.flatMap(group => [
                    <TableRow key={group.id} className="bg-gray-50 font-medium">
                      <TableCell className="font-bold">{group.id}</TableCell>
                      <TableCell className="font-bold">{group.name}</TableCell>
                      <TableCell>{group.description}</TableCell>
                    </TableRow>,
                    ...group.subgroups.map(subgroup => (
                      <TableRow key={subgroup.id}>
                        <TableCell className="pl-8">{subgroup.id}</TableCell>
                        <TableCell>{subgroup.name}</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    ))
                  ])}
                </TableBody>
              </Table>
            </TabsContent>
            
            <TabsContent value="trades" className="p-0">
              <div className="divide-y divide-gray-200">
                {TRADES.map((trade, index) => (
                  <div key={trade.id} className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                    <div className="px-6 py-4">
                      <div className="flex items-center mb-3">
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-[#5c9935] text-white mr-3">
                          {trade.icon}
                        </div>
                        <h3 className="text-lg font-semibold">{trade.name}</h3>
                      </div>
                      
                      <div className="ml-11 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {trade.tasks.map((task, i) => (
                          <div key={i} className="flex items-center">
                            <div className="h-1.5 w-1.5 rounded-full bg-[#5c9935] mr-2"></div>
                            <span className="text-sm">{task}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="resources" className="p-0">
              <div className="p-6">
                <p className="text-sm text-muted-foreground mb-6">
                  Die folgenden Links führen zu wichtigen Ressourcen für die Erstellung von Leistungsverzeichnissen im Bauwesen.
                  Nutzen Sie diese Quellen, um standardisierte Texte und Kostenkennwerte für Ihre Ausschreibungen zu erhalten.
                </p>
                
                <div className="grid gap-4">
                  {LV_RESOURCES.map((resource) => (
                    <div key={resource.id} className="border rounded-lg p-4 bg-card">
                      <div className="flex items-start">
                        <div className="flex items-center justify-center h-10 w-10 rounded-md bg-[#5c9935] text-white mr-4 shrink-0">
                          {resource.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-medium mb-1">{resource.title}</h3>
                          <p className="text-sm text-muted-foreground mb-3">{resource.description}</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex items-center" 
                            onClick={() => window.open(resource.url, '_blank')}
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Webseite besuchen
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 border rounded-lg bg-muted/30">
                  <h4 className="font-medium mb-2 flex items-center">
                    <InfoIcon className="h-4 w-4 mr-2 text-[#5c9935]" />
                    Hinweis zur Verwendung
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Die oben verlinkten Ressourcen bieten umfangreiche Unterstützung bei der Erstellung standardisierter
                    Leistungsverzeichnisse im deutschen Bauwesen. Die Verwendung dieser Standards spart Zeit,
                    sorgt für rechtliche Sicherheit und erleichtert die Vergleichbarkeit von Angeboten.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Hinweis zur Verwendung</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Diese Kostengruppen nach DIN 276 dienen als Referenz für Hochbauprojekte. Sie bieten eine standardisierte 
            Struktur zur Erfassung und Gliederung von Kosten während des gesamten Projektablaufs, von der frühen 
            Planungsphase bis zur Abrechnung nach Fertigstellung.
          </p>
          <p className="mt-4 text-muted-foreground">
            Verwenden Sie diese Gliederung für Ihre Kostenschätzungen, Kostenberechnungen und die Ausschreibung 
            von Bauleistungen. Durch die einheitliche Struktur wird die Vergleichbarkeit verschiedener Projekte 
            ermöglicht und die Kommunikation zwischen allen Projektbeteiligten vereinfacht.
          </p>
          <p className="mt-4 text-muted-foreground">
            Die aufgeführte Gewerkeliste bietet Ihnen einen Überblick über die verschiedenen Gewerke, die bei 
            Hochbauprojekten typischerweise zum Einsatz kommen. Sie können diese Liste als Grundlage für die 
            Planung und Koordination der verschiedenen Arbeitsbereiche sowie für die Angebotseinholung nutzen.
          </p>
          <p className="mt-4 text-muted-foreground">
            Im Tab "Leistungsverzeichnisse" finden Sie wichtige Links zu Ressourcen für die Erstellung standardisierter 
            Leistungsverzeichnisse nach deutschen Normen. Diese Quellen unterstützen Sie bei der korrekten Formulierung 
            von Ausschreibungstexten und bei der Kostenkalkulation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}