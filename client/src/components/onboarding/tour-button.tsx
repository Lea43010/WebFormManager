import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { HardHat } from 'lucide-react';
import { InteractiveTour } from './interactive-tour';

// Interner useLocalStorage Hook für die Tour-Komponente
function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, value]);

  return [value, setValue];
}

interface TourButtonProps {
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const TourButton: React.FC<TourButtonProps> = ({
  className = '',
  variant = 'outline',
  size = 'default'
}) => {
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [hasSeenTour, setHasSeenTour] = useLocalStorage('hasSeenTour', false);

  const startTour = () => {
    setIsTourOpen(true);
  };

  const closeTour = () => {
    setIsTourOpen(false);
  };

  return (
    <>
      <Button 
        onClick={startTour} 
        className={className}
        variant={variant}
        size={size}
      >
        <HardHat className="mr-2 h-4 w-4" />
        {hasSeenTour ? 'Tour wiederholen' : 'Rundgang starten'}
      </Button>
      <InteractiveTour isOpen={isTourOpen} onRequestClose={closeTour} />
    </>
  );
};

export default TourButton;