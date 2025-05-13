import React, { useState } from 'react';
import { Loader2, FileImage } from 'lucide-react';

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
 * Diese Version verwendet keine React-Query Hooks mehr, um Fehler zu vermeiden.
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
  className = '',
  placeholderColor = '#f3f4f6',
  lazyLoad = false,
}: AttachmentImageProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  const handleLoad = () => {
    setIsLoading(false);
  };
  
  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };
  
  const src = `/api/attachments/${attachmentId}/preview`;
  
  if (hasError) {
    return (
      <div 
        className={`flex items-center justify-center text-xs text-gray-500 ${className}`}
        style={{ backgroundColor: placeholderColor }}
      >
        <FileImage className="w-8 h-8 text-gray-400 mr-2" />
        <span>Bild konnte nicht geladen werden</span>
      </div>
    );
  }
  
  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div 
          className={`absolute inset-0 flex items-center justify-center`}
          style={{ backgroundColor: placeholderColor }}
        >
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${isLoading ? 'invisible' : 'visible'}`}
        onLoad={handleLoad}
        onError={handleError}
        loading={lazyLoad ? 'lazy' : 'eager'}
      />
    </div>
  );
};

export default AttachmentImage;