import React, { useState, useEffect } from 'react';
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
export const AttachmentImage: React.FC<AttachmentImageProps> = ({
  attachmentId,
  alt,
  className,
  placeholderColor = '#f3f4f6',
  lazyLoad = false,
}) => {
  const [error, setError] = useState<boolean>(false);

  // Bild vom Server laden
  const { data: imageData, isLoading, isError } = useQuery<string>({
    queryKey: [`/api/attachments/${attachmentId}/preview`],
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 Minuten
    enabled: !!attachmentId
  });

  // Bei einem Fehler während des Ladens den Error-State setzen
  useEffect(() => {
    if (isError) {
      setError(true);
    }
  }, [isError]);

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

  if (error || !imageData) {
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

  // Prüfen, ob die Daten bereits das data:-Präfix haben
  const imageStr = imageData as string;
  const src = typeof imageStr === 'string' && imageStr.startsWith('data:') 
    ? imageStr 
    : `data:image/jpeg;base64,${imageStr}`;

  return (
    <img
      src={src}
      alt={alt}
      className={cn('', className)}
      loading={lazyLoad ? 'lazy' : 'eager'}
    />
  );
};

export default AttachmentImage;