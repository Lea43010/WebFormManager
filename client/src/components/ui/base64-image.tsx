import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Base64ImageProps {
  attachmentId: number;
  alt: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  placeholderColor?: string;
  lazyLoad?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Base64Image Komponente
 * 
 * Eine spezialisierte Bildkomponente für Base64-kodierte Bilder:
 * - Lädt Bilder über die /secure-image/:id API
 * - Verarbeitet Base64-kodierte Bilder für maximale Sicherheit
 * - Bietet Fehlerbehandlung und Ladeindikator
 */
export const Base64Image: React.FC<Base64ImageProps> = ({
  attachmentId,
  alt,
  className,
  width,
  height,
  placeholderColor = "#f3f4f6",
  lazyLoad = true,
  onLoad,
  onError,
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageData, setImageData] = useState<{
    base64Data: string;
    contentType: string;
  } | null>(null);

  // Bild-Daten laden
  useEffect(() => {
    let mounted = true;
    
    const fetchImage = async () => {
      try {
        const response = await fetch(`/secure-image/${attachmentId}`);
        
        if (!response.ok) {
          throw new Error("Fehler beim Laden des Bildes");
        }
        
        const data = await response.json();
        
        if (mounted) {
          setImageData(data);
          setIsLoading(false);
          onLoad?.();
        }
      } catch (error) {
        console.error("Fehler beim Laden des Bildes:", error);
        if (mounted) {
          setHasError(true);
          setIsLoading(false);
          onError?.();
          
          toast({
            title: "Bildladefehler",
            description: "Das Bild konnte nicht geladen werden.",
            variant: "destructive",
          });
        }
      }
    };

    if (lazyLoad) {
      // Einfache Lazy-Loading-Implementierung mit IntersectionObserver
      const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          fetchImage();
          observer.disconnect();
        }
      });
      
      const element = document.getElementById(`base64-image-${attachmentId}`);
      if (element) {
        observer.observe(element);
      }
      
      return () => {
        mounted = false;
        observer.disconnect();
      };
    } else {
      fetchImage();
      return () => {
        mounted = false;
      };
    }
  }, [attachmentId, lazyLoad, onLoad, onError, toast]);

  // Stil-Klassen basierend auf dem Zustand
  const imageClasses = cn(
    'transition-opacity duration-300',
    isLoading ? 'opacity-0' : 'opacity-100',
    className
  );

  // Fallback bei Ladefehlern
  if (hasError) {
    return (
      <div 
        className={cn(
          'flex items-center justify-center bg-gray-100 text-gray-400 text-xs', 
          className
        )}
        style={{ width, height, backgroundColor: placeholderColor }}
      >
        Bild konnte nicht geladen werden
      </div>
    );
  }

  return (
    <div
      id={`base64-image-${attachmentId}`}
      className="relative overflow-hidden"
      style={{ 
        width, 
        height, 
        backgroundColor: placeholderColor,
      }}
    >
      {/* Bild-Element */}
      {imageData && (
        <img
          src={`data:${imageData.contentType};base64,${imageData.base64Data}`}
          alt={alt}
          className={imageClasses}
          width={typeof width === 'number' ? width : undefined}
          height={typeof height === 'number' ? height : undefined}
          loading={lazyLoad ? "lazy" : "eager"}
        />
      )}
      
      {/* Ladeindikator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-50">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-primary rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default Base64Image;