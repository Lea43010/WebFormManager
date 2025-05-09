import React from 'react';
import OptimizedImage from './optimized-image';
import { cn } from '@/lib/utils';

/**
 * Bildgrößen für verschiedene Breakpoints
 */
interface BreakpointSizes {
  sm?: string;  // 640px
  md?: string;  // 768px
  lg?: string;  // 1024px
  xl?: string;  // 1280px
  '2xl'?: string; // 1536px
}

interface ResponsiveImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: 'auto' | 'square' | 'video' | 'portrait' | 'landscape' | 'ultra-wide';
  fit?: 'contain' | 'cover' | 'fill';
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  priority?: boolean;
  sizes?: BreakpointSizes;
  rounded?: boolean | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  overlay?: boolean | 'light' | 'dark';
  loading?: 'lazy' | 'eager';
  caption?: string;
  fallbackSrc?: string;
}

/**
 * Responsive Bildkomponente
 * 
 * Verwendet die OptimizedImage-Komponente und fügt zusätzliche Funktionen hinzu:
 * - Vordefinierte Seitenverhältnisse
 * - Responsive Größenanpassungen
 * - Bildabrundugen
 * - Overlay-Optionen
 * - Bildunterschriften
 * 
 * @param src - Bild-URL
 * @param alt - Alternativer Text
 * @param className - CSS-Klassen
 * @param aspectRatio - Seitenverhältnis ('auto', 'square', 'video', 'portrait', 'landscape', 'ultra-wide')
 * @param fit - Wie das Bild in seinen Container passt ('contain', 'cover', 'fill')
 * @param position - Position des Bildes im Container, wenn fit nicht 'fill' ist
 * @param priority - Gibt an, ob das Bild priorisiert geladen werden soll
 * @param sizes - Responsive Größenangaben für verschiedene Breakpoints
 * @param rounded - Abrundungsgrad der Ecken (true für 'md', oder spezifischer Wert)
 * @param overlay - Ob ein Overlay über dem Bild angezeigt werden soll
 * @param loading - Ladeverhalten ('lazy' oder 'eager')
 * @param caption - Bildunterschrift
 * @param fallbackSrc - Fallback-Bild bei Ladefehler
 */
export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  className,
  aspectRatio = 'auto',
  fit = 'cover',
  position = 'center',
  priority = false,
  sizes,
  rounded = false,
  overlay = false,
  loading = 'lazy',
  caption,
  fallbackSrc,
}) => {
  // Seitenverhältnis-Klassen
  const aspectRatioClasses = {
    'auto': '',
    'square': 'aspect-square',
    'video': 'aspect-video',
    'portrait': 'aspect-[3/4]',
    'landscape': 'aspect-[4/3]',
    'ultra-wide': 'aspect-[21/9]',
  };

  // Fit-Klassen
  const fitClasses = {
    'contain': 'object-contain',
    'cover': 'object-cover',
    'fill': 'object-fill',
  };

  // Positions-Klassen
  const positionClasses = {
    'center': 'object-center',
    'top': 'object-top',
    'bottom': 'object-bottom',
    'left': 'object-left',
    'right': 'object-right',
  };

  // Rundings-Klassen
  const getRoundedClass = () => {
    if (!rounded) return '';
    if (rounded === true) return 'rounded-md';
    return `rounded-${rounded}`;
  };

  // Overlay-Klassen
  const getOverlayClass = () => {
    if (!overlay) return '';
    if (overlay === 'light') return 'after:absolute after:inset-0 after:bg-white after:bg-opacity-20';
    if (overlay === 'dark') return 'after:absolute after:inset-0 after:bg-black after:bg-opacity-20';
    return 'after:absolute after:inset-0 after:bg-black after:bg-opacity-10';
  };

  // Größen-String für srcSet
  const getSizesString = () => {
    if (!sizes) return '100vw';

    const sizeEntries = Object.entries(sizes);
    if (sizeEntries.length === 0) return '100vw';

    return sizeEntries
      .map(([breakpoint, size]) => {
        const breakpointMap: Record<string, string> = {
          'sm': '640px',
          'md': '768px',
          'lg': '1024px',
          'xl': '1280px',
          '2xl': '1536px'
        };
        
        // Für den größten Breakpoint keinen Media-Query verwenden
        if (breakpoint === '2xl') {
          return size;
        }
        
        return `(max-width: ${breakpointMap[breakpoint]}) ${size}`;
      })
      .join(', ');
  };

  return (
    <figure className={cn('relative', className)}>
      <div className={cn(
        'relative overflow-hidden',
        aspectRatioClasses[aspectRatio],
        getRoundedClass(),
        getOverlayClass(),
      )}>
        <OptimizedImage
          src={src}
          alt={alt}
          className={cn(
            'w-full h-full',
            fitClasses[fit],
            positionClasses[position],
            getRoundedClass()
          )}
          priority={priority}
          sizes={getSizesString()}
          lazyLoad={loading === 'lazy' && !priority}
          onError={() => console.log('Fehler beim Laden des Bildes')}
        />
      </div>

      {caption && (
        <figcaption className="mt-2 text-sm text-gray-500">
          {caption}
        </figcaption>
      )}
    </figure>
  );
};

export default ResponsiveImage;