import React from 'react';
import { 
  AdminOnly, 
  ManagerOrAbove, 
  PermissionGate 
} from '@/components/ui/permission-gate';
import { usePermission } from '@/hooks/use-permission';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  UserCog,
  Building,
  CheckCircle,
  XCircle,
  Download,
  Upload,
  Edit,
  Trash,
  FilePlus
} from 'lucide-react';

/**
 * Beispiele für die Verwendung des rollenbasierten Berechtigungssystems in UI-Komponenten
 */
export function RoleBasedPermissionExample() {
  const { isAdmin, isManagerOrAbove } = usePermission();
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Rollenbasierte Berechtigungsbeispiele</CardTitle>
          <CardDescription>
            Diese Beispiele zeigen, wie Benutzeroberflächen basierend auf Benutzerrollen angepasst werden können.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Beispiel 1: Bedingte Rendering mit Hooks */}
          <div className="p-4 border rounded-md">
            <h3 className="text-lg font-semibold mb-2">1. Bedingte Rendering mit Hooks</h3>
            <div className="flex flex-wrap gap-2">
              <Button>Für alle Benutzer sichtbar</Button>
              
              {isManagerOrAbove() && (
                <Button variant="outline">Nur für Manager und Administratoren</Button>
              )}
              
              {isAdmin() && (
                <Button variant="destructive">Nur für Administratoren</Button>
              )}
            </div>
          </div>
          
          {/* Beispiel 2: Komponenten mit PermissionGate */}
          <div className="p-4 border rounded-md">
            <h3 className="text-lg font-semibold mb-2">2. Komponenten mit PermissionGate</h3>
            <div className="space-y-2">
              <PermissionGate 
                requiredRole="user" 
                fallback={<Badge variant="outline" className="bg-red-50">Nicht angemeldet</Badge>}
              >
                <Badge>Basisbenutzer-Informationen</Badge>
              </PermissionGate>
              
              <PermissionGate 
                requiredRole={['manager', 'administrator']} 
                fallback={<Badge variant="outline" className="bg-gray-100">Nur für Manager und höher</Badge>}
              >
                <Badge variant="secondary">Management-Informationen</Badge>
              </PermissionGate>
              
              <PermissionGate 
                requiredRole="administrator" 
                fallback={<Badge variant="outline" className="bg-gray-100">Nur für Administratoren</Badge>}
              >
                <Badge variant="destructive">Administrator-Informationen</Badge>
              </PermissionGate>
            </div>
          </div>
          
          {/* Beispiel 3: Vereinfachte Komponenten */}
          <div className="p-4 border rounded-md">
            <h3 className="text-lg font-semibold mb-2">3. Vereinfachte Komponenten</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CheckCircle className="text-green-500" size={16} />
                <span>Für alle Benutzer verfügbar</span>
              </div>
              
              <ManagerOrAbove fallback={
                <div className="flex items-center space-x-2 text-gray-400">
                  <XCircle size={16} />
                  <span>Nur für Manager und Administratoren (ausgeblendet)</span>
                </div>
              }>
                <div className="flex items-center space-x-2">
                  <UserCog className="text-blue-500" size={16} />
                  <span>Für Manager und Administratoren verfügbar</span>
                </div>
              </ManagerOrAbove>
              
              <AdminOnly fallback={
                <div className="flex items-center space-x-2 text-gray-400">
                  <XCircle size={16} />
                  <span>Nur für Administratoren (ausgeblendet)</span>
                </div>
              }>
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="text-amber-500" size={16} />
                  <span>Nur für Administratoren verfügbar</span>
                </div>
              </AdminOnly>
            </div>
          </div>
          
          {/* Beispiel 4: Tabelle mit rollenbasierten Aktionen */}
          <div className="p-4 border rounded-md">
            <h3 className="text-lg font-semibold mb-2">4. Tabelle mit rollenbasierten Aktionen</h3>
            <Table>
              <TableCaption>Beispiel für rollenbasierte Aktionen in einer Tabelle</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Projekt Alpha</TableCell>
                  <TableCell><Building size={16} className="inline mr-1" /> Tiefbau</TableCell>
                  <TableCell><Badge variant="outline" className="bg-green-50">Aktiv</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon"><Download size={16} /></Button>
                      
                      {/* Manager und Administratoren können bearbeiten */}
                      <ManagerOrAbove>
                        <Button variant="outline" size="icon"><Edit size={16} /></Button>
                      </ManagerOrAbove>
                      
                      {/* Nur Administratoren können löschen */}
                      <AdminOnly>
                        <Button variant="outline" size="icon" className="text-red-500"><Trash size={16} /></Button>
                      </AdminOnly>
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Straßenbauprojekt Beta</TableCell>
                  <TableCell><Building size={16} className="inline mr-1" /> Straßenbau</TableCell>
                  <TableCell><Badge variant="outline" className="bg-amber-50">Geplant</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon"><Download size={16} /></Button>
                      
                      {/* Manager und Administratoren können bearbeiten */}
                      <ManagerOrAbove>
                        <Button variant="outline" size="icon"><Edit size={16} /></Button>
                      </ManagerOrAbove>
                      
                      {/* Nur Administratoren können löschen */}
                      <AdminOnly>
                        <Button variant="outline" size="icon" className="text-red-500"><Trash size={16} /></Button>
                      </AdminOnly>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          
          {/* Beispiel 5: Formular mit rollenbasierten Feldern */}
          <div className="p-4 border rounded-md">
            <h3 className="text-lg font-semibold mb-2">5. Aktionsknöpfe mit Berechtigungen</h3>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="gap-1">
                <Download size={16} /> Herunterladen
              </Button>
              
              <Button variant="outline" className="gap-1">
                <Upload size={16} /> Hochladen
              </Button>
              
              <ManagerOrAbove>
                <Button className="gap-1 bg-blue-600 hover:bg-blue-700">
                  <FilePlus size={16} /> Neu erstellen
                </Button>
              </ManagerOrAbove>
              
              <AdminOnly>
                <Button variant="destructive" className="gap-1">
                  <Trash size={16} /> Alle löschen
                </Button>
              </AdminOnly>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}