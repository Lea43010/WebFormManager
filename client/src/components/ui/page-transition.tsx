import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  transitionType?: 'fade' | 'slide' | 'zoom' | 'none';
  duration?: number;
}

/**
 * PageTransition Komponente
 * 
 * Fügt Übergangsanimationen zwischen Seitenwechseln hinzu.
 * 
 * @param children - Die Kinderkomponenten, die animiert werden sollen
 * @param className - CSS-Klassen für den Container
 * @param transitionType - Art der Animation (fade, slide, zoom, none)
 * @param duration - Dauer der Animation in Sekunden
 */
export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className,
  transitionType = 'fade',
  duration = 0.3,
}) => {
  const [location] = useLocation();
  const [key, setKey] = useState(location);

  // Bei Änderung des Pfades den Schlüssel aktualisieren
  useEffect(() => {
    setKey(location);
  }, [location]);

  // Verschiedene Animationsvarianten basierend auf dem gewählten Typ
  const variants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    slide: {
      initial: { x: 20, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: -20, opacity: 0 },
    },
    zoom: {
      initial: { scale: 0.95, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0.95, opacity: 0 },
    },
    none: {
      initial: {},
      animate: {},
      exit: {},
    },
  };

  const currentVariant = variants[transitionType];

  return (
    <div className={cn('overflow-hidden', className)}>
      <AnimatePresence mode="wait">
        <motion.div
          key={key}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={currentVariant}
          transition={{ duration }}
          className="w-full h-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default PageTransition;