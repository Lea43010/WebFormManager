/**
 * Universelle Suchkomponente
 * 
 * Diese Komponente ermöglicht die Suche über verschiedene Entitätstypen hinweg
 * (Projekte, Dokumente, Benutzer, etc.) und stellt die Ergebnisse in einer
 * übersichtlichen, gefilterten Liste dar.
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, File, Building, User, Calendar, FileText, 
  HelpCircle, Map, Tool, Users, Truck 
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "../hooks/use-navigate";

// Entity-Typ zu Symbol-Mapping
const entityTypeIcons: Record<string, React.ReactNode> = {
  'project': <Building className="h-5 w-5 text-blue-500" />,
  'attachment': <File className="h-5 w-5 text-green-500" />,
  'synced_document': <FileText className="h-5 w-5 text-emerald-500" />,
  'user': <User className="h-5 w-5 text-amber-500" />,
  'surface_analysis': <Map className="h-5 w-5 text-purple-500" />,
  'construction_diary': <Calendar className="h-5 w-5 text-red-500" />,
  'company': <Building className="h-5 w-5 text-indigo-500" />,
  'person': <Users className="h-5 w-5 text-pink-500" />,
  'material': <Tool className="h-5 w-5 text-orange-500" />,
  'machine': <Truck className="h-5 w-5 text-cyan-500" />,
};

// Interface für die Such-Ergebnisse
interface SearchResult {
  id: string;
  entityType: string;
  entityId: string;
  title: string;
  snippet: string;
  source: string;
  metadata: any;
  relevance: number;
}

interface SearchResponse {
  results: SearchResult[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

interface UniversalSearchProps {
  initialQuery?: string;
}

const UniversalSearch: React.FC<UniversalSearchProps> = ({ initialQuery = '' }) => {
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Bei Änderung des initialQuery-Parameters den internen Zustand aktualisieren
  useEffect(() => {
    if (initialQuery && initialQuery !== query) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  // Suchanfrage mit TanStack Query
  const { data, isLoading, error } = useQuery<SearchResponse>({
    queryKey: [`/api/search`, query, activeTab, page, pageSize],
    queryFn: async () => {
      if (!query || query.length < 2) return { 
        results: [], 
        pagination: { 
          total: 0, 
          page: 1, 
          pageSize, 
          totalPages: 0 
        } 
      };
      
      try {
        const params = new URLSearchParams({
          q: query,
          page: page.toString(),
          pageSize: pageSize.toString()
        });
        
        if (activeTab !== 'all') {
          params.append('type', activeTab);
        }
        
        const response = await fetch(`/api/search?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error(`Fehler bei der Suche: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unbekannter Fehler bei der Suche';
        toast({
          title: "Suchfehler",
          description: message,
          variant: "destructive"
        });
        throw err;
      }
    },
    enabled: query.length >= 2,
  });
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Die Suche wird automatisch durch den Query-Hook ausgelöst
    // Page zurücksetzen, wenn eine neue Suche durchgeführt wird
    setPage(1);
  };
  
  // Navigation zur Detailseite je nach Entitätstyp
  const navigateToEntity = (result: SearchResult) => {
    const entityId = result.entityId;
    
    switch (result.entityType) {
      case 'project':
        navigate(`/projects/${entityId}`);
        break;
      case 'attachment':
        if (result.metadata?.projectId) {
          navigate(`/projects/${result.metadata.projectId}/attachments/${entityId}`);
        } else {
          navigate(`/attachments/${entityId}`);
        }
        break;
      case 'synced_document':
        if (result.metadata?.projectId) {
          navigate(`/projects/${result.metadata.projectId}/documents/${entityId}`);
        } else {
          navigate(`/documents/${entityId}`);
        }
        break;
      case 'user':
        navigate(`/users/${entityId}`);
        break;
      case 'company':
        navigate(`/companies/${entityId}`);
        break;
      case 'surface_analysis':
        if (result.metadata?.projectId) {
          navigate(`/projects/${result.metadata.projectId}/analyses/${entityId}`);
        } else {
          navigate(`/analyses/${entityId}`);
        }
        break;
      case 'construction_diary':
        if (result.metadata?.projectId) {
          navigate(`/projects/${result.metadata.projectId}/diary/${entityId}`);
        } else {
          navigate(`/diary/${entityId}`);
        }
        break;
      default:
        toast({
          title: "Navigation nicht verfügbar",
          description: `Navigation zu ${result.entityType} wird noch nicht unterstützt.`,
          variant: "default"
        });
    }
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSearch} className="flex w-full mb-4 gap-2">
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-5 w-5 text-gray-500" />
          <Input
            type="search"
            placeholder="Suche nach Projekten, Dokumenten, Personen..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
            autoComplete="off"
          />
        </div>
        <Button type="submit" className="bg-[#76a730] hover:bg-[#658f28] text-white">
          Suchen
        </Button>
      </form>
      
      {query.length >= 2 && (
        <Card className="shadow-md">
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-5 md:grid-cols-5 lg:grid-cols-5 rounded-b-none mb-1">
              <TabsTrigger value="all">Alle</TabsTrigger>
              <TabsTrigger value="project">Projekte</TabsTrigger>
              <TabsTrigger value="attachment">Dokumente</TabsTrigger>
              <TabsTrigger value="synced_document">Sync Docs</TabsTrigger>
              <TabsTrigger value="construction_diary">Bautagebuch</TabsTrigger>
            </TabsList>
            
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-[#76a730]" />
                </div>
              ) : error ? (
                <div className="text-center text-red-500 p-8">
                  Bei der Suche ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.
                </div>
              ) : !data || data.results.length === 0 ? (
                <div className="text-center text-gray-500 p-8 flex flex-col items-center gap-3">
                  <HelpCircle className="h-12 w-12 text-gray-400" />
                  <p className="font-medium">Keine Ergebnisse gefunden.</p>
                  <p className="text-sm">Versuchen Sie andere Suchbegriffe oder Filter.</p>
                </div>
              ) : (
                <>
                  <ul className="space-y-4 divide-y divide-gray-100">
                    {data.results.map((result) => (
                      <li 
                        key={`${result.entityType}-${result.entityId}`} 
                        className="pt-4 pb-2 cursor-pointer hover:bg-gray-50 px-3 rounded-md transition-colors"
                        onClick={() => navigateToEntity(result)}
                      >
                        <div className="flex items-start">
                          <div className="mr-3 mt-1">
                            {entityTypeIcons[result.entityType] || <HelpCircle className="h-5 w-5 text-gray-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 truncate">{result.title}</h3>
                            <div 
                              className="text-sm text-gray-700 mt-1" 
                              dangerouslySetInnerHTML={{ __html: result.snippet || 'Keine Vorschau verfügbar' }} 
                            />
                            <div className="mt-1 flex items-center text-xs text-gray-500">
                              <span className="capitalize">
                                {result.entityType === 'project' ? 'Projekt' : 
                                 result.entityType === 'attachment' ? 'Dokument' :
                                 result.entityType === 'synced_document' ? 'Sync. Dokument' :
                                 result.entityType === 'user' ? 'Benutzer' :
                                 result.entityType === 'company' ? 'Unternehmen' :
                                 result.entityType === 'surface_analysis' ? 'Oberflächenanalyse' :
                                 result.entityType === 'construction_diary' ? 'Bautagebuch' :
                                 result.entityType}
                              </span>
                              {result.metadata?.projectId && (
                                <>
                                  <span className="mx-1">•</span>
                                  <span>Projekt-ID: {result.metadata.projectId}</span>
                                </>
                              )}
                              {result.source && (
                                <>
                                  <span className="mx-1">•</span>
                                  <span>{result.source}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                  
                  {data.pagination && data.pagination.total > 0 && (
                    <div className="mt-6 flex justify-between items-center text-sm text-gray-500">
                      <span>
                        {data.pagination.total} Ergebnisse gefunden
                        {data.pagination.totalPages > 1 && ` • Seite ${data.pagination.page} von ${data.pagination.totalPages}`}
                      </span>
                      {data.pagination.totalPages > 1 && (
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={data.pagination.page === 1}
                            onClick={() => setPage(Math.max(1, page - 1))}
                          >
                            Zurück
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={data.pagination.page === data.pagination.totalPages}
                            onClick={() => setPage(Math.min(data.pagination.totalPages, page + 1))}
                          >
                            Weiter
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Tabs>
        </Card>
      )}
    </div>
  );
};

export default UniversalSearch;