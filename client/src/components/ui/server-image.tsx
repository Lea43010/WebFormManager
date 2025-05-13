import React, { useState } from 'react';
import { Loader2, FileImage } from 'lucide-react';

interface ServerImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderClassName?: string;
}

/**
 * ServerImage-Komponente
 * 
 * Zeigt ein Bild von einer Server-URL an mit Lade- und Fehlerbehandlung.
 * Diese Komponente vermeidet React Query und andere komplexe Hooks.
 */
const ServerImage: React.FC<ServerImageProps> = ({
  src,
  alt,
  className = '',
  placeholderClassName = 'flex items-center justify-center bg-gray-100 rounded-md',
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  const handleLoad = () => {
    setIsLoading(false);
  };
  
  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };
  
  if (hasError) {
    return (
      <div className={`${placeholderClassName} ${className}`}>
        <FileImage className="w-8 h-8 text-gray-400" />
      </div>
    );
  }
  
  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className={`absolute inset-0 ${placeholderClassName}`}>
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${isLoading ? 'invisible' : 'visible'}`}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
};

export default ServerImage;