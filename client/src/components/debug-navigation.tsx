import React from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bug, Database, BookOpen, FileText, LayoutDashboard, Json, FileJson, FileHtml } from "lucide-react";

const DebugNavigation: React.FC = () => {
  return (
    <Card className="mb-6 border-dashed border-yellow-500 bg-yellow-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <Bug className="h-5 w-5 text-yellow-600 mr-2" />
            <h3 className="text-sm font-medium text-yellow-800">Debug-Navigation</h3>
          </div>
          <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">Nur für Entwicklungszwecke</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <Link href="/dashboard">
            <Button variant="ghost" className="flex items-center justify-start w-full">
              <LayoutDashboard className="h-4 w-4 mr-2 text-gray-500" />
              <span>Dashboard</span>
            </Button>
          </Link>
          
          {/* Direkte Links ohne wouter, damit die Server-Rendering korrekt funktioniert */}
          <a href="/db-structure-quality-debug" className="no-underline">
            <Button variant="ghost" className="flex items-center justify-start w-full">
              <Database className="h-4 w-4 mr-2 text-gray-500" />
              <span>Datenbankstruktur-Qualitätsprüfung</span>
            </Button>
          </a>
          
          <a href="/construction-diary-debug" className="no-underline">
            <Button variant="ghost" className="flex items-center justify-start w-full">
              <FileText className="h-4 w-4 mr-2 text-gray-500" />
              <span>Bautagebuch-Debug</span>
            </Button>
          </a>
          
          <Link href="/data-quality">
            <Button variant="ghost" className="flex items-center justify-start w-full">
              <BookOpen className="h-4 w-4 mr-2 text-gray-500" />
              <span>Datenqualität</span>
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default DebugNavigation;