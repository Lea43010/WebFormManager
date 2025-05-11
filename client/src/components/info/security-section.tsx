import React from 'react';
import { SecurityInfoPage } from './security-info-page';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Info, FileText, FileCheck } from 'lucide-react';

export function SecuritySection() {
  return (
    <div id="datensicherheit" className="scroll-mt-4 bg-white p-8 rounded-lg shadow-sm">
      <h2 className="text-2xl font-semibold mb-6 border-b pb-2">Datenschutz & Sicherheit</h2>
      <p className="text-gray-600 mb-6 leading-relaxed">
        Die Bau - Structura App setzt höchste Standards für Datenschutz und Sicherheit ein, um den Schutz Ihrer 
        Daten gemäß der Datenschutz-Grundverordnung (DSGVO) zu gewährleisten. Diese Seite bietet Ihnen einen 
        Überblick über unsere Sicherheitsmaßnahmen.
      </p>
      
      <SecurityInfoPage />
      
      <div className="mt-6">
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">Hinweis zum Produktionseinsatz</AlertTitle>
          <AlertDescription className="text-blue-700">
            Im Produktionseinsatz wird die gesamte Kommunikation mit dem Server über eine 
            SSL/TLS-verschlüsselte Verbindung (HTTPS) abgewickelt. Die aktuelle Entwicklungsumgebung 
            verwendet möglicherweise unverschlüsselte Verbindungen.
          </AlertDescription>
        </Alert>
      </div>
      
      <div className="mt-6 flex flex-col md:flex-row gap-4">
        <Button variant="outline" className="gap-2 border-[#6a961f] text-[#6a961f] hover:bg-[#6a961f]/10">
          <FileText className="h-4 w-4" />
          Datenschutzerklärung ansehen
        </Button>
        
        <Button variant="outline" className="gap-2 border-[#6a961f] text-[#6a961f] hover:bg-[#6a961f]/10">
          <FileCheck className="h-4 w-4" />
          Informationen zu Cookie-Einstellungen
        </Button>
      </div>
    </div>
  );
}