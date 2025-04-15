import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Attachment, FileOrganizationSuggestion } from "@shared/schema";

type SuggestionWithFiles = FileOrganizationSuggestion & {
  files: Attachment[];
};

interface FileOrganizationSuggestionsProps {
  projectId: number;
}

export function FileOrganizationSuggestions({ projectId }: FileOrganizationSuggestionsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFiles, setSelectedFiles] = useState<number[]>([]);

  // Lade alle Vorschläge für das Projekt
  const { data: suggestions, isLoading, isError } = useQuery<SuggestionWithFiles[]>({
    queryKey: ['/api/file-organization/suggestions', projectId],
    queryFn: async () => {
      const response = await fetch(`/api/file-organization/suggestions/${projectId}`);
      if (!response.ok) {
        throw new Error("Fehler beim Laden der Vorschläge");
      }
      return response.json();
    },
    enabled: !!projectId,
  });

  // Erstelle Vorschläge-Mutation
  const createSuggestionsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/file-organization/suggestions/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId }),
      });
      
      if (!response.ok) {
        throw new Error("Fehler beim Erstellen der Vorschläge");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/file-organization/suggestions', projectId] });
      toast({
        title: "Vorschläge erstellt",
        description: "Die Vorschläge wurden erfolgreich erstellt.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Fehler beim Erstellen der Vorschläge: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Anwenden von Vorschlägen
  const applySuggestionMutation = useMutation({
    mutationFn: async (suggestionId: number) => {
      const response = await fetch('/api/file-organization/suggestions/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ suggestionId }),
      });
      
      if (!response.ok) {
        throw new Error("Fehler beim Anwenden des Vorschlags");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/file-organization/suggestions', projectId] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'attachments'] });
      toast({
        title: "Vorschlag angewendet",
        description: "Der Vorschlag wurde erfolgreich angewendet.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Fehler beim Anwenden des Vorschlags: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Analysieren ausgewählter Dateien
  const analyzeSelectedMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/file-organization/analyze-group', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          projectId,
          fileIds: selectedFiles 
        }),
      });
      
      if (!response.ok) {
        throw new Error("Fehler bei der Analyse der ausgewählten Dateien");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/file-organization/suggestions', projectId] });
      setSelectedFiles([]);
      toast({
        title: "Analyse abgeschlossen",
        description: "Die ausgewählten Dateien wurden analysiert und ein Vorschlag erstellt.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Fehler bei der Analyse: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Rendere das UI basierend auf dem Status
  if (isLoading) {
    return <div className="p-4">Lade Vorschläge...</div>;
  }

  if (isError) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Fehler</AlertTitle>
        <AlertDescription>
          Beim Laden der Vorschläge ist ein Fehler aufgetreten.
        </AlertDescription>
      </Alert>
    );
  }

  // Filtere angewendete und nicht angewendete Vorschläge
  const pendingSuggestions = suggestions?.filter(s => !s.isApplied) || [];
  const appliedSuggestions = suggestions?.filter(s => s.isApplied) || [];

  return (
    <div className="space-y-4 pb-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold mb-4">Smart File Organization</h2>
        <Button 
          onClick={() => createSuggestionsMutation.mutate()}
          disabled={createSuggestionsMutation.isPending}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Vorschläge generieren
        </Button>
      </div>

      {pendingSuggestions.length === 0 && (
        <Alert className="mb-4 bg-muted">
          <AlertTitle>Keine Vorschläge vorhanden</AlertTitle>
          <AlertDescription>
            Es wurden noch keine Vorschläge für die Dateiorganisation erstellt oder alle Vorschläge wurden bereits angewendet.
          </AlertDescription>
        </Alert>
      )}

      {/* Ausstehende Vorschläge */}
      {pendingSuggestions.length > 0 && (
        <>
          <h3 className="text-xl font-semibold mt-4">Ausstehende Vorschläge</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {pendingSuggestions.map((suggestion) => (
              <Card key={suggestion.id} className="overflow-hidden">
                <CardHeader className="bg-muted">
                  <CardTitle>
                    <div className="flex items-center">
                      <span>Vorschlag: {suggestion.suggestedCategory}</span>
                      <Badge className="ml-2" variant="outline">
                        {suggestion.confidence ? Math.round(suggestion.confidence * 100) : 0}% Sicherheit
                      </Badge>
                    </div>
                  </CardTitle>
                  <CardDescription>{suggestion.reason}</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <h4 className="font-medium mb-2">Dateien ({suggestion.files.length})</h4>
                  <ul className="list-disc pl-6 text-sm text-muted-foreground max-h-32 overflow-y-auto mb-2">
                    {suggestion.files.map((file) => (
                      <li key={file.id}>{file.originalName}</li>
                    ))}
                  </ul>
                  
                  <h4 className="font-medium mb-2 mt-4">Vorgeschlagene Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {suggestion.suggestedTags?.split(',').map((tag, index) => (
                      <Badge key={index} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/50 flex justify-end">
                  <Button
                    onClick={() => applySuggestionMutation.mutate(suggestion.id)}
                    disabled={applySuggestionMutation.isPending}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Vorschlag anwenden
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Angewendete Vorschläge */}
      {appliedSuggestions.length > 0 && (
        <>
          <h3 className="text-xl font-semibold mt-6">Angewendete Vorschläge</h3>
          <div className="grid gap-4 md:grid-cols-2 opacity-70">
            {appliedSuggestions.map((suggestion) => (
              <Card key={suggestion.id} className="overflow-hidden">
                <CardHeader>
                  <CardTitle>
                    <div className="flex items-center">
                      <span>Angewendet: {suggestion.suggestedCategory}</span>
                      <Badge className="ml-2" variant="outline">
                        {suggestion.confidence ? Math.round(suggestion.confidence * 100) : 0}% Sicherheit
                      </Badge>
                    </div>
                  </CardTitle>
                  <CardDescription>{suggestion.reason}</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <h4 className="font-medium mb-2">Dateien ({suggestion.files.length})</h4>
                  <ul className="list-disc pl-6 text-sm text-muted-foreground">
                    {suggestion.files.slice(0, 3).map((file) => (
                      <li key={file.id}>{file.originalName}</li>
                    ))}
                    {suggestion.files.length > 3 && (
                      <li className="text-muted">und {suggestion.files.length - 3} weitere...</li>
                    )}
                  </ul>
                  
                  <h4 className="font-medium mb-2 mt-4">Angewendete Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {suggestion.suggestedTags?.split(',').map((tag, index) => (
                      <Badge key={index} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/20 flex justify-end">
                  <Badge variant="outline" className="gap-1">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Angewendet {suggestion.appliedAt ? new Date(suggestion.appliedAt).toLocaleDateString() : ''}
                  </Badge>
                </CardFooter>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}