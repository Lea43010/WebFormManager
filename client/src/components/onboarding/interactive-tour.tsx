import React, { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { 
  HardHat, 
  Hammer, 
  Ruler, 
  Wrench, 
  MapPin, 
  ClipboardList, 
  FileText,
  Truck,
  Users,
  Clock,
  HelpCircle
} from 'lucide-react';

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

// Stile für die Tour-Schritte mit Baustellenthema
const tourStyles = {
  options: {
    arrowColor: '#ff6b00',
    backgroundColor: '#ffffff',
    overlayColor: 'rgba(79, 70, 64, 0.4)',
    primaryColor: '#ff6b00',
    spotlightShadow: '0 0 15px rgba(255, 107, 0, 0.5)',
    textColor: '#4F4640',
    zIndex: 10000,
  },
  tooltipContainer: {
    textAlign: 'left' as const,
  },
  tooltipTitle: {
    fontSize: '16px',
    fontWeight: 'bold' as const,
    margin: '0 0 10px 0',
  },
  buttonNext: {
    backgroundColor: '#ff6b00',
    color: '#ffffff',
    fontSize: '14px',
  },
  buttonBack: {
    color: '#4F4640',
    marginRight: '10px',
    fontSize: '14px',
  },
  buttonSkip: {
    color: '#7c7c7c',
    fontSize: '14px',
  },
  tooltipContent: {
    fontSize: '14px',
    lineHeight: '1.5',
  },
  tooltipFooter: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '15px',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
    borderRadius: '4px',
    color: '#ff6b00',
    fontSize: '12px',
    fontWeight: 'bold' as const,
    padding: '4px 8px',
    marginBottom: '10px',
  },
  iconWrapper: {
    marginRight: '10px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
    borderRadius: '100%',
    padding: '8px',
  },
};

// Tour-Schritte mit Baustellenmetaphern
const getTourSteps = (): Step[] => [
  {
    content: (
      <div>
        <div style={tourStyles.badge}>
          <HardHat size={14} style={{ marginRight: '4px' }} /> Bauleitung
        </div>
        <h3 style={tourStyles.tooltipTitle}>Willkommen auf Ihrer digitalen Baustelle!</h3>
        <div style={tourStyles.tooltipContent}>
          <p>
            Als Bauleiter stehen Ihnen hier alle Werkzeuge zur Verfügung, um Ihre Projekte 
            effizient zu verwalten. Lassen Sie uns einen Rundgang über die "Baustelle" machen.
          </p>
        </div>
      </div>
    ),
    placement: 'center',
    target: 'body',
    title: 'Willkommen bei Bau-Structura',
  },
  {
    content: (
      <div>
        <div style={tourStyles.badge}>
          <Hammer size={14} style={{ marginRight: '4px' }} /> Werkzeugkasten
        </div>
        <h3 style={tourStyles.tooltipTitle}>Ihre digitale Werkzeugkiste</h3>
        <div style={tourStyles.tooltipContent}>
          <p>
            In der Seitenleiste finden Sie alle "Werkzeuge", die Sie für Ihre tägliche Arbeit benötigen.
            Von hier aus können Sie auf alle Funktionen der Anwendung zugreifen.
          </p>
        </div>
      </div>
    ),
    placement: 'right',
    spotlightPadding: 5,
    target: '.sidebar',
    title: 'Navigation',
  },
  {
    content: (
      <div>
        <div style={tourStyles.badge}>
          <Truck size={14} style={{ marginRight: '4px' }} /> Materiallieferanten
        </div>
        <h3 style={tourStyles.tooltipTitle}>Unternehmensverwaltung</h3>
        <div style={tourStyles.tooltipContent}>
          <p>
            Hier verwalten Sie Ihre Zulieferer, Partnerunternehmen und andere Geschäftskontakte - 
            genau wie Ihre Materiallieferanten auf der Baustelle.
          </p>
        </div>
      </div>
    ),
    placement: 'right',
    target: '[data-tour="companies-link"]',
    title: 'Unternehmen',
  },
  {
    content: (
      <div>
        <div style={tourStyles.badge}>
          <Users size={14} style={{ marginRight: '4px' }} /> Bauherren
        </div>
        <h3 style={tourStyles.tooltipTitle}>Kundenverwaltung</h3>
        <div style={tourStyles.tooltipContent}>
          <p>
            Verwalten Sie hier Ihre Bauherren und Auftraggeber - mit allen relevanten Informationen
            und verknüpften Projekten auf einem Blick.
          </p>
        </div>
      </div>
    ),
    placement: 'right',
    target: '[data-tour="customers-link"]',
    title: 'Kunden',
  },
  {
    content: (
      <div>
        <div style={tourStyles.badge}>
          <Ruler size={14} style={{ marginRight: '4px' }} /> Bauprojekte
        </div>
        <h3 style={tourStyles.tooltipTitle}>Projektverwaltung</h3>
        <div style={tourStyles.tooltipContent}>
          <p>
            Hier finden Sie all Ihre Bauprojekte - vom Fundament bis zum Dach.
            Erstellen Sie neue Projekte und behalten Sie den Überblick über laufende Baustellen.
          </p>
        </div>
      </div>
    ),
    placement: 'right',
    target: '[data-tour="projects-link"]',
    title: 'Projekte',
  },
  {
    content: (
      <div>
        <div style={tourStyles.badge}>
          <MapPin size={14} style={{ marginRight: '4px' }} /> Baustellenkoordinaten
        </div>
        <h3 style={tourStyles.tooltipTitle}>Geographische Ansicht</h3>
        <div style={tourStyles.tooltipContent}>
          <p>
            Verschaffen Sie sich einen Überblick über all Ihre Baustellen auf der Karte.
            Von hier aus können Sie schnell zu den einzelnen Projekten navigieren.
          </p>
        </div>
      </div>
    ),
    placement: 'right',
    target: '[data-tour="geo-map-link"]',
    title: 'Kartenansicht',
  },
  {
    content: (
      <div>
        <div style={tourStyles.badge}>
          <ClipboardList size={14} style={{ marginRight: '4px' }} /> Bautagebuch
        </div>
        <h3 style={tourStyles.tooltipTitle}>Baudokumentation</h3>
        <div style={tourStyles.tooltipContent}>
          <p>
            Führen Sie für jedes Projekt ein digitales Bautagebuch - so behalten Sie den Fortschritt
            im Blick und können jederzeit Nachweise erbringen. Wie das gute alte Bautagebuch, nur digital.
          </p>
        </div>
      </div>
    ),
    placement: 'right',
    target: '[data-tour="construction-diary-link"]',
    title: 'Bautagebücher',
  },
  {
    content: (
      <div>
        <div style={tourStyles.badge}>
          <Clock size={14} style={{ marginRight: '4px' }} /> Projektmeilensteine
        </div>
        <h3 style={tourStyles.tooltipTitle}>Zeitplanung und Meilensteine</h3>
        <div style={tourStyles.tooltipContent}>
          <p>
            Planen Sie Ihre Bauabschnitte wie ein Polier den Bauablauf - mit klaren Meilensteinen,
            Zuständigkeiten und Terminen. So bleibt Ihr Projekt im Zeitplan.
          </p>
        </div>
      </div>
    ),
    placement: 'right',
    target: '[data-tour="milestones-link"]',
    title: 'Meilensteine',
  },
  {
    content: (
      <div>
        <div style={tourStyles.badge}>
          <Wrench size={14} style={{ marginRight: '4px' }} /> Qualitätssicherung
        </div>
        <h3 style={tourStyles.tooltipTitle}>Datenqualität</h3>
        <div style={tourStyles.tooltipContent}>
          <p>
            Wie bei der Bauabnahme prüfen Sie hier die Qualität Ihrer Daten.
            Das System hilft Ihnen, Unstimmigkeiten zu erkennen und zu beheben.
          </p>
        </div>
      </div>
    ),
    placement: 'right',
    target: '[data-tour="data-quality-link"]',
    title: 'Datenqualität',
  },
  {
    content: (
      <div>
        <div style={tourStyles.badge}>
          <FileText size={14} style={{ marginRight: '4px' }} /> Bauanleitung
        </div>
        <h3 style={tourStyles.tooltipTitle}>Hilfe & Dokumentation</h3>
        <div style={tourStyles.tooltipContent}>
          <p>
            Wie eine Bauanleitung finden Sie hier alle Informationen und Dokumentationen
            zur Nutzung der Anwendung. Von der Planungsphase bis zur Fertigstellung Ihres Projekts.
          </p>
        </div>
      </div>
    ),
    placement: 'right',
    target: '[data-tour="help-link"]',
    title: 'Hilfe',
  },
  {
    content: (
      <div>
        <div style={tourStyles.badge}>
          <HardHat size={14} style={{ marginRight: '4px' }} /> Baumeister
        </div>
        <h3 style={tourStyles.tooltipTitle}>Jetzt loslegen!</h3>
        <div style={tourStyles.tooltipContent}>
          <p>
            Herzlichen Glückwunsch! Sie haben alle wichtigen Bereiche Ihrer digitalen Baustelle kennengelernt.
            Jetzt können Sie loslegen und Ihre Projekte effizient verwalten.
          </p>
          <p>
            Sollten Sie weitere Fragen haben, nutzen Sie die Hilfe-Sektion oder kontaktieren Sie uns.
          </p>
        </div>
      </div>
    ),
    placement: 'center',
    target: 'body',
    title: 'Tour abgeschlossen',
  },
];

interface TourProps {
  isOpen?: boolean;
  onRequestClose?: () => void;
}

export const InteractiveTour: React.FC<TourProps> = ({
  isOpen = false,
  onRequestClose
}) => {
  // Zustand für die Tour
  const [run, setRun] = useState(isOpen);
  const [steps] = useState<Step[]>(getTourSteps());
  
  // Local Storage Hook für Tour-Status
  const [hasSeenTour, setHasSeenTour] = useLocalStorage('hasSeenTour', false);

  // Tour starten, wenn isOpen sich ändert
  useEffect(() => {
    setRun(isOpen);
  }, [isOpen]);

  // Callback-Handler für Tour-Events
  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type } = data;
    
    // Tour beenden und Status speichern
    const finishedStatuses = ["finished", "skipped"];
    if (status && finishedStatuses.includes(status)) {
      setRun(false);
      setHasSeenTour(true);
      if (onRequestClose) {
        onRequestClose();
      }
    }
  };

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      hideCloseButton
      run={run}
      scrollToFirstStep
      showProgress
      showSkipButton
      steps={steps}
      styles={{
        options: tourStyles.options,
        buttonClose: {
          display: 'none',
        },
        buttonBack: {
          backgroundColor: 'transparent',
          borderWidth: 0,
          color: tourStyles.buttonBack.color,
          fontSize: tourStyles.buttonBack.fontSize,
          marginRight: tourStyles.buttonBack.marginRight,
        },
        buttonNext: {
          backgroundColor: tourStyles.buttonNext.backgroundColor,
          color: tourStyles.buttonNext.color,
          fontSize: tourStyles.buttonNext.fontSize,
        },
        buttonSkip: {
          color: tourStyles.buttonSkip.color,
          fontSize: tourStyles.buttonSkip.fontSize,
        },
      }}
      locale={{
        back: 'Zurück',
        close: 'Schließen',
        last: 'Beenden',
        next: 'Weiter',
        skip: 'Tour überspringen',
      }}
    />
  );
};

export default InteractiveTour;