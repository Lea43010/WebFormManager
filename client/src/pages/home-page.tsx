import { useState } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { useAuth } from "@/hooks/use-auth";
import { Building2, Users, Folders, PackageOpen, Plus, Search } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("Übersicht");
  const [, navigate] = useLocation();
  
  const { data: companies, isLoading: isLoadingCompanies } = useQuery({
    queryKey: ["/api/companies"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  const { data: customers, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ["/api/customers"],
    staleTime: 1000 * 60 * 5,
  });
  
  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ["/api/projects"],
    staleTime: 1000 * 60 * 5,
  });
  
  const { data: materials, isLoading: isLoadingMaterials } = useQuery({
    queryKey: ["/api/materials"],
    staleTime: 1000 * 60 * 5,
  });
  
  // Sample data for charts
  const companyTypes = [
    { name: 'Dienstleistung', count: companies?.filter(c => c.companyArt === 'Dienstleistung').length || 3 },
    { name: 'Produktion', count: companies?.filter(c => c.companyArt === 'Produktion').length || 5 },
    { name: 'Handel', count: companies?.filter(c => c.companyArt === 'Handel').length || 2 },
    { name: 'Sonstige', count: companies?.filter(c => c.companyArt === 'Sonstige').length || 1 }
  ];
  
  const projectStatus = [
    { name: 'Aktiv', value: projects?.filter(p => !p.projectStop).length || 8 },
    { name: 'Gestoppt', value: projects?.filter(p => p.projectStop).length || 2 }
  ];
  
  const COLORS = ['#3f51b5', '#757de8', '#002984', '#2196f3', '#ff4081'];
  
  return (
    <DashboardLayout
      title="Dashboard"
      tabs={["Übersicht", "Statistik", "Berichte"]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unternehmen</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingCompanies ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{companies?.length || 0}</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kunden</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingCustomers ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{customers?.length || 0}</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projekte</CardTitle>
            <Folders className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingProjects ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{projects?.length || 0}</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Materialien</CardTitle>
            <PackageOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingMaterials ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{materials?.length || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 mt-4">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Unternehmen nach Art</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={companyTypes}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3f51b5" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Projektstatus</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {projectStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* Willkommenskarte */}
      <Card className="mt-4 border-2 border-primary">
        <CardHeader className="bg-muted/50">
          <CardTitle className="text-2xl">Willkommen, {user?.name || user?.username}!</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="mb-6">Dies ist Ihr persönliches Dashboard für die Datenbankverwaltung. Hier können Sie einen Überblick über alle Ihre Daten erhalten.</p>
          
          <div className="bg-primary/5 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4">Schnellzugriff</h3>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="search" className="text-lg">Suche</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input 
                    id="search" 
                    type="search" 
                    placeholder="Suchen Sie nach Projekten, Kunden, etc." 
                    className="pl-9 h-12 text-base"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="entity" className="text-lg">Entität auswählen</Label>
                <Select defaultValue="projekt">
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Wählen Sie eine Entität" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="projekt">Projekt</SelectItem>
                    <SelectItem value="kunde">Kunde</SelectItem>
                    <SelectItem value="unternehmen">Unternehmen</SelectItem>
                    <SelectItem value="material">Material</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Button 
                onClick={() => navigate("/projects")}
                className="w-full sm:w-auto h-12 text-base bg-primary hover:bg-primary/90"
                size="lg"
              >
                <Plus className="mr-2 h-5 w-5" />
                Neues Projekt
              </Button>
              <Button 
                onClick={() => navigate("/customers")}
                variant="outline"
                className="w-full sm:w-auto h-12 text-base border-2"
                size="lg"
              >
                <Plus className="mr-2 h-5 w-5" />
                Neuer Kunde
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
