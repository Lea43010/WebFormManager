import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";
import { InfoIcon } from "lucide-react";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface CostGroupsProps {
  projectId: number;
}

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
        </CardContent>
      </Card>
    </div>
  );
}