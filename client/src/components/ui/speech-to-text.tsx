import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpeechToTextProps {
  onTextChange: (text: string) => void;
  placeholder?: string;
  className?: string;
  language?: string;
  initialText?: string;
}

export function SpeechToText({
  onTextChange,
  placeholder = "Hier erscheint der erkannte Text...",
  className = "",
  language = "de-DE",
  initialText = ""
}: SpeechToTextProps) {
  const [isListening, setIsListening] = useState(false);
  const [text, setText] = useState(initialText);
  const [isSupported, setIsSupported] = useState(true);
  const [interim, setInterim] = useState("");
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Überprüfen, ob SpeechRecognition unterstützt wird
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }
    
    // SpeechRecognition-Objekt initialisieren
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = language;
    
    // Event-Handler für Ergebnisse
    recognitionRef.current.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = text;
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += ' ' + transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      setText(finalTranscript);
      setInterim(interimTranscript);
      onTextChange(finalTranscript + ' ' + interimTranscript);
    };
    
    // Event-Handler für Fehler
    recognitionRef.current.onerror = (event: any) => {
      console.error('Spracherkennung Fehler:', event.error);
      if (event.error === 'not-allowed') {
        setIsListening(false);
        alert('Mikrofon-Zugriff wurde verweigert. Bitte erlauben Sie den Zugriff in Ihren Browser-Einstellungen.');
      }
    };
    
    // Event-Handler für Ende der Spracherkennung
    recognitionRef.current.onend = () => {
      if (isListening) {
        recognitionRef.current.start();
      }
    };
    
    // Cleanup
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening, language, text, onTextChange]);
  
  const toggleListening = () => {
    if (!isSupported) {
      alert('Spracherkennung wird in Ihrem Browser nicht unterstützt.');
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
    
    setIsListening(!isListening);
  };
  
  const clearText = () => {
    setText("");
    setInterim("");
    onTextChange("");
  };
  
  return (
    <div className={cn("flex flex-col space-y-2 w-full", className)}>
      <div className="flex items-center space-x-2">
        <Button 
          type="button" 
          variant={isListening ? "destructive" : "default"} 
          onClick={toggleListening}
          disabled={!isSupported}
          className="flex items-center gap-2"
        >
          {isListening ? (
            <>
              <MicOff className="h-4 w-4" />
              Aufnahme stoppen
            </>
          ) : (
            <>
              <Mic className="h-4 w-4" />
              Aufnahme starten
            </>
          )}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={clearText}
          className="flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Löschen
        </Button>
      </div>
      
      <div 
        className={cn(
          "p-3 border rounded-md h-32 overflow-y-auto", 
          isListening ? "border-primary" : "border-gray-300",
          text || interim ? "text-black" : "text-gray-400"
        )}
      >
        {text || interim ? (
          <>
            <span>{text}</span>
            <span className="text-gray-400">{interim}</span>
          </>
        ) : placeholder}
      </div>
      
      {!isSupported && (
        <p className="text-destructive text-sm">
          Spracherkennung wird von Ihrem Browser nicht unterstützt. Bitte verwenden Sie einen modernen Browser wie Chrome, Edge oder Safari.
        </p>
      )}
    </div>
  );
}