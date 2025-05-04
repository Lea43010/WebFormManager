import { useState } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Database, 
  Download, 
  Info, 
  FileText, 
  Building2, 
  Users, 
  BarChart3, 
  Map, 
  CalendarDays, 
  BookOpen
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  return (
    <DashboardLayout title="Dashboard" tabs={[]}>
      <div className="flex flex-col gap-3 sm:gap-4">
        
        {/* Hauptbereich - Schnellzugriff auf die wichtigsten Module */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
          {/* Projektekarte */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-md transition-shadow">
            <CardHeader className="p-2 sm:p-3">
              <CardTitle className="text-green-800 text-sm sm:text-base flex items-center gap-1 sm:gap-2">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                <span className="truncate">Projekte</span>
              </CardTitle>
            </CardHeader>
            <CardFooter className="p-2 sm:p-3 pt-0">
              <Button variant="default" className="w-full text-xs sm:text-sm h-8 sm:h-10 bg-green-600 hover:bg-green-700" 
                      onClick={() => navigate("/projects")}>
                Öffnen
              </Button>
            </CardFooter>
          </Card>

          {/* Unternehmenskarte */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-md transition-shadow">
            <CardHeader className="p-2 sm:p-3">
              <CardTitle className="text-blue-800 text-sm sm:text-base flex items-center gap-1 sm:gap-2">
                <Building2 className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                <span className="truncate">Unternehmen</span>
              </CardTitle>
            </CardHeader>
            <CardFooter className="p-2 sm:p-3 pt-0">
              <Button variant="default" className="w-full text-xs sm:text-sm h-8 sm:h-10 bg-blue-600 hover:bg-blue-700" 
                      onClick={() => navigate("/companies")}>
                Öffnen
              </Button>
            </CardFooter>
          </Card>

          {/* Kundenkarte */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-md transition-shadow">
            <CardHeader className="p-2 sm:p-3">
              <CardTitle className="text-purple-800 text-sm sm:text-base flex items-center gap-1 sm:gap-2">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                <span className="truncate">Kunden</span>
              </CardTitle>
            </CardHeader>
            <CardFooter className="p-2 sm:p-3 pt-0">
              <Button variant="default" className="w-full text-xs sm:text-sm h-8 sm:h-10 bg-purple-600 hover:bg-purple-700" 
                      onClick={() => navigate("/customers")}>
                Öffnen
              </Button>
            </CardFooter>
          </Card>

          {/* Tiefbau-Streckenplanung (vorher: Geo-Map) */}
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:shadow-md transition-shadow">
            <CardHeader className="p-2 sm:p-3">
              <CardTitle className="text-yellow-800 text-sm sm:text-base flex items-center gap-1 sm:gap-2">
                <Map className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                <span className="truncate">Tiefbau-Karte</span>
              </CardTitle>
            </CardHeader>
            <CardFooter className="p-2 sm:p-3 pt-0">
              <Button variant="default" className="w-full text-xs sm:text-sm h-8 sm:h-10 bg-yellow-600 hover:bg-yellow-700" 
                      onClick={() => navigate("/tiefbau-map")}>
                Öffnen
              </Button>
            </CardFooter>
          </Card>

          {/* Hilfekarte */}
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-md transition-shadow">
            <CardHeader className="p-2 sm:p-3">
              <CardTitle className="text-red-800 text-sm sm:text-base flex items-center gap-1 sm:gap-2">
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                <span className="truncate">Hilfe & Info</span>
              </CardTitle>
            </CardHeader>
            <CardFooter className="p-2 sm:p-3 pt-0">
              <Button variant="default" className="w-full text-xs sm:text-sm h-8 sm:h-10 bg-red-600 hover:bg-red-700" 
                      onClick={() => navigate("/information")}>
                Öffnen
              </Button>
            </CardFooter>
          </Card>

          {/* Admin-Karte - nur für Administratoren */}
          {user?.role === 'administrator' && (
            <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 hover:shadow-md transition-shadow">
              <CardHeader className="p-2 sm:p-3">
                <CardTitle className="text-slate-800 text-sm sm:text-base flex items-center gap-1 sm:gap-2">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                  <span className="truncate">Admin</span>
                </CardTitle>
              </CardHeader>
              <CardFooter className="p-2 sm:p-3 pt-0">
                <Button variant="default" className="w-full text-xs sm:text-sm h-8 sm:h-10 bg-slate-600 hover:bg-slate-700" 
                      onClick={() => navigate("/admin")}>
                  Öffnen
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
        
        {/* Hinweis für Administratoren, dass die Datenbank-Migration in den Admin-Bereich verschoben wurde */}
        {user?.role === 'administrator' && false && (
          <Card className="mt-2 bg-gray-50 border-gray-200">
            <CardHeader className="py-2 sm:py-3 px-2 sm:px-3">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center">
                <Info className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-blue-500" />
                Hinweis
              </CardTitle>
              <CardDescription className="text-xs">
                Die Datenbank-Migration zu Supabase wurde in den Admin-Bereich verschoben.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
