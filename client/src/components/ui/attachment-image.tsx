import React from 'react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

interface AttachmentImageProps {
  attachmentId: number;
  alt: string;
  className?: string;
  placeholderColor?: string;
  lazyLoad?: boolean;
}

/**
 * AttachmentImage-Komponente
 * 
 * Lädt ein Bild basierend auf einer Attachment-ID vom Server und zeigt es an.
 * 
 * @param attachmentId - Die ID des Anhangs, der das Bild enthält
 * @param alt - Alternativer Text für das Bild
 * @param className - CSS-Klassen
 * @param placeholderColor - Farbe des Platzhalters während des Ladens
 * @param lazyLoad - Ob das Bild lazy geladen werden soll
 */
const AttachmentImage = ({
  attachmentId,
  alt,
  className,
  placeholderColor = '#f3f4f6',
  lazyLoad = false,
}: AttachmentImageProps) => {
  // Bild vom Server laden - keine bedingten Hooks mehr verwenden
  const { data, isLoading, isError } = useQuery({
    queryKey: [`/api/attachments/${attachmentId}/preview`],
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 Minuten
    // Keine bedingten enable-Flags mehr
  });

  // Lade-Status anzeigen
  if (isLoading) {
    return (
      <div 
        className={cn(
          'flex items-center justify-center', 
          className
        )}
        style={{ backgroundColor: placeholderColor }}
      >
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  // Fehlerfall
  if (isError || !data) {
    return (
      <div 
        className={cn(
          'flex items-center justify-center text-xs text-gray-500', 
          className
        )}
        style={{ backgroundColor: placeholderColor }}
      >
        Bild konnte nicht geladen werden
      </div>
    );
  }

  // Erfolgsfall - Bild darstellen
  const imageStr = data as string;
  const src = typeof imageStr === 'string' && imageStr.startsWith('data:') 
    ? imageStr 
    : `data:image/jpeg;base64,${imageStr}`;

  return (
    <img
      src={src}
      alt={alt}
      className={className || ''}
      loading={lazyLoad ? 'lazy' : 'eager'}
    />
  );
};

export default AttachmentImage;