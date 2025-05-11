import React, { useState, useEffect } from 'react';
import { Search, Wrench, Building, File, FileText, User, Calendar, MapPin, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useLocation } from 'wouter';

interface SearchResult {
  id: string;
  entityType: string;
  title: string;
  description?: string;
  metadata?: {
    projectId?: string;
    [key: string]: any;
  };
}

interface SearchResponse {
  results: SearchResult[];
  total: number;
}

interface UniversalSearchSimpleProps {
  initialQuery?: string;
  onSearch?: (query: string) => void;
}

// Entity-Typ zu Symbol-Mapping für Icons
const entityIcons: Record<string, React.ReactNode> = {
  'project': <Building className="h-5 w-5 text-blue-500" />,
  'attachment': <File className="h-5 w-5 text-green-500" />,
  'synced_document': <FileText className="h-5 w-5 text-emerald-500" />,
  'user': <User className="h-5 w-5 text-amber-500" />,
  'surface_analysis': <MapPin className="h-5 w-5 text-purple-500" />,
  'construction_diary': <Calendar className="h-5 w-5 text-red-500" />,
};

/**
 * Verbesserte Universelle Suchkomponente
 * 
 * Reduzierte Version der Suchkomponente mit den wichtigsten Funktionen
 * für Stabilität und Navigation zu Detailseiten
 */
const UniversalSearchSimple: React.FC<UniversalSearchSimpleProps> = ({ 
  initialQuery = "", 
  onSearch 
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();
  const [_, navigate] = useLocation();

  // Initialen Query-Parameter setzen
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  // Suchanfrage mit React Query
  const { data, isLoading, error } = useQuery<SearchResponse>({
    queryKey: ['search', query, activeTab],
    queryFn: async () => {
      if (query.length < 2) return { results: [], total: 0 };
      
      try {
        const params = new URLSearchParams({
          q: query,
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
    // Optional: Nutzung der onSearch-Callback-Funktion, wenn vorhanden
    if (onSearch) {
      onSearch(query);
    }
  };

  // Navigation zu Detailseiten
  const handleResultClick = (result: SearchResult) => {
    const entityId = result.id;
    
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
          <Wrench className="h-4 w-4 mr-2" />
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

            <TabsContent value={activeTab} className="p-0">
              <div className="p-3">
                {isLoading ? (
                  <div className="flex justify-center items-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2">Suche läuft...</span>
                  </div>
                ) : error ? (
                  <div className="flex justify-center items-center p-8 text-destructive">
                    <Info className="h-6 w-6 mr-2" />
                    <span>Fehler bei der Suche</span>
                  </div>
                ) : data?.results.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    Keine Ergebnisse gefunden für "{query}"
                  </div>
                ) : (
                  <div className="divide-y">
                    {data?.results.map((result) => (
                      <div 
                        key={`${result.entityType}-${result.id}`} 
                        className="py-3 px-2 hover:bg-gray-50 cursor-pointer rounded-md transition-colors"
                        onClick={() => handleResultClick(result)}
                      >
                        <div className="flex items-start">
                          <div className="mr-3 mt-1">
                            {entityIcons[result.entityType] || <Info className="h-5 w-5 text-gray-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <h4 className="text-sm font-medium text-gray-900 truncate">{result.title}</h4>
                              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-800">
                                {result.entityType === 'project' ? 'Projekt' : 
                                 result.entityType === 'attachment' ? 'Dokument' :
                                 result.entityType === 'synced_document' ? 'Sync Doc' :
                                 result.entityType === 'user' ? 'Benutzer' :
                                 result.entityType === 'company' ? 'Firma' :
                                 result.entityType === 'surface_analysis' ? 'Analyse' :
                                 result.entityType === 'construction_diary' ? 'Bautagebuch' :
                                 result.entityType}
                              </span>
                            </div>
                            {result.description && (
                              <p className="mt-1 text-sm text-gray-600 line-clamp-2">{result.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      )}
    </div>
  );
};

export default UniversalSearchSimple;