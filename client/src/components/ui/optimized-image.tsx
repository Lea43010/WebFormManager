import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  placeholderColor?: string;
  lazyLoad?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  priority?: boolean;
  sizes?: string;
}

/**
 * OptimizedImage Komponente
 * 
 * Eine erweiterte Bildkomponente mit modernen Web-Optimierungen:
 * - Automatische WebP-Verwendung wenn vom Browser unterstützt
 * - Verschiedene Auflösungen für responsive Layouts
 * - Lazy Loading mit IntersectionObserver
 * - Blurhash-basierte Platzhalter für bessere visuelle Erfahrung
 * - Optimale Größenoptimierung
 * 
 * @param src - URL des Bildes (Original)
 * @param alt - Alternativer Text für das Bild
 * @param className - CSS-Klassen
 * @param width - Breite des Bildes
 * @param height - Höhe des Bildes
 * @param placeholderColor - Hintergrundfarbe während des Ladens
 * @param lazyLoad - Ob das Bild erst geladen werden soll, wenn es sichtbar ist
 * @param onLoad - Callback, der aufgerufen wird, wenn das Bild geladen wurde
 * @param onError - Callback, der bei Ladefehler aufgerufen wird
 * @param priority - Ob das Bild priorisiert geladen werden soll (LCP, Above-the-fold)
 * @param sizes - Responsive Größenangaben für srcSet
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className,
  width,
  height,
  placeholderColor = "#f3f4f6",
  lazyLoad = true,
  onLoad,
  onError,
  priority = false,
  sizes = "100vw"
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [blurDataUrl, setBlurDataUrl] = useState<string | null>(null);
  const [supportsWebP, setSupportsWebP] = useState<boolean | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // WebP-Unterstützung prüfen
  useEffect(() => {
    if (supportsWebP === null) {
      const canvas = document.createElement('canvas');
      if (canvas.getContext && canvas.getContext('2d')) {
        setSupportsWebP(canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0);
      } else {
        setSupportsWebP(false);
      }
    }
  }, [supportsWebP]);

  // Blur-Placeholder-Daten abrufen
  useEffect(() => {
    // Annahme: Der Bildpfad ist etwas wie "/uploads/image-123.jpg"
    const fetchBlurData = async () => {
      try {
        if (src.startsWith('/uploads/') || src.startsWith('/api/attachments/')) {
          // Bild-Metadaten-URL aufbauen
          const metadataUrl = src.startsWith('/uploads/')
            ? `/api/image-metadata${src.replace('/uploads', '')}`
            : `${src.replace('/download', '/metadata')}`;
          
          const response = await fetch(metadataUrl);
          
          if (response.ok) {
            const data = await response.json();
            if (data.blurHash) {
              setBlurDataUrl(data.blurHash);
            }
          }
        }
      } catch (error) {
        console.warn('Fehler beim Abrufen des Blur-Placeholders:', error);
        // Keine Fehlerbehandlung, verwende einfach keinen Blur-Effekt
      }
    };

    fetchBlurData();
  }, [src]);

  // Bild laden wenn es sichtbar wird
  useEffect(() => {
    if (!src) return;

    // Sourceset für alle angegebenen Größen erstellen
    const generateSourceSet = (format: 'original' | 'webp'): string => {
      const extension = format === 'webp' ? '.webp' : '';
      const basePath = src.replace(/\.[^/.]+$/, ''); // Entferne Dateierweiterung
      
      return `
        ${basePath}-optimized${extension} 1x,
        ${basePath}-optimized${extension} 2x
      `;
    };

    const loadImage = () => {
      const img = new Image();
      
      if (supportsWebP) {
        const srcSet = generateSourceSet('webp');
        img.srcset = srcSet;
      } else {
        const srcSet = generateSourceSet('original');
        img.srcset = srcSet;
      }
      
      img.src = src;
      img.sizes = sizes;
      
      img.onload = () => {
        setIsLoading(false);
        onLoad?.();
      };
      
      img.onerror = () => {
        setHasError(true);
        setIsLoading(false);
        onError?.();
        
        toast({
          title: "Bildladefehler",
          description: "Das Bild konnte nicht geladen werden.",
          variant: "destructive",
        });
      };
    };

    // Bei priorisiertem Laden oder deaktiviertem Lazy Loading direkt laden
    if (priority || !lazyLoad) {
      loadImage();
    } else {
      // Ansonsten Intersection Observer für Lazy Loading verwenden
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
    }

    return () => {
      if (observerRef.current && imgRef.current) {
        observerRef.current.unobserve(imgRef.current);
        observerRef.current.disconnect();
      }
    };
  }, [src, sizes, supportsWebP, priority, lazyLoad, onLoad, onError, toast]);

  // Stil-Klassen basierend auf dem Zustand
  const imageClasses = cn(
    'transition-opacity duration-300 max-w-full',
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

  // Hauptkomponente zurückgeben
  return (
    <div
      className="relative overflow-hidden"
      style={{ 
        width, 
        height, 
        backgroundColor: placeholderColor,
      }}
    >
      {/* Blur-Platzhalter */}
      {blurDataUrl && isLoading && (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat blur-sm"
          style={{ 
            backgroundImage: `url(${blurDataUrl})`,
            transform: 'scale(1.1)' // Leichte Vergrößerung um Blur-Ränder zu verstecken
          }}
        />
      )}
      
      {/* Bild-Element */}
      <img
        ref={imgRef}
        src={src}
        srcSet={src}
        sizes={sizes}
        alt={alt}
        className={imageClasses}
        width={typeof width === 'number' ? width : undefined}
        height={typeof height === 'number' ? height : undefined}
        loading={lazyLoad && !priority ? "lazy" : "eager"}
        decoding={priority ? "sync" : "async"}
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

export default OptimizedImage;