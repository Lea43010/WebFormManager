import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CostGroupsProps {
  projectId: number;
}

// Kostengruppen nach DIN 276
const COST_GROUPS = [
  { id: 100, name: "Kostengruppe Grundstück" },
  { id: 200, name: "Kostengruppe Vorbereitende Maßnahmen (vorher: Herrichten und Erschließen)" },
  { id: 300, name: "Kostengruppe Bauwerk - Baukonstruktionen" },
  { id: 400, name: "Kostengruppe Bauwerk - Technische Anlagen" },
  { id: 500, name: "Kostengruppe Außenanlagen und Freiflächen (vorher: Außenanlagen)" },
  { id: 600, name: "Kostengruppe Ausstattung und Kunstwerke" },
  { id: 700, name: "Kostengruppe Baunebenkosten" },
  { id: 800, name: "Kostengruppe Finanzierung" },
];

export function CostGroups({ projectId }: CostGroupsProps) {
  return (
    <Card className="w-full">
      <CardHeader className="bg-rose-600 text-white">
        <CardTitle className="text-xl">Diese Kostengruppen werden in DIN 276 unterschieden:</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-200">
          {COST_GROUPS.map((group, index) => (
            <div 
              key={group.id}
              className={`flex items-center px-4 py-3 ${index % 2 === 0 ? 'bg-gray-100' : 'bg-gray-50'}`}
            >
              <span className="font-medium w-16">{group.id}</span>
              <span>{group.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}