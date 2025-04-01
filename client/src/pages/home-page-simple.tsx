import React, { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Search } from "lucide-react";

export default function HomePageSimple() {
  const [, navigate] = useLocation();

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">DB Manager Dashboard</h1>
      
      <Card id="eingabeformular" className="border-4 border-primary shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/20 to-primary/5">
          <CardTitle className="text-3xl font-bold">Willkommen zum Datenbankmanager!</CardTitle>
          <CardDescription className="text-lg">
            Ihr persönliches Dashboard zur Datenbankverwaltung
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <div className="bg-white p-6 rounded-lg border-2 border-primary/20 shadow-md">
            <h3 className="text-2xl font-bold mb-6 text-primary">Schnellzugriff</h3>
            <div className="grid gap-8 sm:grid-cols-2">
              <div className="space-y-4">
                <Label htmlFor="search" className="text-xl font-medium">Suche</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3.5 h-6 w-6 text-primary" />
                  <Input 
                    id="search" 
                    type="search" 
                    placeholder="Suchen Sie nach Projekten, Kunden, etc." 
                    className="pl-12 h-14 text-lg rounded-lg shadow-sm"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <Label htmlFor="entity" className="text-xl font-medium">Entität auswählen</Label>
                <Select defaultValue="projekt">
                  <SelectTrigger className="h-14 text-lg rounded-lg shadow-sm">
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
            
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Button 
                onClick={() => navigate("/projects")}
                className="w-full sm:w-auto h-14 text-lg bg-primary hover:bg-primary/90 rounded-lg shadow-md"
                size="lg"
              >
                <Plus className="mr-2 h-6 w-6" />
                Neues Projekt
              </Button>
              <Button 
                onClick={() => navigate("/customers")}
                variant="outline"
                className="w-full sm:w-auto h-14 text-lg border-2 rounded-lg shadow-md"
                size="lg"
              >
                <Plus className="mr-2 h-6 w-6" />
                Neuer Kunde
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}