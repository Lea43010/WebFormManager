import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ResponsiveImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  placeholderColor?: string;
  lowQualitySrc?: string;
  lazyLoad?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  /**
   * Gibt an, ob die Bildquelle einen Token für den Download benötigt.
   * Bei Wert 'true' wird automatisch ein Token angefordert und an die URL angehängt.
   */
  requiresToken?: boolean;
}

/**
 * ResponsiveImage Komponente
 * 
 * Eine verbesserte Bildkomponente mit folgenden Funktionen:
 * - Progressives Laden (LQIP - Low Quality Image Placeholder)
 * - Lazy Loading für bessere Performance
 * - Fehlerbehandlung mit Fallback
 * - Platzhalterelement während des Ladens
 * 
 * @param src - URL des Bildes
 * @param alt - Alternativer Text für das Bild
 * @param className - CSS-Klassen
 * @param width - Breite des Bildes
 * @param height - Höhe des Bildes
 * @param placeholderColor - Hintergrundfarbe während des Ladens
 * @param lowQualitySrc - Niedrig aufgelöste Version des Bildes für schnelleres Laden
 * @param lazyLoad - Ob das Bild erst geladen werden soll, wenn es sichtbar ist
 * @param onLoad - Callback, der aufgerufen wird, wenn das Bild geladen wurde
 * @param onError - Callback, der bei Ladefehler aufgerufen wird
 */
export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  className,
  width,
  height,
  placeholderColor = "#f3f4f6",
  lowQualitySrc,
  lazyLoad = true,
  onLoad,
  onError,
  requiresToken = false
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>(lowQualitySrc || '');
  const [tokenizedSrc, setTokenizedSrc] = useState<string>(src);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Wenn Token benötigt wird, eines vom Server anfordern
  useEffect(() => {
    const fetchToken = async () => {
      if (!requiresToken || !src.includes('/api/attachments/')) {
        setTokenizedSrc(src);
        return;
      }

      try {
        // Extrahiere die Attachment-ID aus der URL
        const match = src.match(/\/api\/attachments\/(\d+)\/download/);
        if (!match) {
          setTokenizedSrc(src);
          return;
        }

        const attachmentId = match[1];
        const response = await fetch(`/api/attachments/${attachmentId}/token`);
        
        if (!response.ok) {
          throw new Error("Fehler beim Anfordern des Tokens");
        }
        
        const data = await response.json();
        setTokenizedSrc(`${src}?token=${data.token}`);
      } catch (error) {
        console.error("Fehler beim Abrufen des Tokens:", error);
        setHasError(true);
        toast({
          title: "Bildladefehler",
          description: "Das Bild konnte nicht geladen werden. Sicherheitstoken konnte nicht abgerufen werden.",
          variant: "destructive",
        });
      }
    };

    fetchToken();
  }, [src, requiresToken, toast]);

  // Bild laden, wenn es im Viewport sichtbar wird oder sofort, wenn lazyLoad = false
  useEffect(() => {
    if (!tokenizedSrc) return; // Warte auf Tokenisierung (falls nötig)

    const loadImage = () => {
      const img = new Image();
      img.src = tokenizedSrc;
      
      img.onload = () => {
        setCurrentSrc(tokenizedSrc);
        setIsLoading(false);
        onLoad?.();
      };
      
      img.onerror = () => {
        setHasError(true);
        setIsLoading(false);
        onError?.();
      };
    };

    if (lazyLoad) {
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          loadImage();
          if (imgRef.current && observerRef.current) {
            observerRef.current.unobserve(imgRef.current);
          }
        }
      });
      
      if (imgRef.current) {
        observerRef.current.observe(imgRef.current);
      }
    } else {
      loadImage();
    }

    return () => {
      if (observerRef.current && imgRef.current) {
        observerRef.current.unobserve(imgRef.current);
        observerRef.current.disconnect();
      }
    };
  }, [tokenizedSrc, lazyLoad, onLoad, onError]);

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
      className="relative overflow-hidden"
      style={{ 
        width, 
        height, 
        backgroundColor: placeholderColor,
      }}
    >
      {/* Bild-Element */}
      <img
        ref={imgRef}
        src={currentSrc || src} 
        alt={alt}
        className={imageClasses}
        width={typeof width === 'number' ? width : undefined}
        height={typeof height === 'number' ? height : undefined}
        loading={lazyLoad ? "lazy" : "eager"}
      />
      
      {/* Ladeindikator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-50">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-primary rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default ResponsiveImage;