import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

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
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>(lowQualitySrc || '');
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Bild laden, wenn es im Viewport sichtbar wird oder sofort, wenn lazyLoad = false
  useEffect(() => {
    const loadImage = () => {
      const img = new Image();
      img.src = src;
      
      img.onload = () => {
        setCurrentSrc(src);
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
  }, [src, lazyLoad, onLoad, onError]);

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