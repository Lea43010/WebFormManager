import React from 'react';
import { cn } from '@/lib/utils';

interface Base64ImageProps {
  data: string;
  alt: string;
  className?: string;
  width?: number | string;
  height?: number | string;
}

/**
 * Base64-Bild-Komponente
 * 
 * Zeigt ein Base64-kodiertes Bild an. Nützlich für Blur-Placeholder oder kleine Bilder,
 * bei denen kein zusätzlicher Netzwerkrequest gemacht werden soll.
 * 
 * @param data - Base64-kodierte Bilddaten, mit oder ohne MIME-Typ-Präfix
 * @param alt - Alternativer Text für das Bild
 * @param className - CSS-Klassen
 * @param width - Breite des Bildes
 * @param height - Höhe des Bildes
 */
export const Base64Image: React.FC<Base64ImageProps> = ({
  data,
  alt,
  className,
  width,
  height,
}) => {
  // Prüfen, ob die Daten bereits das data:-Präfix haben
  const src = data.startsWith('data:') 
    ? data 
    : `data:image/jpeg;base64,${data}`;

  return (
    <img
      src={src}
      alt={alt}
      className={cn('', className)}
      width={width}
      height={height}
    />
  );
};

export default Base64Image;