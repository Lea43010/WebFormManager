import React from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Bug, Database, BookOpen, FileText, LayoutDashboard } from "lucide-react";

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
            <a className="flex items-center p-2 hover:bg-yellow-100 rounded-md">
              <LayoutDashboard className="h-4 w-4 mr-2 text-gray-500" />
              <span>Dashboard</span>
            </a>
          </Link>
          
          <Link href="/db-structure-quality-debug">
            <a className="flex items-center p-2 hover:bg-yellow-100 rounded-md">
              <Database className="h-4 w-4 mr-2 text-gray-500" />
              <span>Datenbankstruktur-Qualitätsprüfung</span>
            </a>
          </Link>
          
          <Link href="/construction-diary-debug">
            <a className="flex items-center p-2 hover:bg-yellow-100 rounded-md">
              <FileText className="h-4 w-4 mr-2 text-gray-500" />
              <span>Bautagebuch-Debug</span>
            </a>
          </Link>
          
          <Link href="/data-quality">
            <a className="flex items-center p-2 hover:bg-yellow-100 rounded-md">
              <BookOpen className="h-4 w-4 mr-2 text-gray-500" />
              <span>Datenqualität</span>
            </a>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default DebugNavigation;