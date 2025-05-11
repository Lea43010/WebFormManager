import React, { useState } from 'react';
import { Search, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface UniversalSearchSimpleProps {
  initialQuery?: string;
  onSearch?: (query: string) => void;
}

/**
 * Vereinfachte Universelle Suchkomponente
 * 
 * Reduzierte Version der Suchkomponente mit minimalen Abhängigkeiten
 * für höhere Stabilität und Leistung.
 */
const UniversalSearchSimple: React.FC<UniversalSearchSimpleProps> = ({ 
  initialQuery = "", 
  onSearch 
}) => {
  const [query, setQuery] = useState(initialQuery);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(query);
    } else {
      // Standard-Verhalten, wenn keine onSearch-Funktion übergeben wurde
      console.log("Suche nach:", query);
      // Optional: Hier könnte eine Navigation zur Suchseite erfolgen
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
    </div>
  );
};

export default UniversalSearchSimple;